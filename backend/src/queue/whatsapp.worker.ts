import Bull from 'bull'

const whatsappQueue = new Bull('whatsapp', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
})

export interface WhatsappJob {
  messageId: number
  to: string
  templateName: string
  languageCode: string
  parameters: string[]
  tenantId: number
  campaignId: number | null
}

whatsappQueue.process(async (job) => {
  const data: WhatsappJob = job.data
  // TODO: implement — send via WA Business API, update status
})

whatsappQueue.on('completed', (job) => {
  console.log(`WhatsApp job ${job.id} completed`)
})

whatsappQueue.on('failed', (job, err) => {
  console.error(`WhatsApp job ${job.id} failed:`, err.message)
})

export { whatsappQueue }
