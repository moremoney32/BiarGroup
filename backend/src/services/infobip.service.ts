import axios from 'axios'

export interface InfobipSmsResult {
  messageId: string
  to: string
  status: {
    groupName: 'PENDING' | 'SENT' | 'DELIVERED' | 'UNDELIVERABLE' | 'EXPIRED' | 'REJECTED'
    name: string
    description: string
  }
}

// Webhook DLR reçu depuis Infobip (POST vers /api/v1/sms/dlr)
export interface InfobipDlrPayload {
  results: Array<{
    messageId: string
    to: string
    mccMnc?: string
    sentAt?: string
    doneAt?: string
    status: {
      groupId: number
      groupName: string
      id: number
      name: string
      description: string
    }
    error: {
      groupId: number
      groupName: string
      id?: number
      name?: string
      permanent: boolean
    }
    price?: {
      pricePerMessage: number
      currency: string
    }
  }>
}

// PENDING / SENT = message accepté par l'opérateur, pas encore livré au handset
// DELIVERED = livré avec succès au destinataire
// UNDELIVERABLE / EXPIRED / REJECTED = échec définitif
export function mapInfobipStatus(groupName: string): 'sent' | 'delivered' | 'undelivered' {
  switch (groupName) {
    case 'DELIVERED': return 'delivered'
    case 'PENDING':
    case 'SENT':      return 'sent'
    default:          return 'undelivered'
  }
}

const getConfig = () => {
  const apiKey  = process.env.INFOBIP_API_KEY
  const baseUrl = process.env.INFOBIP_BASE_URL
  if (!apiKey || !baseUrl) {
    throw new Error('Infobip non configuré — INFOBIP_API_KEY et INFOBIP_BASE_URL requis dans .env')
  }
  return { apiKey, baseUrl }
}

export const infobipService = {
  /**
   * Envoie un ou plusieurs SMS via l'API Infobip (endpoint /sms/3/messages)
   * @param to      Numéro(s) E.164 — ex: "+237693332788" ou ["237693332788"]
   * @param message Texte du SMS
   * @param from    Sender ID alphanumérique 1–11 chars (optionnel)
   */
  async sendSms(params: {
    to: string | string[]
    message: string
    from?: string
  }): Promise<InfobipSmsResult[]> {
    const { apiKey, baseUrl } = getConfig()
    const phones = Array.isArray(params.to) ? params.to : [params.to]

    const { data } = await axios.post<{
      messages: Array<{
        messageId: string
        to: string
        status: { groupName: string; name: string; description: string }
      }>
    }>(
      `https://${baseUrl}/sms/3/messages`,
      {
        messages: [{
          destinations: phones.map(p => ({ to: p.replace(/^\+/, '') })),
          sender: params.from || process.env.INFOBIP_SENDER || 'BIAR',
          content: { text: params.message },
          // API v3 : le DLR se déclare via webhooks.delivery.url — notifyUrl est
          // un champ de l'ancienne API, ignoré silencieusement par /sms/3/messages
          // (confirmé par le support Infobip, ticket IB#4492484)
          webhooks: {
            delivery: {
              url: `${(process.env.API_BASE_URL ?? 'https://biargroup.sbs').replace(/\/+$/, '')}/api/v1/sms/dlr?token=${process.env.INFOBIP_DLR_SECRET}`,
            },
            contentType: 'application/json',
          },
        }],
      },
      {
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30_000,
      }
    )

    return data.messages.map(m => ({
      messageId: m.messageId,
      to: m.to,
      status: {
        groupName: m.status.groupName as InfobipSmsResult['status']['groupName'],
        name: m.status.name,
        description: m.status.description,
      },
    }))
  },

  /**
   * Récupère les rapports de livraison en attente (polling — plan B du webhook notifyUrl).
   * ⚠ Endpoint "consommant" : chaque rapport n'est retourné qu'UNE SEULE fois par Infobip.
   * Il faut donc impérativement le traiter (handleDlr) dans la foulée.
   */
  async getDeliveryReports(limit = 250): Promise<InfobipDlrPayload['results']> {
    const { apiKey, baseUrl } = getConfig()

    const { data } = await axios.get<InfobipDlrPayload>(
      `https://${baseUrl}/sms/1/reports`,
      {
        params: { limit },
        headers: {
          Authorization: `App ${apiKey}`,
          Accept: 'application/json',
        },
        timeout: 30_000,
      }
    )

    return data.results ?? []
  },

  isConfigured(): boolean {
    return Boolean(process.env.INFOBIP_API_KEY && process.env.INFOBIP_BASE_URL)
  },
}
