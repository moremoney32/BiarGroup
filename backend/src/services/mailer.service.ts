import nodemailer, { type Transporter } from 'nodemailer'
import { pool } from '../db/config'
import { decrypt } from '../helpers/crypto.helper'
import type { RowDataPacket } from 'mysql2'

// ── Cache transporters par config id (évite de recréer une connexion TCP à chaque email) ──
const transporterCache = new Map<number, Transporter>()
let systemTransporter: Transporter | null = null

interface SmtpRow extends RowDataPacket {
  id: number
  host: string
  port: number
  secure: number
  username: string
  password_enc: string
  from_name: string
  from_email: string
  reply_to: string | null
}

function getSystemTransporter(): Transporter {
  if (systemTransporter) return systemTransporter
  systemTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  return systemTransporter
}

// Résout le bon transporter selon le tenant
// Sans tenantId → SMTP système .env (OTP, reset mdp, emails plateforme)
// Avec tenantId → config du tenant en DB, fallback .env si aucune config vérifiée
async function resolveTransporter(tenantId?: number): Promise<{
  transporter: Transporter
  fromName: string
  fromEmail: string
}> {
  if (!tenantId) {
    return {
      transporter: getSystemTransporter(),
      fromName: process.env.EMAIL_DEFAULT_SENDER_NAME ?? 'BIAR GROUP AFRICA',
      fromEmail: process.env.EMAIL_DEFAULT_SENDER ?? '',
    }
  }

  const [rows] = await pool.execute<SmtpRow[]>(
    `SELECT id, host, port, secure, username, password_enc, from_name, from_email, reply_to
     FROM email_smtp_configs
     WHERE tenant_id = ? AND is_default = 1 AND is_verified = 1
     LIMIT 1`,
    [tenantId]
  )

  const cfg = rows[0]
  if (!cfg) {
    console.warn(`[MAILER] Aucune config SMTP vérifiée pour tenant ${tenantId} — fallback .env`)
    return {
      transporter: getSystemTransporter(),
      fromName: process.env.EMAIL_DEFAULT_SENDER_NAME ?? 'BIAR GROUP AFRICA',
      fromEmail: process.env.EMAIL_DEFAULT_SENDER ?? '',
    }
  }

  let t = transporterCache.get(cfg.id)
  if (!t) {
    t = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: Boolean(cfg.secure),
      auth: { user: cfg.username, pass: decrypt(cfg.password_enc) },
    })
    transporterCache.set(cfg.id, t)
  }

  return { transporter: t, fromName: cfg.from_name, fromEmail: cfg.from_email }
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
  messageId?: number
  tenantId?: number
}

export const mailerService = {

  async send({ to, subject, html, replyTo, fromName, messageId, tenantId }: SendMailOptions): Promise<string> {
    const { transporter, fromName: defaultName, fromEmail } = await resolveTransporter(tenantId)
    const name = fromName ?? defaultName
    const from = `"${name}" <${fromEmail}>`
    const apiBase = (process.env.API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '')

    const extraHeaders: Record<string, string> = {
      'X-Mailer': 'BIAR GROUP CPaaS',
      'Precedence': 'bulk',
    }

    if (messageId) {
      const unsubUrl = `${apiBase}/api/v1/email/unsubscribe/${messageId}`
      extraHeaders['List-Unsubscribe']      = `<${unsubUrl}>`
      extraHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }

    const info = await transporter.sendMail({
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

    if (info.rejected && (info.rejected as string[]).length > 0) {
      throw new Error(`Destinataires rejetés : ${JSON.stringify(info.rejected)}`)
    }

    return info.messageId as string
  },

  async verify(tenantId?: number): Promise<boolean> {
    try {
      const { transporter } = await resolveTransporter(tenantId)
      await transporter.verify()
      return true
    } catch {
      return false
    }
  },

  // Appelé après update/delete d'une config pour forcer la recréation du transporter
  invalidateCache(configId: number): void {
    transporterCache.delete(configId)
  },
}
