import api from './api'
import type {
  SmsCampaign, SmsMessage, SmsTemplate, SmsSenderId,
  SmsScheduled, SmsContactList, SmsListContact, SmsShortLink,
  SmsAnalyticsOverview, CrmContact, SmsApiKey,
  CreateCampaignPayload, UpdateCampaignPayload,
  CreateScheduledPayload, AddContactPayload, AddContactsResult,
} from '../types/sms.types'

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  lastPage: number
}

type ApiResp<T> = { success: boolean; data: T; message?: string }
type PagedResp<T> = { success: boolean; data: T; meta: PaginationMeta; message?: string }

// Construit un query string à partir d'un objet (filtre les undefined/null)
function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return q ? `?${q}` : ''
}

export const smsService = {

  // ── Campagnes ────────────────────────────────────────────────

  async getCampaigns(params?: {
    page?: number; limit?: number; status?: string; campaignType?: string; from?: string; to?: string
  }): Promise<{ campaigns: SmsCampaign[]; meta: PaginationMeta }> {
    const url = `/sms/campaigns${qs(params ?? {})}`
    const res = await api.get<PagedResp<SmsCampaign[]>>(url)
    return { campaigns: res.data, meta: res.meta }
  },

  async getCampaign(id: number): Promise<SmsCampaign> {
    const res = await api.get<ApiResp<SmsCampaign>>(`/sms/campaigns/${id}`)
    return res.data
  },

  async createCampaign(data: CreateCampaignPayload): Promise<SmsCampaign> {
    const res = await api.post<ApiResp<SmsCampaign>>('/sms/campaigns', data)
    return res.data
  },

  async updateCampaign(id: number, data: UpdateCampaignPayload): Promise<SmsCampaign> {
    const res = await api.put<ApiResp<SmsCampaign>>(`/sms/campaigns/${id}`, data)
    return res.data
  },

  async deleteCampaign(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/campaigns/${id}`)
  },

  async sendCampaign(id: number): Promise<void> {
    await api.post<ApiResp<null>>(`/sms/campaigns/${id}/send`)
  },

  // ── Messages ─────────────────────────────────────────────────

  async getMessages(params?: {
    page?: number; limit?: number; campaignId?: number; singleOnly?: boolean; status?: string
  }): Promise<{ messages: SmsMessage[]; meta: PaginationMeta }> {
    const url = `/sms/messages${qs(params ?? {})}`
    const res = await api.get<PagedResp<SmsMessage[]>>(url)
    return { messages: res.data, meta: res.meta }
  },

  // ── Templates ────────────────────────────────────────────────

  async getTemplates(): Promise<SmsTemplate[]> {
    const res = await api.get<ApiResp<SmsTemplate[]>>('/sms/templates')
    return res.data
  },

  async createTemplate(data: { name: string; body: string }): Promise<SmsTemplate> {
    const res = await api.post<ApiResp<SmsTemplate>>('/sms/templates', data)
    return res.data
  },

  async updateTemplate(id: number, data: { name?: string; body?: string }): Promise<SmsTemplate> {
    const res = await api.put<ApiResp<SmsTemplate>>(`/sms/templates/${id}`, data)
    return res.data
  },

  async deleteTemplate(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/templates/${id}`)
  },

  // ── Sender IDs ────────────────────────────────────────────────

  async getSenderIds(): Promise<SmsSenderId[]> {
    const res = await api.get<ApiResp<SmsSenderId[]>>('/sms/sender-ids')
    return res.data
  },

  async createSenderId(senderId: string): Promise<SmsSenderId> {
    const res = await api.post<ApiResp<SmsSenderId>>('/sms/sender-ids', { senderId })
    return res.data
  },

  async deleteSenderId(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/sender-ids/${id}`)
  },

  // ── Envoi unique ─────────────────────────────────────────────

  async sendSingle(params: {
    phone: string
    message: string
    senderId?: string
  }): Promise<{ messageId: number; atMessageId: string; status: string }> {
    const res = await api.post<ApiResp<{ messageId: number; atMessageId: string; status: string }>>(
      '/sms/send-single',
      params
    )
    return res.data
  },

  // ── OTP ───────────────────────────────────────────────────────

  async sendOtp(phone: string, senderId?: string): Promise<void> {
    await api.post<ApiResp<null>>('/sms/otp/send', { phone, senderId })
  },

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const res = await api.post<ApiResp<{ verified: boolean }>>('/sms/otp/verify', { phone, code })
    return res.data.verified
  },

  // ── Messages Programmés ───────────────────────────────────────

  async getScheduled(params?: {
    page?: number; limit?: number; status?: string
  }): Promise<{ items: SmsScheduled[]; meta: PaginationMeta }> {
    const url = `/sms/scheduled${qs(params ?? {})}`
    const res = await api.get<PagedResp<SmsScheduled[]>>(url)
    return { items: res.data, meta: res.meta }
  },

  async createScheduled(data: CreateScheduledPayload): Promise<SmsScheduled> {
    const res = await api.post<ApiResp<SmsScheduled>>('/sms/scheduled', data)
    return res.data
  },

  async cancelScheduled(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/scheduled/${id}`)
  },

  // ── Listes de contacts ────────────────────────────────────────

  async getContactLists(): Promise<SmsContactList[]> {
    const res = await api.get<ApiResp<SmsContactList[]>>('/sms/contact-lists')
    return res.data
  },

  async createContactList(data: { name: string; description?: string }): Promise<SmsContactList> {
    const res = await api.post<ApiResp<SmsContactList>>('/sms/contact-lists', data)
    return res.data
  },

  async deleteContactList(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/contact-lists/${id}`)
  },

  async getContactsInList(listId: number, params?: {
    page?: number; limit?: number; search?: string; optedOut?: boolean
  }): Promise<{ contacts: SmsListContact[]; meta: PaginationMeta }> {
    const url = `/sms/contact-lists/${listId}/contacts${qs(params ?? {})}`
    const res = await api.get<PagedResp<SmsListContact[]>>(url)
    return { contacts: res.data, meta: res.meta }
  },

  async addContactsToList(listId: number, contacts: AddContactPayload[], defaultIso?: string): Promise<AddContactsResult> {
    const res = await api.post<ApiResp<AddContactsResult>>(
      `/sms/contact-lists/${listId}/contacts`,
      { contacts, defaultIso }
    )
    return res.data
  },

  // ── Import CRM ────────────────────────────────────────────────

  async getCrmContacts(params?: {
    search?: string; page?: number; limit?: number
  }): Promise<{ contacts: CrmContact[]; meta: PaginationMeta }> {
    const url = `/sms/crm-contacts${qs(params ?? {})}`
    const res = await api.get<PagedResp<CrmContact[]>>(url)
    return { contacts: res.data, meta: res.meta }
  },

  async importFromCrm(listId: number, contactIds: number[]): Promise<{ added: number; skipped: number }> {
    const res = await api.post<ApiResp<{ added: number; skipped: number }>>(
      `/sms/contact-lists/${listId}/import-from-crm`,
      { contactIds }
    )
    return res.data
  },

  async importContactsCsv(listId: number, file: File): Promise<{ added: number; invalid: string[]; skipped: number }> {
    const form = new FormData()
    form.append('file', file)
    // apiFetch détecte FormData et omet Content-Type (le navigateur ajoute le boundary)
    const res = await api.post<ApiResp<{ added: number; invalid: string[]; skipped: number }>>(
      `/sms/contact-lists/${listId}/import-csv`,
      form
    )
    return res.data
  },

  // ── Réducteur d'URL ───────────────────────────────────────────

  async getShortLinks(): Promise<SmsShortLink[]> {
    const res = await api.get<ApiResp<SmsShortLink[]>>('/sms/links')
    return res.data
  },

  async createShortLink(data: {
    url: string; title?: string; expiresInDays?: number; customCode?: string
  }): Promise<SmsShortLink> {
    const res = await api.post<ApiResp<SmsShortLink>>('/sms/links', data)
    return res.data
  },

  async deleteShortLink(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/links/${id}`)
  },

  async getShortLinkStats(id: number): Promise<{ total_clicks: number; unique_clicks: number; clicks_by_day: { date: string; count: number }[] }> {
    const res = await api.get<ApiResp<{ total_clicks: number; unique_clicks: number; clicks_by_day: { date: string; count: number }[] }>>(`/sms/links/${id}/stats`)
    return res.data
  },

  // ── Analytics ─────────────────────────────────────────────────

  async getAnalyticsOverview(): Promise<SmsAnalyticsOverview> {
    const res = await api.get<ApiResp<SmsAnalyticsOverview>>('/sms/analytics/overview')
    return res.data
  },

  // ── Clés API ─────────────────────────────────────────────────

  async getApiKeys(): Promise<SmsApiKey[]> {
    const res = await api.get<ApiResp<SmsApiKey[]>>('/sms/api-keys')
    return res.data
  },

  async createApiKey(data: { name: string; module?: string }): Promise<SmsApiKey> {
    const res = await api.post<ApiResp<SmsApiKey>>('/sms/api-keys', data)
    return res.data
  },

  async deleteApiKey(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/sms/api-keys/${id}`)
  },
}
