import { Request, Response } from 'express'
import { z } from 'zod'
import { emailService } from '../services/email.service'
import { sendSuccess, sendError } from '../helpers/response.helper'
import { pool } from '../db/config'
import type { RowDataPacket } from 'mysql2'

const sendCampaignSchema = z.object({
  nomCampagne:     z.string().min(1, 'Le nom de la campagne est requis'),
  category:        z.string().default('Marketing'),
  sujet:           z.string().min(1, "L'objet de l'email est requis"),
  preheader:       z.string().nullable().optional(),
  expediteur:      z.string().min(1),
  informationUser: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
  groupeIds:       z.array(z.number()).min(1, 'Sélectionnez au moins un groupe'),
  scheduledAt:     z.string().nullable().optional(),
})

export const emailController = {

  async sendCampaign(req: Request, res: Response): Promise<void> {
    try {
      const parsed = sendCampaignSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message)
        return
      }
      const tenantId = (req as any).tenant?.id ?? 1
      const userId   = (req as any).user?.id   ?? 1
      const result = await emailService.createAndSendCampaign({ ...parsed.data, tenantId, userId })
      sendSuccess(res, result,
        result.queued
          ? `Campagne en cours d'envoi — ${result.totalRecipients} destinataire(s)`
          : `Campagne planifiée pour le ${result.scheduledAt}`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const campaigns = await emailService.getCampaigns(tenantId)
      sendSuccess(res, campaigns)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const stats = await emailService.getStats(tenantId)
      sendSuccess(res, stats)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const campaign = await emailService.getCampaignById(Number(req.params.id), tenantId)
      if (!campaign) { sendError(res, 404, 'NOT_FOUND', 'Campagne introuvable'); return }
      sendSuccess(res, campaign)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      await emailService.deleteCampaign(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Campagne supprimée')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async trackOpen(req: Request, res: Response): Promise<void> {
    const messageId = Number(req.params.messageId)
    if (messageId) {
      pool.execute(
        `INSERT INTO email_events (message_id, type, ip_address, user_agent) VALUES (?, 'open', ?, ?)`,
        [messageId, req.ip ?? null, req.headers['user-agent'] ?? null]
      ).catch(() => {})
    }
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    })
    res.end(pixel)
  },

  async trackClick(req: Request, res: Response): Promise<void> {
    const messageId = Number(req.params.messageId)
    const redirectUrl = req.query.url as string

    if (messageId) {
      pool.execute(
        `INSERT INTO email_events (message_id, type, ip_address, user_agent) VALUES (?, 'click', ?, ?)`,
        [messageId, req.ip ?? null, req.headers['user-agent'] ?? null]
      ).catch(() => {})
    }

    // Valide l'URL cible — évite les redirections ouvertes vers n'importe quel domaine
    if (redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'))) {
      res.redirect(302, redirectUrl)
    } else {
      res.redirect(302, 'https://biargroup.com')
    }
  },

  async unsubscribe(req: Request, res: Response): Promise<void> {
    const messageId = Number(req.params.messageId)
    if (messageId) {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT contact_id FROM email_messages WHERE id = ?`, [messageId]
      ).catch(() => [[] as RowDataPacket[], []])
      const contactId = (rows as RowDataPacket[])[0]?.contact_id
      if (contactId) {
        await Promise.all([
          pool.execute(`UPDATE contacts SET is_opted_out = TRUE, opted_out_at = NOW() WHERE id = ?`, [contactId]),
          pool.execute(`UPDATE email_messages SET status = 'unsubscribed' WHERE id = ?`, [messageId]),
          pool.execute(`INSERT INTO email_events (message_id, type) VALUES (?, 'unsubscribe')`, [messageId]),
        ]).catch(() => {})
      }
    }
    res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:40px">
      <h2 style="color:#F4511E">BIAR GROUP AFRICA</h2>
      <p>Vous avez été désabonné avec succès ✅</p>
      <p style="color:#888;font-size:13px">Vous ne recevrez plus d'emails de notre part.</p>
    </body></html>`)
  },

  async createCampaign(_req: Request, res: Response): Promise<void> {
    sendError(res, 400, 'USE_SEND_ENDPOINT', 'Utilisez POST /campaigns/send')
  },
  async updateCampaign(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
  async getLists(_req: Request, res: Response): Promise<void> { sendSuccess(res, []) },
  async createList(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const templates = await emailService.getTemplates(tenantId)
      sendSuccess(res, templates)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:      z.string().min(1, 'Le nom est requis'),
        category:  z.string().default('Général'),
        sujet:     z.string().nullable().optional(),
        blocsJson: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = (req as any).tenant?.id ?? 1
      const userId   = (req as any).user?.id   ?? 1
      const template = await emailService.createTemplate(parsed.data, tenantId, userId)
      sendSuccess(res, template, 'Template sauvegardé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      await emailService.deleteTemplate(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Template supprimé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },
  async getSmtpConfigs(_req: Request, res: Response): Promise<void> { sendSuccess(res, []) },
  async createSmtpConfig(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },

  // ── Relances ────────────────────────────────────────────────────────────────

  async createRelance(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        campaignId: z.number().int().positive(),
        newSubject: z.string().min(1, "L'objet de relance est requis"),
        // 0 = mode test (exécution dans 1 minute), sinon nombre de jours
        delayDays:  z.number().int().min(0).max(30).default(5),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = (req as any).tenant?.id ?? 1
      const userId   = (req as any).user?.id   ?? 1
      const result = await emailService.createRelance({ ...parsed.data, tenantId, userId })

      // Mode test (delayDays = 0) : exécute immédiatement sans attendre le job horaire
      if (parsed.data.delayDays === 0) {
        emailService.executePendingRelances().catch(console.error)
      }

      const msg = parsed.data.delayDays === 0
        ? 'Relance en cours d\'exécution (mode test)'
        : `Relance planifiée dans ${parsed.data.delayDays} jour(s)`
      sendSuccess(res, result, msg)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 400, 'RELANCE_ERROR', msg)
    }
  },

  async getRelances(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const relances = await emailService.getRelances(tenantId)
      sendSuccess(res, relances)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async cancelRelance(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      await emailService.cancelRelance(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Relance annulée')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCredits(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id ?? 1
      const credits = await emailService.getCredits(userId)
      sendSuccess(res, { credits })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getHeatmap(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      const matrix = await emailService.getHeatmap(tenantId)
      sendSuccess(res, matrix)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },
}
