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

interface SendMailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
  fromName?: string
}

export const mailerService = {
  async send({ to, subject, html, replyTo, fromName }: SendMailOptions): Promise<void> {
    const t = getTransporter()
    const name = fromName ?? process.env.EMAIL_DEFAULT_SENDER_NAME ?? 'BIAR GROUP AFRICA'
    const from = `"${name}" <${process.env.EMAIL_DEFAULT_SENDER}>`

    const info = await t.sendMail({ from, to, subject, html, replyTo })

    console.log(`[MAILER] from=${from} to=${JSON.stringify(to)}`)
    console.log(`[MAILER] messageId=${info.messageId}`)
    console.log(`[MAILER] accepted=${JSON.stringify(info.accepted)}`)
    console.log(`[MAILER] rejected=${JSON.stringify(info.rejected)}`)
    console.log(`[MAILER] response=${info.response}`)

    if (info.rejected && (info.rejected as string[]).length > 0) {
      throw new Error(`Destinataires rejetés par Brevo : ${JSON.stringify(info.rejected)}`)
    }
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
