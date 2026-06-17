// ── Statuts ───────────────────────────────────────────────────

export type CampaignStatus =
  | 'draft' | 'queued' | 'sending' | 'sent'
  | 'failed' | 'cancelled' | 'scheduled'

// DISTINCTION CRITIQUE :
// 'sent'        = AT accepté dans leur réseau
// 'delivered'   = DLR confirme la livraison au handset
// 'undelivered' = DLR : non livré (hors réseau, expiré, blacklisté)
// 'failed'      = AT a rejeté (numéro invalide, solde insuffisant, etc.)
export type MessageStatus =
  | 'pending' | 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed'

export type SenderIdStatus = 'pending_approval' | 'approved' | 'rejected'

export type ScheduledStatus =
  | 'pending' | 'processing' | 'dispatched' | 'cancelled' | 'failed'

// ── Campagnes (colonnes DB snake_case) ───────────────────────

export interface SmsCampaign {
  id: number
  tenant_id: number
  created_by: number | null
  name: string
  message: string
  sender_id: string
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number        // AT accepté
  total_delivered: number   // DLR confirmé
  total_failed: number      // AT rejeté
  total_undelivered: number // DLR non livré
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Messages individuels ──────────────────────────────────────

export interface SmsMessage {
  id: number
  tenant_id: number
  campaign_id: number | null
  scheduled_id: number | null
  phone: string          // E.164 normalisé
  sender_id: string
  body: string
  status: MessageStatus
  at_message_id: string | null
  at_status_code: number | null
  failure_reason: string | null
  sent_at: string | null       // quand AT a accepté
  delivered_at: string | null  // quand DLR confirme
  segments: number
  created_at: string
  updated_at: string
}

// ── Templates ─────────────────────────────────────────────────

export interface SmsTemplate {
  id: number
  tenant_id: number
  name: string
  body: string
  created_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Sender IDs ────────────────────────────────────────────────

export interface SmsSenderId {
  id: number
  tenant_id: number
  sender_id: string          // max 11 chars alphanumériques
  status: SenderIdStatus
  country_codes: string | null  // JSON array ou CSV
  approved_by: number | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Messages Programmés ───────────────────────────────────────

export interface SmsScheduled {
  id: number
  tenant_id: number
  created_by: number | null
  name: string
  message: string
  sender_id: string
  list_id: number | null
  send_at: string
  status: ScheduledStatus
  campaign_id: number | null  // créé après dispatch
  created_at: string
  updated_at: string
}

// ── Listes de contacts ────────────────────────────────────────

export interface SmsContactList {
  id: number
  tenant_id: number
  name: string
  description: string | null
  contact_count: number
  created_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Contacts dans une liste ───────────────────────────────────

export interface SmsListContact {
  id: number
  list_id: number
  phone: string    // E.164
  first_name: string | null
  last_name: string | null
  opted_out: boolean
  opted_out_at: string | null
  created_at: string
}

// ── Liens courts ──────────────────────────────────────────────

export interface SmsShortLink {
  id: number
  tenant_id: number
  code: string
  original_url: string
  title: string | null
  clicks: number
  created_by: number | null
  expires_at: string | null
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ── Contact CRM (pour import vers listes SMS) ─────────────────

export interface CrmContact {
  id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string
}

// ── Analytics overview ────────────────────────────────────────

export interface SmsAnalyticsOverview {
  totalCampaigns: number
  totalSent: number
  totalDelivered: number
  totalFailed: number
  totalUndelivered: number
  deliveryRate: number
  totalContacts: number
  totalLists: number
  totalSenderIds: number
}

// ── Payloads (envoi vers l'API) ───────────────────────────────

export interface CreateCampaignPayload {
  name: string
  message: string
  senderId: string
  listIds: number[]
  scheduledAt?: string
}

export interface UpdateCampaignPayload {
  name?: string
  message?: string
  senderId?: string
  listIds?: number[]
  scheduledAt?: string | null
}

export interface CreateScheduledPayload {
  titre: string
  message: string
  senderId: string
  listId?: number
  scheduledAt: string
  timezone?: string
}

export interface AddContactPayload {
  phone: string
  firstName?: string
  lastName?: string
}

export interface AddContactsResult {
  added: number
  skipped: number
}
