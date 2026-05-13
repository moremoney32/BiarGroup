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
  messageId?: number   // absent pour les emails de flow
  campaignId?: number  // absent pour les emails de flow
  flowId?: number      // présent pour les emails de flow
  tenantId?: number    // pour résoudre le bon SMTP du tenant
  to: string
  fromName?: string
  subject: string
  html: string
}

// Max 3 emails en parallèle
emailQueue.process(3, async (job) => {
  const { messageId, campaignId, tenantId, to, fromName, subject, html }: EmailJobData = job.data

  try {
    const brevoMsgId = await mailerService.send({ to, subject, html, fromName, messageId, tenantId })

    if (messageId) {
      await pool.execute(
        `UPDATE email_messages SET status = 'sent', sent_at = NOW(), brevo_message_id = ?, updated_at = NOW() WHERE id = ?`,
        [brevoMsgId, messageId]
      )
    }
    if (campaignId) {
      await pool.execute(
        `UPDATE email_campaigns SET total_sent = total_sent + 1, updated_at = NOW() WHERE id = ?`,
        [campaignId]
      )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'

    // Met à jour le message à chaque tentative ratée
    // NE PAS incrémenter total_failed ici — Bull va retenter jusqu'à 3 fois,
    // ce qui causerait total_failed = 3 pour un seul email. Le compteur est
    // incrémenté dans queue.on('failed') qui tire une seule fois après épuisement.
    if (messageId) {
      await pool.execute(
        `UPDATE email_messages SET status = 'failed', error_message = ?, updated_at = NOW() WHERE id = ?`,
        [msg, messageId]
      ).catch(() => {})
    }

    throw err // déclenche le retry Bull
  }
})

emailQueue.on('error', (err) => {
  console.warn('[EMAIL] Redis non disponible :', err.message)
})

emailQueue.on('completed', (job) => {
  console.log(`[EMAIL] ✅ ${job.data.to}`)
})

// Fired une seule fois après épuisement de toutes les tentatives
emailQueue.on('failed', async (job, err) => {
  const { messageId, campaignId, to } = job.data as EmailJobData
  console.error(`[EMAIL] ❌ ${to} (${job.attemptsMade} tentatives) : ${err.message}`)

  // Un seul incrément ici, peu importe le nombre de retries
  const updates: Promise<unknown>[] = []
  if (campaignId) {
    updates.push(pool.execute(
      `UPDATE email_campaigns SET total_failed = total_failed + 1, updated_at = NOW() WHERE id = ?`,
      [campaignId]
    ))
  }
  if (messageId) {
    updates.push(pool.execute(
      `UPDATE email_messages SET status = 'failed', error_message = ?, updated_at = NOW() WHERE id = ?`,
      [err.message, messageId]
    ))
  }
  await Promise.all(updates).catch(() => {})
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

relanceQueue.process('check-relances', 1, async () => {
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

relanceQueue.on('error', (err) => {
  console.warn('[RELANCE] Redis non disponible :', err.message)
})
relanceQueue.on('completed', () => console.log('[RELANCE] ✅ Vérification terminée'))
relanceQueue.on('failed', (_job, err) => console.error('[RELANCE] ❌', err.message))

// Job récurrent — évalue les tests A/B arrivés à échéance toutes les heures
const abTestQueue = new Bull('ab-test-evaluator', {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
})

abTestQueue.process('evaluate-ab-tests', 1, async () => {
  const { emailService } = await import('../services/email.service')
  await emailService.executePendingAbTests()
})

async function scheduleAbTestCheck() {
  const jobs = await abTestQueue.getRepeatableJobs()
  const alreadyScheduled = jobs.some(j => j.name === 'evaluate-ab-tests')
  if (!alreadyScheduled) {
    await abTestQueue.add('evaluate-ab-tests', {}, { repeat: { every: 60 * 60 * 1000 }, removeOnComplete: true })
    console.log('[AB TEST] Job horaire démarré')
  }
}
scheduleAbTestCheck().catch(console.error)

abTestQueue.on('error', (err) => console.warn('[AB TEST] Redis non disponible :', err.message))
abTestQueue.on('completed', () => console.log('[AB TEST] ✅ Évaluation terminée'))
abTestQueue.on('failed', (_job, err) => console.error('[AB TEST] ❌', err.message))

// ── Flow runner — toutes les 15 minutes ─────────────────────────────────────

const flowQueue = new Bull('email-flow-runner', {
  redis: {
    host:     process.env.REDIS_HOST     ?? 'localhost',
    port:     Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  },
})

flowQueue.process('run-flows', 1, async () => {
  const { emailService } = await import('../services/email.service')
  await emailService.executeFlows()
})

async function scheduleFlowRunner() {
  const jobs = await flowQueue.getRepeatableJobs()
  if (!jobs.some(j => j.name === 'run-flows')) {
    await flowQueue.add('run-flows', {}, { repeat: { every: 15 * 60 * 1000 }, removeOnComplete: true })
    console.log('[FLOW] Job 15min démarré')
  }
}
scheduleFlowRunner().catch(console.error)

flowQueue.on('error',     (err)       => console.warn('[FLOW] Redis non disponible :', err.message))
flowQueue.on('completed', ()          => console.log('[FLOW] ✅ Exécution terminée'))
flowQueue.on('failed',    (_job, err) => console.error('[FLOW] ❌', err.message))

export { emailQueue }
