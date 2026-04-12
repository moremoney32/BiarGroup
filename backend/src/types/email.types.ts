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
  textBody: string | null
  listId: number | null
  smtpConfigId: number | null
  status: EmailCampaignStatus
  scheduledAt: Date | null
  sentCount: number
  openCount: number
  clickCount: number
  bounceCount: number
  unsubscribeCount: number
  totalRecipients: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface EmailTemplate {
  id: number
  tenantId: number
  name: string
  subject: string
  htmlBody: string
  textBody: string | null
  variables: string[]
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface EmailList {
  id: number
  tenantId: number
  name: string
  subscriberCount: number
  createdAt: Date
  updatedAt: Date
}

export interface SmtpConfig {
  id: number
  tenantId: number
  name: string
  host: string
  port: number
  user: string
  passwordEncrypted: string
  secure: boolean
  isDefault: boolean
  dailyLimit: number
  sentToday: number
  createdAt: Date
  updatedAt: Date
}
