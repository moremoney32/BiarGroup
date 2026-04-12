export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed'
export type MessageStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed'

export interface SmsCampaign {
  id: number
  tenantId: number
  name: string
  message: string
  senderId: string
  contactListId: number | null
  status: CampaignStatus
  scheduledAt: string | null
  sentCount: number
  deliveredCount: number
  failedCount: number
  totalRecipients: number
  createdAt: string
  updatedAt: string
}

export interface SmsMessage {
  id: number
  tenantId: number
  campaignId: number | null
  to: string
  from: string
  body: string
  status: MessageStatus
  sentAt: string | null
  deliveredAt: string | null
  createdAt: string
}

export interface SmsTemplate {
  id: number
  tenantId: number
  name: string
  body: string
  variables: string[]
  createdAt: string
}
