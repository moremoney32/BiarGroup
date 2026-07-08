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

export type CampaignType = 'promotional' | 'transactional' | 'otp' | 'notification'

export interface SmsCampaign {
  id: number
  tenant_id: number
  created_by: number | null
  name: string
  message: string
  sender_id: string
  campaign_type: CampaignType
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number        // AT accepté
  total_delivered: number   // DLR confirmé
  total_failed: number      // AT rejeté
  total_undelivered: number // DLR non livré
  total_clicks?: number        // clics réels des liens courts liés (endpoint /sms/r/:code)
  total_unique_clicks?: number // clics uniques (1 par personne/jour — hash IP salé)
  total_cost?: string | number | null // somme des coûts DLR — DECIMAL MySQL arrive en string
  cost_currency?: string | null
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
  approved_at: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

// ── Messages Programmés ───────────────────────────────────────

export interface SmsScheduled {
  id: number
  tenant_id: number
  created_by: number | null
  titre: string          // colonne DB = titre
  message: string
  sender_id: string
  list_id: number | null
  recipient_count: number
  scheduled_at: string   // colonne DB = scheduled_at (UTC)
  timezone: string
  status: ScheduledStatus
  campaign_id: number | null
  dispatched_at: string | null
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
  msg_sent?: number      // messages envoyés à ce numéro (stats DLR)
  msg_delivered?: number // messages délivrés à ce numéro
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
  // pas de colonne "active" en DB — calculé côté frontend : !expires_at || expires_at > now
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
  totalSent: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  activeCampaigns: number
  totalContacts: number
  totalLists: number
}

// ── Clés API ─────────────────────────────────────────────────

export interface SmsApiKey {
  id: number
  tenant_id: number
  created_by: number | null
  name: string
  key_preview: string
  module: 'sms' | 'email' | 'whatsapp' | 'all'
  is_active: boolean
  requests_count: number
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  // Présent uniquement à la création (retourné une seule fois)
  raw_key?: string
}

// ── Payloads (envoi vers l'API) ───────────────────────────────

export interface CreateCampaignPayload {
  name: string
  message: string
  senderId: string
  listIds: number[]
  scheduledAt?: string
  campaignType?: CampaignType
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
  invalid: string[]
  skipped?: number
}
