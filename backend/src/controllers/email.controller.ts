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
  groupeIds:       z.array(z.number()).default([]),
  segmentIds:      z.array(z.number()).default([]),
  scheduledAt:     z.string().nullable().optional(),
}).refine(d => d.groupeIds.length > 0 || d.segmentIds.length > 0, {
  message: 'Sélectionnez au moins un groupe ou un segment',
  path: ['groupeIds'],
})

export const emailController = {

  async sendCampaign(req: Request, res: Response): Promise<void> {
    try {
      const parsed = sendCampaignSchema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message)
        return
      }
      const tenantId = req.tenantId!
      const userId   = req.user!.id
      const result = await emailService.createAndSendCampaign({ ...parsed.data, tenantId, userId })
      const baseMsg = result.queued
        ? `Campagne en cours d'envoi — ${result.totalRecipients} destinataire(s)`
        : `Campagne planifiée pour le ${result.scheduledAt}`
      const msg = result.usingFallback
        ? `${baseMsg} (SMTP système — configurez votre propre SMTP pour envoyer depuis votre domaine)`
        : baseMsg
      sendSuccess(res, result, msg)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const campaigns = await emailService.getCampaigns(tenantId)
      sendSuccess(res, campaigns)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const stats = await emailService.getStats(tenantId)
      sendSuccess(res, stats)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCampaign(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
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
      const tenantId = req.tenantId!
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
      const tenantId = req.tenantId!
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
      const tenantId = req.tenantId!
      const userId   = req.user!.id
      const template = await emailService.createTemplate(parsed.data, tenantId, userId)
      sendSuccess(res, template, 'Template sauvegardé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await emailService.deleteTemplate(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Template supprimé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },
  async getSmtpConfigs(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const configs = await emailService.getSmtpConfigs(tenantId)
      sendSuccess(res, configs)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createSmtpConfig(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:      z.string().min(1, 'Le nom est requis'),
        provider:  z.enum(['brevo', 'sendgrid', 'custom']).default('brevo'),
        host:      z.string().min(1, 'Le serveur SMTP est requis'),
        port:      z.number().int().min(1).max(65535).default(587),
        secure:    z.boolean().default(false),
        username:  z.string().min(1, "L'identifiant est requis"),
        password:  z.string().min(1, 'Le mot de passe est requis'),
        fromName:  z.string().min(1, "Le nom d'expéditeur est requis"),
        fromEmail: z.string().email("L'adresse expéditeur est invalide"),
        replyTo:   z.string().email().nullable().optional(),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = req.tenantId!
      const result = await emailService.createSmtpConfig(parsed.data, tenantId)
      sendSuccess(res, result, 'Configuration SMTP créée')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async updateSmtpConfig(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:      z.string().min(1).optional(),
        host:      z.string().min(1).optional(),
        port:      z.number().int().min(1).max(65535).optional(),
        secure:    z.boolean().optional(),
        username:  z.string().min(1).optional(),
        password:  z.string().min(1).optional(),
        fromName:  z.string().min(1).optional(),
        fromEmail: z.string().email().optional(),
        replyTo:   z.string().email().nullable().optional(),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = req.tenantId!
      await emailService.updateSmtpConfig(Number(req.params.id), parsed.data, tenantId)
      sendSuccess(res, null, 'Configuration SMTP mise à jour')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteSmtpConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await emailService.deleteSmtpConfig(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Configuration SMTP supprimée')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async setSmtpDefault(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await emailService.setSmtpDefault(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Configuration définie par défaut')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async verifySmtpConfig(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const ok = await emailService.verifySmtpConfig(Number(req.params.id), tenantId)
      if (ok) {
        sendSuccess(res, { verified: true }, 'Connexion SMTP vérifiée ✅')
      } else {
        sendError(res, 400, 'SMTP_VERIFY_FAILED', 'Impossible de se connecter — vérifiez vos identifiants')
      }
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Relances ────────────────────────────────────────────────────────────────

  async brevoWebhook(req: Request, res: Response): Promise<void> {
    const events = Array.isArray(req.body) ? req.body : [req.body]
    res.status(200).json({ ok: true }) // répondre vite à Brevo

    for (const ev of events) {
      const brevoId   = ev['message-id'] as string | undefined
      const eventType = ev.event         as string | undefined
      if (!brevoId || !eventType) continue

      try {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, campaign_id, contact_id FROM email_messages WHERE brevo_message_id = ? LIMIT 1`,
          [brevoId]
        )
        const msg = (rows as RowDataPacket[])[0]
        if (!msg) continue

        const { id: msgId, campaign_id: campId, contact_id: contactId } = msg

        switch (eventType) {
          case 'opened':
            await pool.execute(
              `INSERT INTO email_events (message_id, type) VALUES (?, 'open')`,
              [msgId]
            )
            break

          case 'click':
            await pool.execute(
              `INSERT INTO email_events (message_id, type, data) VALUES (?, 'click', ?)`,
              [msgId, JSON.stringify({ url: ev.link ?? null })]
            )
            break

          case 'soft_bounce':
          case 'hard_bounce':
            await Promise.all([
              pool.execute(
                `INSERT INTO email_events (message_id, type, data) VALUES (?, 'bounce', ?)`,
                [msgId, JSON.stringify({ subtype: eventType === 'hard_bounce' ? 'hard' : 'soft' })]
              ),
              pool.execute(`UPDATE email_messages SET status='bounced', updated_at=NOW() WHERE id=?`, [msgId]),
              pool.execute(`UPDATE email_campaigns SET total_failed=total_failed+1, updated_at=NOW() WHERE id=?`, [campId]),
            ])
            break

          case 'spam':
            await pool.execute(
              `INSERT INTO email_events (message_id, type) VALUES (?, 'spam')`,
              [msgId]
            )
            break

          case 'unsubscribe':
            await Promise.all([
              pool.execute(`INSERT INTO email_events (message_id, type) VALUES (?, 'unsubscribe')`, [msgId]),
              pool.execute(`UPDATE email_messages SET status='unsubscribed', updated_at=NOW() WHERE id=?`, [msgId]),
              ...(contactId ? [
                pool.execute(`UPDATE contacts SET is_opted_out=TRUE, opted_out_at=NOW() WHERE id=?`, [contactId]),
              ] : []),
            ])
            break
        }
      } catch (err) {
        console.error('[BREVO WEBHOOK]', eventType, brevoId, err)
      }
    }
  },

  // ── Webhook SendGrid ─────────────────────────────────────────────────────────
  async sendgridWebhook(req: Request, res: Response): Promise<void> {
    const events = Array.isArray(req.body) ? req.body : [req.body]
    res.status(200).json({ ok: true }) // répondre vite à SendGrid

    for (const ev of events) {
      const sgMsgId   = ev.sg_message_id as string | undefined
      const eventType = ev.event         as string | undefined
      if (!sgMsgId || !eventType) continue

      // sg_message_id = "<original-nodemailer-id>.filter0001..."
      // brevo_message_id stocke "<original-nodemailer-id>" avec les chevrons
      // On tente match exact, puis LIKE (sans chevrons, tronqué avant .filter)
      const stripped = sgMsgId.split('.filter')[0].replace(/^<|>$/g, '')

      try {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, campaign_id, contact_id FROM email_messages
           WHERE brevo_message_id = ? OR brevo_message_id = ? OR brevo_message_id LIKE ?
           LIMIT 1`,
          [`<${stripped}>`, stripped, `%${stripped}%`]
        )
        const msg = (rows as RowDataPacket[])[0]
        if (!msg) continue

        const { id: msgId, campaign_id: campId, contact_id: contactId } = msg

        switch (eventType) {
          case 'open':
            await pool.execute(
              `INSERT INTO email_events (message_id, type) VALUES (?, 'open')`, [msgId]
            )
            break

          case 'click':
            await pool.execute(
              `INSERT INTO email_events (message_id, type, data) VALUES (?, 'click', ?)`,
              [msgId, JSON.stringify({ url: ev.url ?? null })]
            )
            break

          case 'bounce':
            await Promise.all([
              pool.execute(
                `INSERT INTO email_events (message_id, type, data) VALUES (?, 'bounce', ?)`,
                [msgId, JSON.stringify({ subtype: ev.type === 'permanent' ? 'hard' : 'soft' })]
              ),
              pool.execute(`UPDATE email_messages SET status='bounced', updated_at=NOW() WHERE id=?`, [msgId]),
              pool.execute(`UPDATE email_campaigns SET total_failed=total_failed+1, updated_at=NOW() WHERE id=?`, [campId]),
            ])
            break

          case 'spamreport':
            await pool.execute(`INSERT INTO email_events (message_id, type) VALUES (?, 'spam')`, [msgId])
            break

          case 'unsubscribe':
          case 'group_unsubscribe':
            await Promise.all([
              pool.execute(`INSERT INTO email_events (message_id, type) VALUES (?, 'unsubscribe')`, [msgId]),
              pool.execute(`UPDATE email_messages SET status='unsubscribed', updated_at=NOW() WHERE id=?`, [msgId]),
              ...(contactId ? [
                pool.execute(`UPDATE contacts SET is_opted_out=TRUE, opted_out_at=NOW() WHERE id=?`, [contactId]),
              ] : []),
            ])
            break
        }
      } catch (err) {
        console.error('[SENDGRID WEBHOOK]', eventType, sgMsgId, err)
      }
    }
  },

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
      const tenantId = req.tenantId!
      const userId   = req.user!.id
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
      const tenantId = req.tenantId!
      const relances = await emailService.getRelances(tenantId)
      sendSuccess(res, relances)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async cancelRelance(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await emailService.cancelRelance(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Relance annulée')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getCredits(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id
      const credits = await emailService.getCredits(userId)
      sendSuccess(res, { credits })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async getHeatmap(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const matrix = await emailService.getHeatmap(tenantId)
      sendSuccess(res, matrix)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  // ── A/B Testing ─────────────────────────────────────────────────────────────

  async createAbTest(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:          z.string().min(1, 'Le nom du test est requis'),
        expediteur:    z.string().min(1, "L'expéditeur est requis"),
        blocsJson:     z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
        subjectA:      z.string().min(1, "L'objet A est requis"),
        subjectB:      z.string().min(1, "L'objet B est requis"),
        groupIds:      z.array(z.number()).min(1, 'Sélectionnez au moins un groupe'),
        splitPercent:  z.number().int().min(5).max(25).default(10),
        winnerMetric:  z.enum(['open_rate', 'click_rate']).default('open_rate'),
        waitHours:     z.number().int().min(1).max(48).default(4),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) {
        sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message)
        return
      }
      const tenantId = req.tenantId!
      const userId   = req.user!.id
      const result = await emailService.createAbTest({ ...parsed.data, tenantId, userId })
      sendSuccess(res, result,
        `Test A/B lancé — ${result.sentA} destinataires (A) + ${result.sentB} destinataires (B). Résultat dans ${parsed.data.waitHours}h.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 400, 'AB_TEST_ERROR', msg)
    }
  },

  async getAbTests(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const tests = await emailService.getAbTests(tenantId)
      sendSuccess(res, tests)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  async cancelAbTest(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await emailService.cancelAbTest(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Test A/B annulé')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur serveur'
      sendError(res, 500, 'SERVER_ERROR', msg)
    }
  },

  // ── Email Flows ──────────────────────────────────────────────────────────────

  async getFlows(req: Request, res: Response): Promise<void> {
    try {
      const data = await emailService.getFlows(req.tenantId!)
      sendSuccess(res, data)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async getFlowStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await emailService.getFlowStats(req.tenantId!)
      sendSuccess(res, data)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async getFlowById(req: Request, res: Response): Promise<void> {
    try {
      const data = await emailService.getFlow(Number(req.params.id), req.tenantId!)
      sendSuccess(res, data)
    } catch (err: unknown) {
      sendError(res, 404, 'NOT_FOUND', err instanceof Error ? err.message : 'Introuvable')
    }
  },

  async createFlow(req: Request, res: Response): Promise<void> {
    const schema = z.object({
      name:        z.string().min(1),
      description: z.string().optional().default(''),
      nodesJson:   z.array(z.object({}).passthrough()).min(1),
      edgesJson:   z.array(z.object({}).passthrough()),
      triggerType: z.string().default('subscribe'),
      groupIds:    z.array(z.number().int().positive()).optional().default([]),
    })
    try {
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const result = await emailService.createFlow({ ...parsed.data, tenantId: req.tenantId!, userId: req.user!.id })
      sendSuccess(res, result, 'Flow créé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async updateFlow(req: Request, res: Response): Promise<void> {
    const schema = z.object({
      name:        z.string().min(1).optional(),
      description: z.string().optional(),
      nodesJson:   z.array(z.object({}).passthrough()).optional(),
      edgesJson:   z.array(z.object({}).passthrough()).optional(),
      triggerType: z.string().optional(),
      groupIds:    z.array(z.number().int().positive()).optional(),
    })
    try {
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      await emailService.updateFlow(Number(req.params.id), req.tenantId!, parsed.data)
      sendSuccess(res, null, 'Flow mis à jour')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteFlow(req: Request, res: Response): Promise<void> {
    try {
      await emailService.deleteFlow(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Flow supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async duplicateFlow(req: Request, res: Response): Promise<void> {
    try {
      const result = await emailService.duplicateFlow(Number(req.params.id), req.tenantId!, req.user!.id)
      sendSuccess(res, result, 'Flow dupliqué')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async setFlowStatus(req: Request, res: Response): Promise<void> {
    const schema = z.object({ status: z.enum(['active', 'paused', 'draft']) })
    try {
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      await emailService.setFlowStatus(Number(req.params.id), req.tenantId!, parsed.data.status)
      sendSuccess(res, null, `Flow ${parsed.data.status === 'active' ? 'activé' : 'mis en pause'}`)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Domaines DNS ─────────────────────────────────────────────────────────────

  async getDomains(req: Request, res: Response): Promise<void> {
    try {
      const data = await emailService.getDomains(req.tenantId!)
      sendSuccess(res, data)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async addDomain(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        domain:   z.string().min(3, 'Domaine invalide'),
        provider: z.enum(['brevo', 'sendgrid', 'custom']).default('brevo'),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const result = await emailService.addDomain(parsed.data.domain, parsed.data.provider, req.tenantId!)
      sendSuccess(res, result, 'Domaine ajouté')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteDomain(req: Request, res: Response): Promise<void> {
    try {
      await emailService.deleteDomain(Number(req.params.id), req.tenantId!)
      sendSuccess(res, null, 'Domaine supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async verifyDomain(req: Request, res: Response): Promise<void> {
    try {
      const result = await emailService.verifyDomain(Number(req.params.id), req.tenantId!)
      sendSuccess(res, result, 'Vérification DNS terminée')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },
}
