import Bull from 'bull'
import { pool } from '../db/config'
import { infobipService } from '../services/infobip.service'

const redisConfig = {
  host:     process.env.REDIS_HOST     ?? 'localhost',
  port:     Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
}

// ── Queue envoi SMS ───────────────────────────────────────────

export interface SmsJob {
  messageId:  number
  phone:      string   // E.164
  senderId:   string
  body:       string
  tenantId:   number
  campaignId: number | null
}

export const smsQueue = new Bull<SmsJob>('sms-send', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
})

// 5 jobs en parallèle — bon équilibre débit / stabilité Infobip API
smsQueue.process(5, async (job) => {
  const { messageId, phone, senderId, body, campaignId } = job.data

  try {
    const results = await infobipService.sendSms({
      to:      phone,
      message: body,
      from:    senderId || undefined,
    })

    const msg = results[0]
    if (!msg) throw new Error('Aucune réponse Infobip pour ce numéro')

    // PENDING / SENT = accepté par Infobip — livraison confirmée par DLR webhook
    const accepted = ['PENDING', 'SENT'].includes(msg.status.groupName)

    if (accepted) {
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'sent', at_message_id = ?, sent_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [msg.messageId, messageId]
      )

      if (campaignId) {
        await pool.execute(
          'UPDATE sms_campaigns SET total_sent = total_sent + 1, updated_at = NOW() WHERE id = ?',
          [campaignId]
        )
        // Vérifier si la campagne est terminée (atomic)
        await pool.execute(
          `UPDATE sms_campaigns SET status = 'sent', sent_at = NOW()
           WHERE id = ? AND status = 'sending'
             AND (total_sent + total_failed) >= total_recipients`,
          [campaignId]
        )
      }
    } else {
      // Infobip a rejeté le message (numéro invalide, sender non autorisé, etc.)
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'failed', failure_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [msg.status.description, messageId]
      )

      if (campaignId) {
        await pool.execute(
          'UPDATE sms_campaigns SET total_failed = total_failed + 1, updated_at = NOW() WHERE id = ?',
          [campaignId]
        )
        await pool.execute(
          `UPDATE sms_campaigns SET status = 'sent', sent_at = NOW()
           WHERE id = ? AND status = 'sending'
             AND (total_sent + total_failed) >= total_recipients`,
          [campaignId]
        )
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'

    await pool.execute(
      `UPDATE sms_messages SET failure_reason = ?, updated_at = NOW() WHERE id = ?`,
      [msg, messageId]
    ).catch(() => {})

    throw err // déclenche le retry Bull
  }
})

smsQueue.on('error', (err) => {
  console.warn('[SMS] Redis non disponible :', err.message)
})

smsQueue.on('completed', (job) => {
  console.log(`[SMS] ✅ ${job.data.phone}`)
})

// Fired une seule fois après épuisement de toutes les tentatives
smsQueue.on('failed', async (job, err) => {
  const { messageId, campaignId, phone } = job.data
  console.error(`[SMS] ❌ ${phone} (${job.attemptsMade} tentatives) : ${err?.message ?? err}`)

  const updates: Promise<unknown>[] = [
    pool.execute(
      "UPDATE sms_messages SET status = 'failed', failure_reason = ?, updated_at = NOW() WHERE id = ?",
      [err?.message ?? 'Échec après 3 tentatives', messageId]
    ),
  ]
  if (campaignId) {
    updates.push(
      pool.execute(
        'UPDATE sms_campaigns SET total_failed = total_failed + 1, updated_at = NOW() WHERE id = ?',
        [campaignId]
      ),
      pool.execute(
        `UPDATE sms_campaigns SET status = 'sent', sent_at = NOW()
         WHERE id = ? AND status = 'sending'
           AND (total_sent + total_failed) >= total_recipients`,
        [campaignId]
      ),
    )
  }
  await Promise.all(updates).catch(() => {})
})

// ── Queue SMS Programmés (cron toutes les 60s) ────────────────

const scheduledQueue = new Bull('sms-scheduled-dispatch', { redis: redisConfig })

scheduledQueue.process('dispatch', 1, async () => {
  const { smsService } = await import('../services/sms.service')
  await smsService.dispatchDueScheduled()
})

async function startScheduledDispatch() {
  const jobs = await scheduledQueue.getRepeatableJobs()
  if (!jobs.some(j => j.name === 'dispatch')) {
    await scheduledQueue.add(
      'dispatch', {},
      { repeat: { every: 60_000 }, removeOnComplete: true }
    )
    console.log('[SMS SCHEDULED] Cron 60s démarré')
  }
}
startScheduledDispatch().catch(console.error)

scheduledQueue.on('error', (err) => console.warn('[SMS SCHEDULED] Redis non disponible :', err.message))
scheduledQueue.on('completed', () => console.log('[SMS SCHEDULED] ✅ Vérification terminée'))
scheduledQueue.on('failed', (_job, err) => console.error('[SMS SCHEDULED] ❌', err?.message ?? err))

export { scheduledQueue }
