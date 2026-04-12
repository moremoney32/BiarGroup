export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed'
export type MessageStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'

export interface SmsCampaign {
  id: number
  tenantId: number
  name: string
  message: string
  senderId: string
  contactListId: number | null
  status: CampaignStatus
  scheduledAt: Date | null
  sentCount: number
  deliveredCount: number
  failedCount: number
  totalRecipients: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface SmsMessage {
  id: number
  tenantId: number
  campaignId: number | null
  to: string
  from: string
  body: string
  status: MessageStatus
  externalId: string | null
  errorCode: string | null
  sentAt: Date | null
  deliveredAt: Date | null
  createdAt: Date
}

export interface SmsTemplate {
  id: number
  tenantId: number
  name: string
  body: string
  variables: string[]
  createdAt: Date
  updatedAt: Date
}

export interface OtpRecord {
  id: number
  tenantId: number
  phone: string
  code: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}
