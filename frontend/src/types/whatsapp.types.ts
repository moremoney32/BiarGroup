export type WaTemplateStatus = 'pending' | 'approved' | 'rejected'
export type WaMessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface WaCampaign {
  id: number
  tenantId: number
  name: string
  templateId: number
  contactListId: number | null
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduledAt: string | null
  sentCount: number
  deliveredCount: number
  readCount: number
  totalRecipients: number
  createdAt: string
}

export interface WaTemplate {
  id: number
  tenantId: number
  name: string
  language: string
  category: 'marketing' | 'utility' | 'authentication'
  status: WaTemplateStatus
  createdAt: string
}

export interface WaMessage {
  id: number
  tenantId: number
  campaignId: number | null
  to: string
  templateName: string
  status: WaMessageStatus
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
}
