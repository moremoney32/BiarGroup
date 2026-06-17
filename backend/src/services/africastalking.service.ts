import axios from 'axios'

// ── Types AfricasTalking ─────────────────────────────────────

export interface AtRecipient {
  statusCode: number   // 101=Sent, 402=InvalidSenderId, 403=InvalidPhoneNumber, 405=InsufficientBalance…
  number: string
  status: string       // "Success" | "InvalidSenderId" | "InvalidPhoneNumber" | …
  cost: string         // ex: "KES 0.8000"
  messageId: string    // ID AT — sert à matcher le DLR
}

interface AtSmsResponse {
  SMSMessageData: {
    Message: string
    Recipients: AtRecipient[]
  }
}

// DLR reçu en POST depuis AfricasTalking (webhook)
export interface AtDlrPayload {
  id: string            // messageId AT
  status: string        // "Success" | "Failed" | "Buffered" | "Rejected" | "RiskHold"
  phoneNumber: string
  networkCode: string
  failureReason?: string
  retryCount?: string
  cost?: string
}

// ── Mapping statuts AT → notre enum MessageStatus ─────────────

export function mapAtStatusToMessageStatus(
  atStatus: string
): 'sent' | 'delivered' | 'undelivered' {
  switch (atStatus) {
    case 'Success':   return 'delivered'
    case 'Buffered':  return 'sent'       // encore en transit, pas encore livré
    default:          return 'undelivered' // Failed, Rejected, RiskHold
  }
}

// ── Client HTTP AfricasTalking ────────────────────────────────

const getBaseUrl = () =>
  process.env.AT_ENV === 'sandbox'
    ? 'https://api.sandbox.africastalking.com'
    : 'https://api.africastalking.com'

export const africastalkingService = {
  /**
   * Envoie un ou plusieurs SMS via l'API HTTP AfricasTalking
   * @param to      Numéro(s) E.164 — string unique ou tableau (max 1000)
   * @param message Texte du SMS
   * @param from    Sender ID (optionnel — utilise le défaut AT si absent)
   */
  async sendSms(params: {
    to: string | string[]
    message: string
    from?: string
  }): Promise<AtRecipient[]> {
    const username = process.env.AT_USERNAME
    const apiKey   = process.env.AT_API_KEY

    if (!username || !apiKey) {
      throw new Error('AfricasTalking non configuré — ajoutez AT_USERNAME et AT_API_KEY dans .env')
    }

    const numbers = Array.isArray(params.to) ? params.to.join(',') : params.to

    const form = new URLSearchParams()
    form.append('username', username)
    form.append('to', numbers)
    form.append('message', params.message)
    if (params.from) form.append('from', params.from)

    const { data } = await axios.post<AtSmsResponse>(
      `${getBaseUrl()}/version1/messaging`,
      form.toString(),
      {
        headers: {
          apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        timeout: 30_000,
      }
    )

    return data.SMSMessageData.Recipients
  },

  /**
   * Vérifie si les credentials AT sont configurés
   */
  isConfigured(): boolean {
    return Boolean(process.env.AT_USERNAME && process.env.AT_API_KEY)
  },
}
