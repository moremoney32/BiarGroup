import Bull from 'bull'
import { pool } from '../db/config'

const smsQueue = new Bull('sms', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
})

export interface SmsJob {
  messageId: number
  to: string
  from: string
  body: string
  tenantId: number
  campaignId: number | null
}

smsQueue.process(async (job) => {
  const { messageId, to, from, body, tenantId }: SmsJob = job.data
  // TODO: implement — send via SMPP, update message status
})

smsQueue.on('completed', (job) => {
  console.log(`SMS job ${job.id} completed`)
})

smsQueue.on('failed', (job, err) => {
  console.error(`SMS job ${job.id} failed:`, err.message)
})

export { smsQueue }
