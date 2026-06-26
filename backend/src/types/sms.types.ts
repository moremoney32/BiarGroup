export type CampaignStatus =
  | 'draft' | 'queued' | 'sending' | 'sent'
  | 'failed' | 'cancelled' | 'scheduled'

// DISTINCTION CRITIQUE :
//   'sent'        = AfricasTalking a accepté (dans leur réseau)
//   'delivered'   = DLR confirme la livraison au handset
//   'undelivered' = DLR dit non livré (hors réseau, expiré, blacklisté)
//   'failed'      = AT a rejeté (numéro invalide, solde insuffisant, etc.)
export type MessageStatus =
  | 'pending' | 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed'

export type SenderIdStatus = 'pending_approval' | 'approved' | 'rejected'

export type OtpStatus = 'pending' | 'used' | 'expired'

export type ScheduledStatus =
  | 'pending' | 'processing' | 'dispatched' | 'cancelled' | 'failed'

// ─── Campagnes ───────────────────────────────────────────────

export type CampaignType = 'promotional' | 'transactional' | 'otp' | 'notification'

export interface SmsCampaign {
  id: number
  tenantId: number
  createdBy: number | null
  name: string
  message: string
  senderId: string
  campaignType: CampaignType
  status: CampaignStatus
  scheduledAt: Date | null
  sentAt: Date | null
  totalRecipients: number
  totalSent: number        // AT accepté
  totalDelivered: number   // DLR confirmé
  totalFailed: number      // AT rejeté
  totalUndelivered: number // DLR non livré
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// ─── Messages individuels ────────────────────────────────────

export interface SmsMessage {
  id: number
  tenantId: number
  campaignId: number | null
  scheduledId: number | null
  phone: string          // E.164 normalisé
  senderId: string
  body: string
  status: MessageStatus
  atMessageId: string | null   // ID AfricasTalking
  atStatusCode: number | null  // Code statut AT
  failureReason: string | null
  sentAt: Date | null          // quand AT a accepté
  deliveredAt: Date | null     // quand DLR confirme
  segments: number
  createdAt: Date
  updatedAt: Date
}

// ─── Templates ───────────────────────────────────────────────

export interface SmsTemplate {
  id: number
  tenantId: number
  name: string
  body: string
  createdBy: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// ─── Sender IDs ──────────────────────────────────────────────

export interface SmsSenderId {
  id: number
  tenantId: number
  senderId: string
  status: SenderIdStatus
  createdBy: number | null
  createdAt: Date
  updatedAt: Date
}

// ─── OTP ─────────────────────────────────────────────────────

export interface SmsOtp {
  id: number
  tenantId: number
  phone: string
  codeHash: string
  status: OtpStatus
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

// ─── Messages Programmés ─────────────────────────────────────

export interface SmsScheduled {
  id: number
  tenantId: number
  createdBy: number | null
  titre: string
  message: string
  senderId: string
  listId: number | null
  recipientCount: number
  scheduledAt: Date   // UTC
  timezone: string
  status: ScheduledStatus
  campaignId: number | null
  dispatchedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// ─── Clés API ────────────────────────────────────────────────

export interface SmsApiKey {
  id: number
  tenant_id: number
  created_by: number | null
  name: string
  key_preview: string  // "bsk_live_****...****abcd" — jamais la clé brute
  module: 'sms' | 'email' | 'whatsapp' | 'all'
  is_active: boolean
  requests_count: number
  last_used_at: Date | null
  expires_at: Date | null
  created_at: Date
}

// ─── Listes de contacts SMS ──────────────────────────────────

export interface SmsContactList {
  id: number
  tenantId: number
  name: string
  description: string | null
  count: number
  createdBy: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface SmsListContact {
  id: number
  listId: number
  tenantId: number
  phone: string    // E.164
  firstName: string | null
  lastName: string | null
  optedOut: boolean
  optedOutAt: Date | null
  createdAt: Date
}

// ─── Réducteur d'URL ─────────────────────────────────────────

export interface SmsShortLink {
  id: number
  tenantId: number
  code: string
  originalUrl: string
  title: string | null
  clicks: number
  expiresAt: Date | null
  createdBy: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
