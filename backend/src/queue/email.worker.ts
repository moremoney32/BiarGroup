import Bull from 'bull'
import { pool } from '../db/config'
import { mailerService } from '../services/mailer.service'

const emailQueue = new Bull('email-campaign', {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

export interface EmailJobData {
  messageId: number
  campaignId: number
  to: string
  fromName: string
  subject: string
  html: string
}

// Max 3 emails en parallèle
emailQueue.process(3, async (job) => {
  const { messageId, campaignId, to, fromName, subject, html }: EmailJobData = job.data

  try {
    await mailerService.send({ to, subject, html, fromName })

    await pool.execute(
      `UPDATE email_messages SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [messageId]
    )
    await pool.execute(
      `UPDATE email_campaigns SET total_sent = total_sent + 1, updated_at = NOW() WHERE id = ?`,
      [campaignId]
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'

    // Met à jour le message à chaque tentative ratée
    // NE PAS incrémenter total_failed ici — Bull va retenter jusqu'à 3 fois,
    // ce qui causerait total_failed = 3 pour un seul email. Le compteur est
    // incrémenté dans queue.on('failed') qui tire une seule fois après épuisement.
    await pool.execute(
      `UPDATE email_messages SET status = 'failed', error_message = ?, updated_at = NOW() WHERE id = ?`,
      [msg, messageId]
    ).catch(() => {})

    throw err // déclenche le retry Bull
  }
})

emailQueue.on('completed', (job) => {
  console.log(`[EMAIL] ✅ ${job.data.to}`)
})

// Fired une seule fois après épuisement de toutes les tentatives
emailQueue.on('failed', async (job, err) => {
  const { messageId, campaignId, to } = job.data as EmailJobData
  console.error(`[EMAIL] ❌ ${to} (${job.attemptsMade} tentatives) : ${err.message}`)

  // Un seul incrément ici, peu importe le nombre de retries
  await Promise.all([
    pool.execute(
      `UPDATE email_campaigns SET total_failed = total_failed + 1, updated_at = NOW() WHERE id = ?`,
      [campaignId]
    ),
    pool.execute(
      `UPDATE email_messages SET status = 'failed', error_message = ?, updated_at = NOW() WHERE id = ?`,
      [err.message, messageId]
    ),
  ]).catch(() => {})
})

emailQueue.on('drained', async () => {
  await pool.execute(
    `UPDATE email_campaigns
     SET status = 'sent', sent_at = NOW(), updated_at = NOW()
     WHERE status = 'sending'`
  )
  console.log('[EMAIL] Queue vide — toutes les campagnes marquées sent')
})

// Job récurrent — vérifie et exécute les relances dues toutes les heures
const relanceQueue = new Bull('email-relance', {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
})

relanceQueue.process(1, async () => {
  const { emailService } = await import('../services/email.service')
  await emailService.executePendingRelances()
})

// Démarre le cycle toutes les heures (3 600 000 ms)
async function scheduleRelanceCheck() {
  const jobs = await relanceQueue.getRepeatableJobs()
  const alreadyScheduled = jobs.some(j => j.name === 'check-relances')
  if (!alreadyScheduled) {
    await relanceQueue.add('check-relances', {}, { repeat: { every: 60 * 60 * 1000 }, removeOnComplete: true })
    console.log('[RELANCE] Job horaire démarré')
  }
}
scheduleRelanceCheck().catch(console.error)

relanceQueue.on('completed', () => console.log('[RELANCE] ✅ Vérification terminée'))
relanceQueue.on('failed', (_job, err) => console.error('[RELANCE] ❌', err.message))

export { emailQueue }
