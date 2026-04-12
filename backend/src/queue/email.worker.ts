import Bull from 'bull'

const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
})

export interface EmailJob {
  messageId: number
  to: string
  from: string
  fromName: string
  subject: string
  html: string
  text: string | null
  smtpConfigId: number
  tenantId: number
  campaignId: number | null
}

emailQueue.process(async (job) => {
  const data: EmailJob = job.data
  // TODO: implement — send via Nodemailer, handle bounces, update status
})

emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`)
})

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message)
})

export { emailQueue }
