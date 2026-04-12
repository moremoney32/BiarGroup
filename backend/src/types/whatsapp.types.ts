export type WaTemplateStatus = 'pending' | 'approved' | 'rejected'
export type WaMessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface WaCampaign {
  id: number
  tenantId: number
  name: string
  templateId: number
  contactListId: number | null
  parameters: Record<string, string>[]
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduledAt: Date | null
  sentCount: number
  deliveredCount: number
  readCount: number
  failedCount: number
  totalRecipients: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface WaTemplate {
  id: number
  tenantId: number
  name: string
  language: string
  category: 'marketing' | 'utility' | 'authentication'
  status: WaTemplateStatus
  components: WaTemplateComponent[]
  externalId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WaTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons'
  text?: string
  format?: 'text' | 'image' | 'video' | 'document'
  buttons?: WaButton[]
}

export interface WaButton {
  type: 'url' | 'phone_number' | 'quick_reply'
  text: string
  url?: string
  phoneNumber?: string
}

export interface WaMessage {
  id: number
  tenantId: number
  campaignId: number | null
  to: string
  templateName: string
  status: WaMessageStatus
  externalMessageId: string | null
  sentAt: Date | null
  deliveredAt: Date | null
  readAt: Date | null
  createdAt: Date
}
