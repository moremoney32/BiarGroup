import api from './api'

export const emailService = {
  async getSmtpConfigs() {
    const res = await api.get('/email/smtp')
    return res.data.data
  },

  async testSmtp(smtpConfigId: number): Promise<{ ok: boolean }> {
    const res = await api.post(`/email/smtp/${smtpConfigId}/test`)
    return res.data.data
  },
}
