import api from './api'

export interface EmailStats {
  totalSent: number
  totalRecipients: number
  totalFailed: number
  totalCampaigns: number
  opens: number
  clicks: number
  bounces: number
  hardBounces: number
  softBounces: number
  unsubscribes: number
  spamComplaints: number
  pendingRelances: number
  completedRelances: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubRate: number
  spamRate: number
  deliverRate: number
}

export interface EmailDomain {
  id: number
  domain: string
  provider: 'brevo' | 'sendgrid' | 'custom'
  spf_status: 'unknown' | 'ok' | 'fail'
  dkim_status: 'unknown' | 'ok' | 'fail'
  dmarc_status: 'unknown' | 'ok' | 'fail'
  last_checked_at: string | null
  created_at: string
}

export interface SmtpConfig {
  id: number
  name: string
  provider: 'brevo' | 'sendgrid' | 'custom'
  host: string
  port: number
  secure: boolean
  username: string
  from_name: string
  from_email: string
  reply_to: string | null
  is_default: boolean
  is_verified: boolean
  created_at: string
}

export interface SmtpConfigPayload {
  name: string
  provider: 'brevo' | 'sendgrid' | 'custom'
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
  replyTo?: string | null
}

// Notre API retourne toujours { success, data, message? }
type ApiResp<T> = { success: boolean; data: T; message?: string }

export const emailService = {
  async getStats(): Promise<EmailStats> {
    const res = await api.get<ApiResp<EmailStats>>('/email/campaigns/stats')
    return res.data
  },

  async getSmtpConfigs(): Promise<SmtpConfig[]> {
    const res = await api.get<ApiResp<SmtpConfig[]>>('/email/smtp')
    return res.data
  },

  async createSmtpConfig(payload: SmtpConfigPayload): Promise<{ id: number }> {
    const res = await api.post<ApiResp<{ id: number }>>('/email/smtp', payload)
    return res.data
  },

  async updateSmtpConfig(id: number, payload: Partial<SmtpConfigPayload>): Promise<void> {
    await api.put<ApiResp<null>>(`/email/smtp/${id}`, payload)
  },

  async deleteSmtpConfig(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/email/smtp/${id}`)
  },

  async setSmtpDefault(id: number): Promise<void> {
    await api.patch<ApiResp<null>>(`/email/smtp/${id}/default`)
  },

  async verifySmtpConfig(id: number): Promise<{ verified: boolean }> {
    const res = await api.post<ApiResp<{ verified: boolean }>>(`/email/smtp/${id}/verify`)
    return res.data
  },

  async getDomains(): Promise<EmailDomain[]> {
    const res = await api.get<ApiResp<EmailDomain[]>>('/email/domains')
    return res.data
  },

  async addDomain(payload: { domain: string; provider: 'brevo' | 'sendgrid' | 'custom' }): Promise<{ id: number }> {
    const res = await api.post<ApiResp<{ id: number }>>('/email/domains', payload)
    return res.data
  },

  async deleteDomain(id: number): Promise<void> {
    await api.delete<ApiResp<null>>(`/email/domains/${id}`)
  },

  async verifyDomain(id: number): Promise<EmailDomain> {
    const res = await api.post<ApiResp<EmailDomain>>(`/email/domains/${id}/verify`)
    return res.data
  },
}
