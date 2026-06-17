import { Request, Response } from 'express'
import { z } from 'zod'
import { smsService } from '../services/sms.service'
import { sendSuccess, sendError } from '../helpers/response.helper'
import type { AtDlrPayload } from '../services/africastalking.service'

// ── Schemas Zod ───────────────────────────────────────────────

const createCampaignSchema = z.object({
  name:        z.string().min(1, 'Le nom est requis').max(200),
  message:     z.string().min(1, 'Le message est requis').max(4096),
  senderId:    z.string().regex(/^[A-Za-z0-9]{1,11}$/, 'Sender ID : 1–11 caractères alphanumériques'),
  listIds:     z.array(z.number().int().positive()).min(1, 'Sélectionnez au moins une liste'),
  scheduledAt: z.string().datetime().optional(),
})

const updateCampaignSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  message:     z.string().min(1).max(4096).optional(),
  senderId:    z.string().regex(/^[A-Za-z0-9]{1,11}$/).optional(),
  listIds:     z.array(z.number().int().positive()).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
})

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().min(1).max(4096),
})

const senderIdSchema = z.object({
  senderId: z.string().regex(/^[A-Za-z0-9]{1,11}$/, 'Sender ID : 1–11 caractères alphanumériques'),
})

const otpSendSchema = z.object({
  phone:    z.string().min(7),
  senderId: z.string().regex(/^[A-Za-z0-9]{1,11}$/).optional(),
})

const otpVerifySchema = z.object({
  phone: z.string().min(7),
  code:  z.string().length(6),
})

const createScheduledSchema = z.object({
  titre:       z.string().min(1).max(200),
  message:     z.string().min(1).max(4096),
  senderId:    z.string().regex(/^[A-Za-z0-9]{1,11}$/, 'Sender ID invalide'),
  listId:      z.number().int().positive().optional(),
  scheduledAt: z.string().datetime('Format datetime invalide'),
  timezone:    z.string().optional(),
})

const sendSingleSchema = z.object({
  phone:    z.string().min(7, 'Numéro trop court'),
  message:  z.string().min(1, 'Message requis').max(4096),
  senderId: z.string().regex(/^[A-Za-z0-9]{1,11}$/).optional(),
})

