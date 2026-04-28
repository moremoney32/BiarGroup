import nodemailer, { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS sur port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface SendMailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  fromName?: string
  messageId?: number  // ID interne DB — pour le header List-Unsubscribe
}

export const mailerService = {
  async send({ to, subject, html, replyTo, fromName, messageId }: SendMailOptions): Promise<string> {
    const t = getTransporter()
    const name = fromName ?? process.env.EMAIL_DEFAULT_SENDER_NAME ?? 'BIAR GROUP AFRICA'
    const from = `"${name}" <${process.env.EMAIL_DEFAULT_SENDER}>`
    const apiBase = (process.env.API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '')

    const extraHeaders: Record<string, string> = {
      'X-Mailer': 'BIAR GROUP CPaaS',
      'Precedence': 'bulk',
    }

    // List-Unsubscribe obligatoire depuis fév 2024 (Gmail + Yahoo bulk sender policy)
    if (messageId) {
      const unsubUrl = `${apiBase}/api/v1/email/unsubscribe/${messageId}`
      extraHeaders['List-Unsubscribe']      = `<${unsubUrl}>`
      extraHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }

    const info = await t.sendMail({
      from,
      to,
      subject,
      html,
      text: htmlToText(html),
      replyTo,
      headers: extraHeaders,
    })

    console.log(`[MAILER] from=${from} to=${JSON.stringify(to)}`)
    console.log(`[MAILER] messageId=${info.messageId}`)
    console.log(`[MAILER] accepted=${JSON.stringify(info.accepted)}`)
    console.log(`[MAILER] rejected=${JSON.stringify(info.rejected)}`)
    console.log(`[MAILER] response=${info.response}`)

    if (info.rejected && (info.rejected as string[]).length > 0) {
      throw new Error(`Destinataires rejetés par Brevo : ${JSON.stringify(info.rejected)}`)
    }

    return info.messageId as string
  },

  async verify(): Promise<boolean> {
    try {
      await getTransporter().verify()
      return true
    } catch {
      return false
    }
  },
}
