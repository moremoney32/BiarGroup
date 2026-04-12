import api from './api'

export const whatsappService = {
  async syncTemplates(): Promise<void> {
    await api.post('/whatsapp/templates/sync')
  },
}