const createShortLinkSchema = z.object({
  url:           z.string().url('URL invalide'),
  title:         z.string().max(100).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

const addContactsSchema = z.object({
  contacts: z.array(z.object({
    phone:     z.string().min(7),
    firstName: z.string().max(100).optional(),
    lastName:  z.string().max(100).optional(),
  })).min(1).max(10_000),
  defaultIso: z.string().length(2).optional(),
})

// ── Helpers ───────────────────────────────────────────────────

function getPage(req: Request) {
  return { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 }
}

function htmlPage(title: string, body: string, success: boolean): string {
  const color = success ? '#16A34A' : '#DC2626'
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title} — BIAR Actor Hub</title>
    <style>body{font-family:Arial,sans-serif;background:#f9fafb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .box{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:480px;width:90%;padding:40px;text-align:center}
    h1{color:${color};font-size:20px;margin:0 0 16px}.icon{font-size:48px;margin-bottom:16px}p{color:#374151;font-size:14px;line-height:1.6}
    .brand{color:#E91E8C;font-weight:700;font-size:13px;margin-top:24px}</style>
  </head><body><div class="box">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${title}</h1><p>${body}</p>
    <p class="brand">BIAR GROUP AFRICA — Actor Hub</p>
  </div></body></html>`
}

// ── Controller ────────────────────────────────────────────────

export const smsController = {

  // ── Campagnes ───────────────────────────────────────────────

  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPage(req)
      const result = await smsService.getCampaigns(req.tenantId!, {
        page, limit, status: req.query.status as string | undefined,
      })
      sendSuccess(res, result.campaigns, 'Campagnes récupérées', 200, {
        page, perPage: limit, total: result.total,
        lastPage: Math.ceil(result.total / limit),
      })
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const campaign = await smsService.getCampaignById(Number(req.params.id), req.tenantId!)
      if (!campaign) { sendError(res, 404, 'NOT_FOUND', 'Campagne introuvable'); return }
      sendSuccess(res, campaign)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createCampaign(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createCampaignSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const campaign = await smsService.createCampaign(parsed.data, req.tenantId!, req.user!.id)
      sendSuccess(res, campaign, 'Campagne créée', 201)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('non approuvé') || msg.includes('invalide') ? 400 : 500, 'ERROR', msg)
    }
  },

  async updateCampaign(req: Request, res: Response): Promise<void> {
    try {
      const parsed = updateCampaignSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const campaign = await smsService.updateCampaign(Number(req.params.id), parsed.data, req.tenantId!)
      sendSuccess(res, campaign, 'Campagne mise à jour')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 400, 'ERROR', msg)
    }
  },

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      await smsService.deleteCampaign(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Campagne supprimée')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  async sendCampaign(req: Request, res: Response): Promise<void> {
    try {
      const result = await smsService.sendCampaign(Number(req.params.id), req.tenantId!)
      sendSuccess(res, result, `${result.queued} messages mis en file d'envoi`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 400, 'ERROR', msg)
    }
  },

  // ── Messages ────────────────────────────────────────────────

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPage(req)
      const result = await smsService.getMessages(req.tenantId!, {
        page, limit,
        campaignId: req.query.campaignId ? Number(req.query.campaignId) : undefined,
        status:     req.query.status as string | undefined,
      })
      sendSuccess(res, result.messages, 'Messages récupérés', 200, {
        page, perPage: limit, total: result.total,
        lastPage: Math.ceil(result.total / limit),
      })
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  /**
   * Webhook DLR AfricasTalking — endpoint public
   * Vérifié par token secret dans l'URL (?token=...)
   * NE PAS mettre derrière authMiddleware
   */
  async handleDlr(req: Request, res: Response): Promise<void> {
    try {
      const token = req.query.token as string
      if (token !== process.env.AT_DLR_SECRET) {
        res.status(401).send('Unauthorized'); return
      }

      const payload = req.body as AtDlrPayload
      if (!payload.id) { res.status(400).send('Missing id'); return }

      await smsService.handleDlr(payload.id, payload.status, payload.failureReason)
      // AT attend toujours un 200 — sinon il retente
      res.status(200).send('OK')
    } catch (err) {
      console.error('[DLR]', err)
      res.status(200).send('OK') // toujours 200 pour éviter les reliveries AT
    }
  },

  // ── Templates ────────────────────────────────────────────────

  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await smsService.getTemplates(req.tenantId!)
      sendSuccess(res, templates)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createTemplateSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const tpl = await smsService.createTemplate(parsed.data, req.tenantId!, req.user!.id)
      sendSuccess(res, tpl, 'Template créé', 201)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createTemplateSchema.partial().safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const tpl = await smsService.updateTemplate(Number(req.params.id), parsed.data, req.tenantId!)
      sendSuccess(res, tpl, 'Template mis à jour')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      await smsService.deleteTemplate(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Template supprimé')
    } catch (err) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Erreur')
    }
  },

  // ── Sender IDs ───────────────────────────────────────────────

  async getSenderIds(req: Request, res: Response): Promise<void> {
    try {
      const ids = await smsService.getSenderIds(req.tenantId!)
      sendSuccess(res, ids)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createSenderId(req: Request, res: Response): Promise<void> {
    try {
      const parsed = senderIdSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const apiBase = `${req.protocol}://${req.get('host')}`
      const sid = await smsService.createSenderId(parsed.data.senderId, req.tenantId!, req.user!.id, apiBase)
      sendSuccess(res, sid, 'Sender ID soumis — l\'administrateur a été notifié par email', 201)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('existe déjà') ? 409 : 400, 'ERROR', msg)
    }
  },

  async deleteSenderId(req: Request, res: Response): Promise<void> {
    try {
      await smsService.deleteSenderId(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Sender ID supprimé')
    } catch (err) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Erreur')
    }
  },

  // Admin only — approuver/rejeter un sender ID
  async approveSenderId(req: Request, res: Response): Promise<void> {
    try {
      await smsService.approveSenderId(Number(req.params.id))
      sendSuccess(res, null, 'Sender ID approuvé')
    } catch (err) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Erreur')
    }
  },

  async rejectSenderId(req: Request, res: Response): Promise<void> {
    try {
      await smsService.rejectSenderId(Number(req.params.id))
      sendSuccess(res, null, 'Sender ID rejeté')
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur')
    }
  },

  // ── OTP ──────────────────────────────────────────────────────

  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = otpSendSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const tenantId = req.tenantId ?? 1 // OTP peut être appelé par des apps externes
      const result = await smsService.sendOtp(parsed.data.phone, tenantId, parsed.data.senderId)
      sendSuccess(res, { expiresAt: result.expiresAt }, 'Code OTP envoyé')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('Trop de') ? 429 : 400, 'ERROR', msg)
    }
  },

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const parsed = otpVerifySchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const tenantId = req.tenantId ?? 1
      const valid = await smsService.verifyOtp(parsed.data.phone, parsed.data.code, tenantId)
      if (!valid) { sendError(res, 400, 'INVALID_OTP', 'Code invalide ou expiré'); return }
      sendSuccess(res, { verified: true }, 'OTP vérifié')
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Messages Programmés ──────────────────────────────────────

  async getScheduled(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPage(req)
      const result = await smsService.getScheduled(req.tenantId!, {
        page, limit, status: req.query.status as string | undefined,
      })
      sendSuccess(res, result.items, 'Messages programmés récupérés', 200, {
        page, perPage: limit, total: result.total,
        lastPage: Math.ceil(result.total / limit),
      })
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createScheduled(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createScheduledSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const item = await smsService.createScheduled(parsed.data, req.tenantId!, req.user!.id)
      sendSuccess(res, item, 'SMS programmé avec succès', 201)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('5 minutes') ? 422 : 400, 'ERROR', msg)
    }
  },

  async cancelScheduled(req: Request, res: Response): Promise<void> {
    try {
      await smsService.cancelScheduled(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Message programmé annulé')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 400, 'ERROR', msg)
    }
  },

  // ── Action Sender ID via lien email (public) ─────────────────

  async senderIdAction(req: Request, res: Response): Promise<void> {
    const token = req.query.t as string | undefined
    if (!token) { res.status(400).send(htmlPage('Lien invalide', 'Aucun token fourni.', false)); return }

    try {
      const { action, senderId } = await smsService.handleSenderIdAction(token)

      const alreadyDone = action === 'already_done'
      const approved    = action === 'approve'

      const title = alreadyDone
        ? `Sender ID "${senderId}" — déjà traité`
        : approved
          ? `Sender ID "${senderId}" approuvé ✅`
          : `Sender ID "${senderId}" rejeté ❌`

      const body = alreadyDone
        ? 'Ce Sender ID a déjà été approuvé ou rejeté.'
        : approved
          ? `Le Sender ID <strong>${senderId}</strong> est maintenant actif. Le client peut l'utiliser pour ses campagnes SMS.`
          : `Le Sender ID <strong>${senderId}</strong> a été rejeté. Le client en sera informé à sa prochaine connexion.`

      res.send(htmlPage(title, body, !alreadyDone && approved))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      res.status(400).send(htmlPage('Lien invalide ou expiré', msg, false))
    }
  },

  // ── Listes de contacts ───────────────────────────────────────

  async getContactLists(req: Request, res: Response): Promise<void> {
    try {
      const lists = await smsService.getContactLists(req.tenantId!)
      sendSuccess(res, lists)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createContactList(req: Request, res: Response): Promise<void> {
    try {
      const parsed = z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }).safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const list = await smsService.createContactList(parsed.data, req.tenantId!, req.user!.id)
      sendSuccess(res, list, 'Liste créée', 201)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteContactList(req: Request, res: Response): Promise<void> {
    try {
      await smsService.deleteContactList(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Liste supprimée')
    } catch (err) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Erreur')
    }
  },

  async addContactsToList(req: Request, res: Response): Promise<void> {
    try {
      const parsed = addContactsSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const result = await smsService.addContactsToList(
        Number(req.params.id),
        parsed.data.contacts,
        req.tenantId!,
        parsed.data.defaultIso ?? 'CD'
      )
      sendSuccess(res, result, `${result.added} contact(s) ajouté(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  async getContactsInList(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPage(req)
      const result = await smsService.getContactsInList(
        Number(req.params.id), req.tenantId!, { page, limit }
      )
      sendSuccess(res, result.contacts, 'Contacts récupérés', 200, {
        page, perPage: limit, total: result.total,
        lastPage: Math.ceil(result.total / limit),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  // ── Import CRM ───────────────────────────────────────────────

  async getCrmContacts(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPage(req)
      const search = req.query.search as string | undefined
      const result = await smsService.getCrmContacts(req.tenantId!, { search, page, limit })
      sendSuccess(res, result.contacts, 'Contacts CRM', 200, {
        page, perPage: limit, total: result.total,
        lastPage: Math.ceil(result.total / limit),
      })
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async importFromCrm(req: Request, res: Response): Promise<void> {
    try {
      const parsed = z.object({
        contactIds: z.array(z.number().int().positive()).min(1).max(1000),
      }).safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const result = await smsService.importFromCrm(
        Number(req.params.id), parsed.data.contactIds, req.tenantId!
      )
      sendSuccess(res, result, `${result.added} contact(s) importé(s)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  // ── Réducteur d'URL ──────────────────────────────────────────

  async getShortLinks(req: Request, res: Response): Promise<void> {
    try {
      const links = await smsService.getShortLinks(req.tenantId!)
      sendSuccess(res, links)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createShortLink(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createShortLinkSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      const link = await smsService.createShortLink(parsed.data, req.tenantId!, req.user!.id)
      sendSuccess(res, link, 'Lien raccourci créé', 201)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('URL') ? 400 : 500, 'ERROR', msg)
    }
  },

  async deleteShortLink(req: Request, res: Response): Promise<void> {
    try {
      await smsService.deleteShortLink(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Lien supprimé')
    } catch (err) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Erreur')
    }
  },

  async getShortLinkStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await smsService.getShortLinkStats(Number(req.params.id), req.tenantId!)
      sendSuccess(res, stats)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, msg.includes('introuvable') ? 404 : 500, 'ERROR', msg)
    }
  },

  // ── Envoi unique ─────────────────────────────────────────────

  async sendSingleSms(req: Request, res: Response): Promise<void> {
    try {
      const parsed = sendSingleSchema.safeParse(req.body)
      if (!parsed.success) {
        console.warn('[sendSingleSms] Validation échouée:', parsed.error.errors[0].message, '| body:', req.body)
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return
      }
      console.log('[sendSingleSms] Payload validé:', parsed.data, '| tenant:', req.tenantId)
      const result = await smsService.sendSingle({
        ...parsed.data,
        tenantId: req.tenantId!,
        userId:   req.user!.id,
      })
      console.log('[sendSingleSms] Résultat final:', result)
      sendSuccess(res, result, result.status === 'sent' ? 'SMS envoyé' : 'Envoi échoué')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      console.error('[sendSingleSms] Erreur:', msg)
      const code = msg.includes('non approuvé') || msg.includes('invalide') ? 400 : 500
      sendError(res, code, 'SEND_ERROR', msg)
    }
  },

  // Redirect public — sans auth — rate limited côté route
  async redirectShortLink(req: Request, res: Response): Promise<void> {
    try {
      const ip  = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? ''
      const url = await smsService.resolveAndLogClick(req.params.code, ip)

      if (!url) { res.status(404).send('Lien introuvable ou expiré'); return }
      res.redirect(301, url)
    } catch {
      res.status(500).send('Erreur serveur')
    }
  },

  // ── Analytics ────────────────────────────────────────────────

  async getOverviewStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await smsService.getOverviewStats(req.tenantId!)
      sendSuccess(res, stats)
    } catch (err) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },
}
