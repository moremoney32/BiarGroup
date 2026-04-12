export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed'

export interface EmailCampaign {
  id: number
  tenantId: number
  name: string
  subject: string
  fromName: string
  fromEmail: string
  replyTo: string | null
  templateId: number | null
  htmlBody: string
  status: EmailCampaignStatus
  scheduledAt: string | null
  sentCount: number
  openCount: number
  clickCount: number
  bounceCount: number
  totalRecipients: number
  createdAt: string
}

export interface EmailTemplate {
  id: number
  tenantId: number
  name: string
  subject: string
  htmlBody: string
  thumbnailUrl: string | null
  createdAt: string
}

export interface EmailList {
  id: number
  tenantId: number
  name: string
  subscriberCount: number
  createdAt: string
}
