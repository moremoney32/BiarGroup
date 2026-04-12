import https from 'https'
import http from 'http'
import { URL } from 'url'

const EMAIL_API_URL = process.env.EMAIL_API_URL || ''
const DEFAULT_SENDER = 'biar.groupafrica@gmail.com'

interface MailPayload {
  receiver: string
  sender: string
  subject: string
  message: string
}

function postJson(url: string, payload: MailPayload): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http

    const req = lib.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        family: 4, // force IPv4 — IPv6 non dispo dans Docker
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        // on consomme la réponse pour libérer la connexion
        res.resume()
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Mailer API returned ${res.statusCode}`))
        }
        resolve()
      }
    )

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BIAR GROUP AFRICA</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3B2F8F 0%,#E91E8C 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:1px;">
                BIAR GROUP AFRICA
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">
                Actor Hub · CPaaS Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#FFFFFF;padding:40px;border-left:1px solid #E8E8F0;border-right:1px solid #E8E8F0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A1A2E;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:12px;line-height:1.6;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.<br/>
                © ${new Date().getFullYear()} BIAR GROUP AFRICA SARLU — Kinshasa, RDC
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function otpTemplate(params: { firstName: string; otp: string }): string {
  const content = `
    <p style="margin:0 0 8px;color:#1A1A2E;font-size:16px;font-weight:600;">
      Bonjour ${params.firstName},
    </p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
      Merci de vous être inscrit sur <strong>BIAR Actor Hub</strong>.
      Veuillez confirmer votre adresse email en entrant le code ci-dessous :
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center">
          <div style="display:inline-block;background:linear-gradient(135deg,#3B2F8F,#E91E8C);border-radius:12px;padding:3px;">
            <div style="background:#FFFFFF;border-radius:10px;padding:20px 48px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1A1A2E;">
                ${params.otp}
              </span>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#555;font-size:13px;line-height:1.6;text-align:center;">
      Ce code est valable <strong>2 minutes</strong>.<br/>
      Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
    </p>

    <hr style="border:none;border-top:1px solid #F0F0F6;margin:32px 0;" />
    <p style="margin:0;color:#AAA;font-size:12px;text-align:center;">
      Pour toute question : <a href="mailto:support@biargroup.cd" style="color:#E91E8C;text-decoration:none;">support@biargroup.cd</a>
    </p>
  `
  return baseLayout(content)
}

function resetPasswordTemplate(params: { firstName: string; resetLink: string }): string {
  const content = `
    <p style="margin:0 0 8px;color:#1A1A2E;font-size:16px;font-weight:600;">
      Bonjour ${params.firstName},
    </p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe <strong>BIAR Actor Hub</strong>.
      Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center">
          <a href="${params.resetLink}"
             style="display:inline-block;background:linear-gradient(135deg,#3B2F8F,#E91E8C);
                    color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;
                    padding:14px 40px;border-radius:8px;letter-spacing:0.5px;">
            Réinitialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#555;font-size:13px;line-height:1.6;text-align:center;">
      Ce lien expire dans <strong>1 heure</strong>.<br/>
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>

    <p style="margin:16px 0 0;color:#AAA;font-size:11px;text-align:center;word-break:break-all;">
      Ou copiez ce lien : ${params.resetLink}
    </p>

    <hr style="border:none;border-top:1px solid #F0F0F6;margin:32px 0;" />
    <p style="margin:0;color:#AAA;font-size:12px;text-align:center;">
      Pour toute question : <a href="mailto:support@biargroup.cd" style="color:#E91E8C;text-decoration:none;">support@biargroup.cd</a>
    </p>
  `
  return baseLayout(content)
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

export async function sendOtpEmail(params: {
  to: string
  firstName: string
  otp: string
}): Promise<void> {
  await postJson(EMAIL_API_URL, {
    receiver: params.to,
    sender: DEFAULT_SENDER,
    subject: `${params.otp} — Votre code de vérification BIAR`,
    message: otpTemplate({ firstName: params.firstName, otp: params.otp }),
  })
}

export async function sendResetPasswordEmail(params: {
  to: string
  firstName: string
  resetToken: string
}): Promise<void> {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/reset-password?token=${params.resetToken}`

  await postJson(EMAIL_API_URL, {
    receiver: params.to,
    sender: DEFAULT_SENDER,
    subject: 'Réinitialisation de votre mot de passe BIAR Actor Hub',
    message: resetPasswordTemplate({ firstName: params.firstName, resetLink }),
  })
}
