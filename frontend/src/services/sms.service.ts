import api from './api'

export const smsService = {
  async sendOtp(phone: string): Promise<void> {
    await api.post('/sms/otp/send', { phone })
  },

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const res = await api.post('/sms/otp/verify', { phone, code })
    return res.data.data.verified
  },
}
