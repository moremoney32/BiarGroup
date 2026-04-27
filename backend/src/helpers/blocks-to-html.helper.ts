interface Block {
  id: string
  type: 'texte' | 'image' | 'bouton' | 'separateur' | 'reseaux' | 'html'
  content?: string
  imageUrl?: string
  imageAlt?: string
  buttonLabel?: string
  buttonUrl?: string
  buttonColor?: string
}

interface ContactVars {
  prenom?: string
  nom?: string
  email?: string
  entreprise?: string
}

const SOCIAL = [
  { label: 'f',  color: '#1877f2', name: 'Facebook' },
  { label: 'in', color: '#0077b5', name: 'LinkedIn' },
  { label: 'tw', color: '#1da1f2', name: 'Twitter' },
  { label: 'ig', color: '#e1306c', name: 'Instagram' },
]

function applyVars(text: string, vars: ContactVars): string {
  return text
    .replace(/\{\{prenom\}\}/g, vars.prenom ?? '')
    .replace(/\{\{nom\}\}/g, vars.nom ?? '')
    .replace(/\{\{email\}\}/g, vars.email ?? '')
    .replace(/\{\{entreprise\}\}/g, vars.entreprise ?? '')
}

function renderBlock(block: Block, vars: ContactVars, apiBase: string, messageId?: number): string {
  switch (block.type) {
    case 'texte':
      return `
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#374151;">
          ${applyVars((block.content ?? '').replace(/\n/g, '<br>'), vars)}
        </p>`

    case 'image':
      if (!block.imageUrl) return ''
      return `
        <div style="margin:0 0 16px 0;">
          <img src="${block.imageUrl}" alt="${block.imageAlt ?? ''}"
            style="max-width:100%;border-radius:8px;display:block;" />
        </div>`

    case 'bouton': {
      const rawUrl = block.buttonUrl ?? ''
      if (!rawUrl || rawUrl === 'https://' || rawUrl === 'http://') return ''
      // Encapsule le lien dans l'endpoint de tracking — fonctionne en localhost et en prod
      const href = (apiBase && messageId)
        ? `${apiBase}/api/v1/email/track/click/${messageId}?url=${encodeURIComponent(rawUrl)}`
        : rawUrl
      return `
        <div style="margin:0 0 16px 0;text-align:center;">
          <a href="${href}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;padding:12px 28px;background-color:${block.buttonColor ?? '#F4511E'};
                   color:#ffffff;font-size:14px;font-weight:600;border-radius:8px;
                   text-decoration:none;">
            ${block.buttonLabel ?? 'Cliquez ici'}
          </a>
        </div>`
    }

    case 'separateur':
      return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />`

    case 'reseaux': {
      const icons = SOCIAL.map(s => `
        <a href="#" target="_blank" rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;justify-content:center;
                 width:32px;height:32px;border-radius:50%;background-color:${s.color};
                 color:#fff;font-size:12px;font-weight:700;text-decoration:none;margin:0 4px;">
          ${s.label}
        </a>`).join('')
      return `<div style="text-align:center;margin:0 0 16px 0;">${icons}</div>`
    }

    case 'html':
      return `<div style="margin:0 0 16px 0;">${block.content ?? ''}</div>`

    default:
      return ''
  }
}

export function blocksToHtml(
  blocks: Block[],
  expediteur: string,
  sujet: string,
  vars: ContactVars = {},
  messageId?: number
): string {
  // Fonctionne en localhost ET en prod — plus de restriction isPublicUrl
  const apiBase = (process.env.API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '')

  const blocksHtml = blocks.map(b => renderBlock(b, vars, apiBase, messageId)).join('')

  // Pixel de tracking ouverture — toujours présent quand messageId existe
  const trackingPixel = messageId
    ? `<img src="${apiBase}/api/v1/email/track/open/${messageId}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`
    : ''

  // Lien désabonnement — toujours présent quand messageId existe
  const unsubLink = messageId
    ? `<a href="${apiBase}/api/v1/email/unsubscribe/${messageId}" style="color:#F4511E;text-decoration:underline;">Se désabonner</a>`
    : `<span style="color:#9ca3af;">Se désabonner</span>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${sujet}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background-color:#F4511E;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                ${expediteur}
              </h1>
              ${sujet ? `<p style="margin:6px 0 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${sujet}</p>` : ''}
            </td>
          </tr>

          <!-- Contenu -->
          <tr>
            <td style="padding:28px 32px;">
              ${blocksHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #f3f4f6;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#4b5563;">${expediteur}</p>
              <p style="margin:0 0 12px 0;font-size:11px;color:#9ca3af;">SARLU — Kinshasa, RDC</p>
              <p style="margin:0;font-size:11px;">${unsubLink}</p>
            </td>
          </tr>

        </table>
        ${trackingPixel}
      </td>
    </tr>
  </table>
</body>
</html>`
}
