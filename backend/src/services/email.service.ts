import { pool } from '../db/config'
import { emailQueue } from '../queue/email.worker'
import { blocksToHtml } from '../helpers/blocks-to-html.helper'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

interface SendCampaignPayload {
  nomCampagne: string
  category: string
  sujet: string
  preheader?: string | null
  expediteur: string
  informationUser: object[]
  groupeIds: number[]
  scheduledAt?: string | null
  tenantId: number
  userId: number
}

interface ContactRow extends RowDataPacket {
  id: number
  first_name: string
  last_name: string
  email: string
  company: string | null
}

export const emailService = {

  async createAndSendCampaign(payload: SendCampaignPayload) {
    const { nomCampagne, category, sujet, preheader, expediteur, informationUser, groupeIds, scheduledAt, tenantId, userId } = payload

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // 1 — Créer la campagne
      const [campResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO email_campaigns
         (tenant_id, created_by, name, category, sujet, preheader, expediteur, blocs_json, status, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          userId,
          nomCampagne,
          category,
          sujet,
          preheader ?? null,
          expediteur,
          JSON.stringify(informationUser),
          scheduledAt ? 'scheduled' : 'queued',
          scheduledAt ?? null,
        ]
      )
      const campaignId = campResult.insertId

      // 2 — Lier les groupes à la campagne
      for (const gid of groupeIds) {
        await conn.execute(
          `INSERT IGNORE INTO email_campaign_groups (campaign_id, group_id) VALUES (?, ?)`,
          [campaignId, gid]
        )
      }

      // 3 — Récupérer tous les contacts des groupes (sans doublons, sans opted_out)
      let contacts: ContactRow[] = []
      if (groupeIds.length > 0) {
        const placeholders = groupeIds.map(() => '?').join(',')
        const [rows] = await conn.execute<ContactRow[]>(
          `SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.company
           FROM contacts c
           JOIN contact_group_members cgm ON cgm.contact_id = c.id
           WHERE cgm.group_id IN (${placeholders})
             AND c.email IS NOT NULL
             AND c.is_opted_out = FALSE
             AND c.deleted_at IS NULL
             AND c.tenant_id = ?`,
          [...groupeIds, tenantId]
        )
        contacts = rows
      }

      // 3b — Vérifier que l'utilisateur a assez de crédits
      const [creditRows] = await conn.execute<RowDataPacket[]>(
        `SELECT email_credits FROM users WHERE id = ?`, [userId]
      )
      const currentCredits = Number((creditRows as RowDataPacket[])[0]?.email_credits ?? 0)
      if (currentCredits < contacts.length) {
        throw new Error(
          `Crédits insuffisants — il vous reste ${currentCredits} crédit(s) mais cette campagne nécessite ${contacts.length} envoi(s).`
        )
      }

      // 4 — Créer un email_message par contact
      const messageIds: { id: number; contact: ContactRow }[] = []
      for (const contact of contacts) {
        const [msgResult] = await conn.execute<ResultSetHeader>(
          `INSERT INTO email_messages
           (campaign_id, contact_id, email_address, first_name, last_name, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [campaignId, contact.id, contact.email, contact.first_name, contact.last_name]
        )
        messageIds.push({ id: msgResult.insertId, contact })
      }

      // 5 — Mettre à jour le total destinataires + status + décrémenter les crédits
      await conn.execute(
        `UPDATE email_campaigns SET total_recipients = ?, status = 'sending' WHERE id = ?`,
        [contacts.length, campaignId]
      )
      await conn.execute(
        `UPDATE users SET email_credits = email_credits - ? WHERE id = ?`,
        [contacts.length, userId]
      )

      await conn.commit()

      // 6 — Enqueue les jobs Bull (hors transaction)
      if (!scheduledAt) {
        for (const { id: messageId, contact } of messageIds) {
          const html = blocksToHtml(
            informationUser as any[],
            expediteur,
            sujet,
            {
              prenom: contact.first_name,
              nom: contact.last_name,
              email: contact.email,
              entreprise: contact.company ?? undefined,
            },
            messageId
          )

          await emailQueue.add({
            messageId,
            campaignId,
            to: contact.email,
            fromName: expediteur,
            subject: sujet,
            html,
          })
        }
      }

      return {
        campaignId,
        totalRecipients: contacts.length,
        queued: !scheduledAt,
        scheduledAt: scheduledAt ?? null,
      }

    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async getCampaigns(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         c.id, c.name, c.category, c.sujet, c.expediteur, c.status,
         c.total_recipients, c.total_sent, c.total_failed,
         c.scheduled_at, c.sent_at, c.created_at,
         COUNT(DISTINCT CASE WHEN ee.type = 'open'        THEN ee.message_id END) AS opens,
         COUNT(DISTINCT CASE WHEN ee.type = 'click'       THEN ee.message_id END) AS clicks,
         COUNT(DISTINCT CASE WHEN ee.type = 'unsubscribe' THEN ee.message_id END) AS unsubscribes
       FROM email_campaigns c
       LEFT JOIN email_messages em ON em.campaign_id = c.id
       LEFT JOIN email_events   ee ON ee.message_id  = em.id
       WHERE c.tenant_id = ? AND c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [tenantId]
    )
    return rows
  },

  async getStats(tenantId: number) {
    const [campRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(total_sent), 0)       AS total_sent,
         COALESCE(SUM(total_recipients), 0) AS total_recipients,
         COALESCE(SUM(total_failed), 0)     AS total_failed,
         COUNT(*)                           AS total_campaigns
       FROM email_campaigns
       WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )

    const [evRows] = await pool.execute<RowDataPacket[]>(
      `SELECT ee.type, COUNT(DISTINCT ee.message_id) AS cnt
       FROM email_events ee
       JOIN email_messages em ON em.id = ee.message_id
       JOIN email_campaigns ec ON ec.id = em.campaign_id
       WHERE ec.tenant_id = ? AND ec.deleted_at IS NULL
       GROUP BY ee.type`,
      [tenantId]
    )

    const base = campRows[0] as Record<string, number>
    const evMap: Record<string, number> = {}
    for (const e of evRows as Array<{ type: string; cnt: number }>) evMap[e.type] = Number(e.cnt)

    const sent = Number(base.total_sent) || 0
    const recipients = Number(base.total_recipients) || 0

    return {
      totalSent:       sent,
      totalRecipients: recipients,
      totalFailed:     Number(base.total_failed) || 0,
      totalCampaigns:  Number(base.total_campaigns) || 0,
      opens:           evMap['open']        || 0,
      clicks:          evMap['click']       || 0,
      bounces:         evMap['bounce']      || 0,
      unsubscribes:    evMap['unsubscribe'] || 0,
      openRate:        recipients > 0 ? +((evMap['open']        || 0) / recipients * 100).toFixed(1) : 0,
      clickRate:       recipients > 0 ? +((evMap['click']       || 0) / recipients * 100).toFixed(1) : 0,
      bounceRate:      sent > 0       ? +((evMap['bounce']      || 0) / sent       * 100).toFixed(1) : 0,
      unsubRate:       recipients > 0 ? +((evMap['unsubscribe'] || 0) / recipients * 100).toFixed(1) : 0,
      deliverRate:     recipients > 0 ? +((sent / recipients) * 100).toFixed(1) : 0,
    }
  },

  async getCampaignById(id: number, tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM email_campaigns WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [id, tenantId]
    )
    return rows[0] ?? null
  },

  async deleteCampaign(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE email_campaigns SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  async getTemplates(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, category, sujet, blocs_json, created_at
       FROM email_templates
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows
  },

  async createTemplate(data: { name: string; category: string; sujet?: string | null; blocsJson: object[] }, tenantId: number, userId: number) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_templates (tenant_id, created_by, name, category, sujet, blocs_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, data.name, data.category, data.sujet ?? null, JSON.stringify(data.blocsJson)]
    )
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, category, sujet, blocs_json, created_at FROM email_templates WHERE id = ?`,
      [result.insertId]
    )
    return rows[0]
  },

  async deleteTemplate(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE email_templates SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  // ── Relances (flow "si pas ouvert") ─────────────────────────────────────────

  async createRelance(data: {
    campaignId: number; newSubject: string; delayDays: number
    tenantId: number; userId: number
  }) {
    const { campaignId, newSubject, delayDays, tenantId, userId } = data

    const [camps] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM email_campaigns
       WHERE id = ? AND tenant_id = ? AND status = 'sent' AND deleted_at IS NULL`,
      [campaignId, tenantId]
    )
    if (!camps.length) throw new Error('Campagne introuvable ou pas encore envoyée')

    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM email_relances WHERE campaign_id = ? AND status IN ('pending','running')`,
      [campaignId]
    )
    if (existing.length) throw new Error('Une relance est déjà planifiée pour cette campagne')

    // delayDays = 0 → mode test : scheduledAt = maintenant pour que executePendingRelances()
    // la trouve immédiatement (condition scheduled_at <= NOW() doit être vraie)
    const scheduledAt = delayDays === 0
      ? new Date()
      : new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_relances (tenant_id, campaign_id, new_subject, delay_days, scheduled_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, campaignId, newSubject, delayDays, scheduledAt, userId]
    )
    return { id: result.insertId, scheduledAt }
  },

  async getRelances(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT r.id, r.campaign_id, r.new_subject, r.delay_days, r.status,
              r.scheduled_at, r.executed_at, r.total_sent, r.created_at,
              c.name AS campaign_name, c.sujet AS campaign_sujet
       FROM email_relances r
       JOIN email_campaigns c ON c.id = r.campaign_id
       WHERE r.tenant_id = ?
       ORDER BY r.created_at DESC`,
      [tenantId]
    )
    return rows
  },

  async cancelRelance(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE email_relances SET status = 'cancelled'
       WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
      [id, tenantId]
    )
  },

  // Appelé par le job Bull toutes les heures — vérifie les relances dues
  async executePendingRelances() {
    const [due] = await pool.execute<RowDataPacket[]>(
      `SELECT r.id, r.campaign_id, r.new_subject, r.tenant_id, c.expediteur, c.blocs_json
       FROM email_relances r
       JOIN email_campaigns c ON c.id = r.campaign_id
       WHERE r.status = 'pending' AND r.scheduled_at <= NOW()`
    )

    for (const relance of due as Array<{
      id: number; campaign_id: number; new_subject: string
      tenant_id: number; expediteur: string; blocs_json: string
    }>) {
      await pool.execute(`UPDATE email_relances SET status = 'running' WHERE id = ?`, [relance.id])

      try {
        // Uniquement le PREMIER message envoyé à chaque contact pour cette campagne
        // (exclut les messages de relances précédentes pour éviter de re-relancer indéfiniment)
        const [nonOpeners] = await pool.execute<ContactRow[]>(
          `SELECT em.id AS message_id, em.email_address, em.first_name, em.last_name, em.contact_id
           FROM email_messages em
           LEFT JOIN email_events ee ON ee.message_id = em.id AND ee.type = 'open'
           WHERE em.campaign_id = ?
             AND em.status = 'sent'
             AND ee.id IS NULL
             AND em.id = (
               SELECT MIN(em2.id)
               FROM email_messages em2
               WHERE em2.campaign_id = em.campaign_id
                 AND em2.email_address = em.email_address
             )`,
          [relance.campaign_id]
        )

        const blocs = JSON.parse(relance.blocs_json) as any[]
        let sent = 0

        for (const person of nonOpeners) {
          const [msgResult] = await pool.execute<ResultSetHeader>(
            `INSERT INTO email_messages (campaign_id, contact_id, email_address, first_name, last_name, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [relance.campaign_id, person.contact_id ?? null, person.email_address, person.first_name, person.last_name]
          )
          const messageId = msgResult.insertId
          const { blocksToHtml } = await import('../helpers/blocks-to-html.helper')
          const html = blocksToHtml(
            blocs, relance.expediteur, relance.new_subject,
            { prenom: person.first_name, nom: person.last_name, email: person.email_address },
            messageId
          )
          await emailQueue.add({ messageId, campaignId: relance.campaign_id, to: person.email_address, fromName: relance.expediteur, subject: relance.new_subject, html })
          sent++
        }

        await pool.execute(
          `UPDATE email_relances SET status = 'completed', executed_at = NOW(), total_sent = ? WHERE id = ?`,
          [sent, relance.id]
        )
      } catch {
        // Remet en pending pour retry à la prochaine heure
        await pool.execute(`UPDATE email_relances SET status = 'pending' WHERE id = ?`, [relance.id])
      }
    }
  },

  async getCredits(userId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT email_credits FROM users WHERE id = ?`, [userId]
    )
    return Number((rows as RowDataPacket[])[0]?.email_credits ?? 0)
  },

  async getHeatmap(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DAYOFWEEK(ee.created_at) AS dow, HOUR(ee.created_at) AS hour, COUNT(*) AS clicks
       FROM email_events ee
       JOIN email_messages em ON em.id = ee.message_id
       JOIN email_campaigns ec ON ec.id = em.campaign_id
       WHERE ec.tenant_id = ? AND ee.type = 'click' AND ec.deleted_at IS NULL
       GROUP BY dow, hour`,
      [tenantId]
    )

    // Matrice 7 jours × 24 heures, initialisée à 0
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))

    for (const row of rows as Array<{ dow: number; hour: number; clicks: number }>) {
      // DAYOFWEEK MySQL : 1=dim, 2=lun…7=sam → on mappe vers lun(0)…dim(6)
      const dayIdx = (row.dow + 5) % 7
      matrix[dayIdx][row.hour] = Number(row.clicks)
    }

    return matrix
  },
}
