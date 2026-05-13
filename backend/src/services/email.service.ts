import { pool } from '../db/config'
import { emailQueue } from '../queue/email.worker'
import { blocksToHtml } from '../helpers/blocks-to-html.helper'
import { contactService } from './contact.service'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

interface SendCampaignPayload {
  nomCampagne: string
  category: string
  sujet: string
  preheader?: string | null
  expediteur: string
  informationUser: object[]
  groupeIds: number[]
  segmentIds?: number[]
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
  custom_fields: string | Record<string, string> | null
}

function parseCustomFields(raw: string | Record<string, string> | null): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'object') return raw as Record<string, string>
  try { return JSON.parse(raw) as Record<string, string> } catch { return {} }
}

function buildContactVars(contact: ContactRow) {
  const custom = parseCustomFields(contact.custom_fields)
  return {
    prenom:     contact.first_name ?? '',
    nom:        contact.last_name  ?? '',
    email:      contact.email      ?? '',
    entreprise: contact.company    ?? '',
    ...custom,
  }
}

export const emailService = {

  async createAndSendCampaign(payload: SendCampaignPayload) {
    const { nomCampagne, category, sujet, preheader, expediteur, informationUser, groupeIds, segmentIds = [], scheduledAt, tenantId, userId } = payload

    // Résolution contacts segments (avant la transaction, pas besoin de conn)
    const segmentContacts = await contactService.getContactsBySegmentIds(segmentIds, tenantId)

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

      // 3 — Contacts des groupes + segments (union, sans doublons)
      let contacts: ContactRow[] = []
      if (groupeIds.length > 0) {
        const placeholders = groupeIds.map(() => '?').join(',')
        const [rows] = await conn.execute<ContactRow[]>(
          `SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.company, c.custom_fields
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
      // Fusionner les contacts des segments (sans dupliquer)
      if (segmentContacts.length > 0) {
        const existingIds = new Set(contacts.map(c => c.id))
        for (const sc of segmentContacts) {
          if (!existingIds.has(sc.id)) {
            contacts.push(sc as unknown as ContactRow)
            existingIds.add(sc.id)
          }
        }
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
            buildContactVars(contact),
            messageId
          )

          await emailQueue.add({
            messageId,
            campaignId,
            tenantId,
            to: contact.email,
            fromName: expediteur,
            subject: sujet,
            html,
          })
        }
      }

      // Vérifier si fallback SMTP actif (aucune config vérifiée par défaut pour ce tenant)
      const [smtpRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM email_smtp_configs WHERE tenant_id = ? AND is_default = 1 AND is_verified = 1 LIMIT 1`,
        [tenantId]
      )
      const usingFallback = (smtpRows as RowDataPacket[]).length === 0

      return {
        campaignId,
        totalRecipients: contacts.length,
        queued: !scheduledAt,
        scheduledAt: scheduledAt ?? null,
        usingFallback,
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
    // 4 requêtes en parallèle
    const [
      [campRows],
      [evRows],
      [bounceRows],
      [relanceRows],
    ] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        `SELECT
           COALESCE(SUM(total_sent), 0)       AS total_sent,
           COALESCE(SUM(total_recipients), 0) AS total_recipients,
           COALESCE(SUM(total_failed), 0)     AS total_failed,
           COUNT(*)                           AS total_campaigns
         FROM email_campaigns
         WHERE tenant_id = ? AND deleted_at IS NULL`,
        [tenantId]
      ),
      pool.execute<RowDataPacket[]>(
        `SELECT ee.type, COUNT(DISTINCT ee.message_id) AS cnt
         FROM email_events ee
         JOIN email_messages em ON em.id = ee.message_id
         JOIN email_campaigns ec ON ec.id = em.campaign_id
         WHERE ec.tenant_id = ? AND ec.deleted_at IS NULL
         GROUP BY ee.type`,
        [tenantId]
      ),
      // Hard vs soft bounces — stockés dans data.subtype depuis migration 009
      pool.execute<RowDataPacket[]>(
        `SELECT
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.subtype')) = 'hard' THEN 1 ELSE 0 END) AS hard_bounces,
           SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(data, '$.subtype')) = 'soft' THEN 1 ELSE 0 END) AS soft_bounces
         FROM email_events ee
         JOIN email_messages em ON em.id = ee.message_id
         JOIN email_campaigns ec ON ec.id = em.campaign_id
         WHERE ec.tenant_id = ? AND ee.type = 'bounce' AND ec.deleted_at IS NULL`,
        [tenantId]
      ),
      // Compteurs de relances (automation)
      pool.execute<RowDataPacket[]>(
        `SELECT
           COUNT(CASE WHEN status = 'pending'   THEN 1 END) AS pending_relances,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_relances
         FROM email_relances
         WHERE tenant_id = ?`,
        [tenantId]
      ),
    ])

    const base    = campRows[0]  as Record<string, number>
    const bRow    = bounceRows[0] as Record<string, string | null>
    const rRow    = relanceRows[0] as Record<string, string | null>
    const evMap: Record<string, number> = {}
    for (const e of evRows as Array<{ type: string; cnt: number }>) evMap[e.type] = Number(e.cnt)

    const sent       = Number(base.total_sent)       || 0
    const recipients = Number(base.total_recipients) || 0
    const spam       = evMap['spam'] || 0

    return {
      totalSent:          sent,
      totalRecipients:    recipients,
      totalFailed:        Number(base.total_failed)    || 0,
      totalCampaigns:     Number(base.total_campaigns) || 0,
      opens:              evMap['open']        || 0,
      clicks:             evMap['click']       || 0,
      bounces:            evMap['bounce']      || 0,
      hardBounces:        Number(bRow.hard_bounces)  || 0,
      softBounces:        Number(bRow.soft_bounces)  || 0,
      unsubscribes:       evMap['unsubscribe'] || 0,
      spamComplaints:     spam,
      pendingRelances:    Number(rRow.pending_relances)   || 0,
      completedRelances:  Number(rRow.completed_relances) || 0,
      openRate:     sent > 0 ? +((evMap['open']        || 0) / sent * 100).toFixed(1) : 0,
      clickRate:    sent > 0 ? +((evMap['click']       || 0) / sent * 100).toFixed(1) : 0,
      bounceRate:   sent > 0 ? +((evMap['bounce']      || 0) / sent * 100).toFixed(1) : 0,
      unsubRate:    sent > 0 ? +((evMap['unsubscribe'] || 0) / sent * 100).toFixed(1) : 0,
      spamRate:     sent > 0 ? +(spam / sent * 100).toFixed(2) : 0,
      deliverRate:  recipients > 0 ? +((sent / recipients) * 100).toFixed(1) : 0,
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
          await emailQueue.add({ messageId, campaignId: relance.campaign_id, tenantId: relance.tenant_id, to: person.email_address, fromName: relance.expediteur, subject: relance.new_subject, html })
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

  // ── A/B Testing ─────────────────────────────────────────────────────────────

  async createAbTest(payload: {
    name: string
    expediteur: string
    blocsJson: object[]
    subjectA: string
    subjectB: string
    groupIds: number[]
    splitPercent: number
    winnerMetric: 'open_rate' | 'click_rate'
    waitHours: number
    tenantId: number
    userId: number
  }) {
    const { name, expediteur, blocsJson, subjectA, subjectB, groupIds, splitPercent, winnerMetric, waitHours, tenantId, userId } = payload

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      // 1 — Tous les contacts des groupes (sans doublons, sans opted_out)
      const placeholders = groupIds.map(() => '?').join(',')
      const [allRows] = await conn.execute<ContactRow[]>(
        `SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.company, c.custom_fields
         FROM contacts c
         JOIN contact_group_members cgm ON cgm.contact_id = c.id
         WHERE cgm.group_id IN (${placeholders})
           AND c.email IS NOT NULL
           AND c.is_opted_out = FALSE
           AND c.deleted_at IS NULL
           AND c.tenant_id = ?`,
        [...groupIds, tenantId]
      )

      if (!allRows.length) throw new Error('Aucun contact éligible dans les groupes sélectionnés')

      // 2 — Vérification des crédits (total campagne = A + B + reste = 100%)
      const [creditRows] = await conn.execute<RowDataPacket[]>(
        `SELECT email_credits FROM users WHERE id = ?`, [userId]
      )
      const credits = Number((creditRows as RowDataPacket[])[0]?.email_credits ?? 0)
      if (credits < allRows.length) {
        throw new Error(`Crédits insuffisants — ${credits} disponibles, ${allRows.length} nécessaires`)
      }

      // 3 — Mélange aléatoire (Fisher-Yates)
      const contacts = [...allRows]
      for (let i = contacts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[contacts[i], contacts[j]] = [contacts[j], contacts[i]]
      }

      // 4 — Découpage : A | B | reste
      const splitCount = Math.max(1, Math.floor(contacts.length * splitPercent / 100))
      const contactsA  = contacts.slice(0, splitCount)
      const contactsB  = contacts.slice(splitCount, splitCount * 2)
      if (!contactsB.length) throw new Error(`Pas assez de contacts pour 2 groupes de ${splitPercent}% (${contacts.length} contacts)`)

      // 5 — Campagne A
      const [campARes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO email_campaigns (tenant_id, created_by, name, category, sujet, expediteur, blocs_json, status, total_recipients)
         VALUES (?, ?, ?, 'A/B Test', ?, ?, ?, 'sending', ?)`,
        [tenantId, userId, `[A] ${name}`, subjectA, expediteur, JSON.stringify(blocsJson), contactsA.length]
      )
      const campaignAId = campARes.insertId

      // 6 — Campagne B
      const [campBRes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO email_campaigns (tenant_id, created_by, name, category, sujet, expediteur, blocs_json, status, total_recipients)
         VALUES (?, ?, ?, 'A/B Test', ?, ?, ?, 'sending', ?)`,
        [tenantId, userId, `[B] ${name}`, subjectB, expediteur, JSON.stringify(blocsJson), contactsB.length]
      )
      const campaignBId = campBRes.insertId

      // 7 — Messages A + B
      const toEnqueue: { messageId: number; contact: ContactRow; campaignId: number; subject: string }[] = []

      for (const contact of contactsA) {
        const [r] = await conn.execute<ResultSetHeader>(
          `INSERT INTO email_messages (campaign_id, contact_id, email_address, first_name, last_name, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [campaignAId, contact.id, contact.email, contact.first_name, contact.last_name]
        )
        toEnqueue.push({ messageId: r.insertId, contact, campaignId: campaignAId, subject: subjectA })
      }
      for (const contact of contactsB) {
        const [r] = await conn.execute<ResultSetHeader>(
          `INSERT INTO email_messages (campaign_id, contact_id, email_address, first_name, last_name, status)
           VALUES (?, ?, ?, ?, ?, 'pending')`,
          [campaignBId, contact.id, contact.email, contact.first_name, contact.last_name]
        )
        toEnqueue.push({ messageId: r.insertId, contact, campaignId: campaignBId, subject: subjectB })
      }

      // 8 — Décrémenter crédits (A + B seulement; le reste sera déduit à l'évaluation)
      await conn.execute(
        `UPDATE users SET email_credits = email_credits - ? WHERE id = ?`,
        [contactsA.length + contactsB.length, userId]
      )

      // 9 — Enregistrement du test A/B
      const scheduledAt = new Date(Date.now() + waitHours * 60 * 60 * 1000)
      const [abRes] = await conn.execute<ResultSetHeader>(
        `INSERT INTO email_ab_tests
         (tenant_id, created_by, name, campaign_a_id, campaign_b_id,
          expediteur, blocs_json, subject_a, subject_b, group_ids_json,
          split_percent, winner_metric, wait_hours, status, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running', ?)`,
        [tenantId, userId, name, campaignAId, campaignBId,
         expediteur, JSON.stringify(blocsJson), subjectA, subjectB, JSON.stringify(groupIds),
         splitPercent, winnerMetric, waitHours, scheduledAt]
      )

      await conn.commit()

      // 10 — Enqueue (hors transaction)
      for (const { messageId, contact, campaignId, subject } of toEnqueue) {
        const html = blocksToHtml(
          blocsJson as any[],
          expediteur,
          subject,
          buildContactVars(contact),
          messageId
        )
        await emailQueue.add({ messageId, campaignId, tenantId, to: contact.email, fromName: expediteur, subject, html })
      }

      return {
        abTestId:   abRes.insertId,
        campaignAId,
        campaignBId,
        sentA:      contactsA.length,
        sentB:      contactsB.length,
        scheduledAt,
      }

    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async getAbTests(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         t.id, t.name, t.subject_a, t.subject_b, t.split_percent,
         t.winner_metric, t.wait_hours, t.status,
         t.winner_id, t.winner_subject, t.rate_a, t.rate_b,
         t.scheduled_at, t.completed_at, t.created_at,
         ca.total_sent AS sent_a, cb.total_sent AS sent_b
       FROM email_ab_tests t
       LEFT JOIN email_campaigns ca ON ca.id = t.campaign_a_id
       LEFT JOIN email_campaigns cb ON cb.id = t.campaign_b_id
       WHERE t.tenant_id = ?
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [tenantId]
    )
    return rows
  },

  async cancelAbTest(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE email_ab_tests SET status = 'cancelled' WHERE id = ? AND tenant_id = ? AND status = 'running'`,
      [id, tenantId]
    )
  },

  // Appelé par le job Bull toutes les heures
  async executePendingAbTests() {
    const [due] = await pool.execute<RowDataPacket[]>(
      `SELECT
         t.id, t.name, t.campaign_a_id, t.campaign_b_id,
         t.subject_a, t.subject_b, t.winner_metric,
         t.expediteur, t.blocs_json, t.group_ids_json,
         t.tenant_id, t.created_by
       FROM email_ab_tests t
       WHERE t.status = 'running' AND t.scheduled_at <= NOW()`
    )

    for (const test of due as Array<{
      id: number; name: string; campaign_a_id: number; campaign_b_id: number
      subject_a: string; subject_b: string; winner_metric: 'open_rate' | 'click_rate'
      expediteur: string; blocs_json: string; group_ids_json: string
      tenant_id: number; created_by: number
    }>) {
      try {
        // Stats A et B
        const [statsRows] = await pool.execute<RowDataPacket[]>(
          `SELECT
             ec.id AS campaign_id, ec.total_sent,
             COUNT(DISTINCT CASE WHEN ee.type = 'open'  THEN ee.message_id END) AS opens,
             COUNT(DISTINCT CASE WHEN ee.type = 'click' THEN ee.message_id END) AS clicks
           FROM email_campaigns ec
           LEFT JOIN email_messages em ON em.campaign_id = ec.id
           LEFT JOIN email_events   ee ON ee.message_id  = em.id
           WHERE ec.id IN (?, ?)
           GROUP BY ec.id`,
          [test.campaign_a_id, test.campaign_b_id]
        )

        const statsMap: Record<number, { sent: number; opens: number; clicks: number }> = {}
        for (const row of statsRows as Array<{ campaign_id: number; total_sent: number; opens: number; clicks: number }>) {
          statsMap[row.campaign_id] = { sent: Number(row.total_sent) || 0, opens: Number(row.opens) || 0, clicks: Number(row.clicks) || 0 }
        }

        const sA = statsMap[test.campaign_a_id] ?? { sent: 0, opens: 0, clicks: 0 }
        const sB = statsMap[test.campaign_b_id] ?? { sent: 0, opens: 0, clicks: 0 }

        const getRate = (s: typeof sA) => {
          if (!s.sent) return 0
          return test.winner_metric === 'open_rate' ? s.opens / s.sent : s.clicks / s.sent
        }

        const rateA = getRate(sA)
        const rateB = getRate(sB)
        const winnerCampId = rateA >= rateB ? test.campaign_a_id : test.campaign_b_id
        const winnerSubject = rateA >= rateB ? test.subject_a : test.subject_b

        // Contacts restants (pas encore touchés par A ou B)
        const groupIds = JSON.parse(test.group_ids_json) as number[]
        const ph = groupIds.map(() => '?').join(',')
        const [remainder] = await pool.execute<ContactRow[]>(
          `SELECT DISTINCT c.id, c.first_name, c.last_name, c.email, c.company, c.custom_fields
           FROM contacts c
           JOIN contact_group_members cgm ON cgm.contact_id = c.id
           WHERE cgm.group_id IN (${ph})
             AND c.email IS NOT NULL
             AND c.is_opted_out = FALSE
             AND c.deleted_at IS NULL
             AND c.tenant_id = ?
             AND c.id NOT IN (
               SELECT DISTINCT em.contact_id
               FROM email_messages em
               WHERE em.campaign_id IN (?, ?) AND em.contact_id IS NOT NULL
             )`,
          [...groupIds, test.tenant_id, test.campaign_a_id, test.campaign_b_id]
        )

        if (remainder.length > 0) {
          // Vérifier crédits disponibles
          const [cRows] = await pool.execute<RowDataPacket[]>(
            `SELECT email_credits FROM users WHERE id = ?`, [test.created_by]
          )
          const availableCredits = Number((cRows as RowDataPacket[])[0]?.email_credits ?? 0)

          if (availableCredits >= remainder.length) {
            const blocsJson = JSON.parse(test.blocs_json) as any[]

            const [campWinRes] = await pool.execute<ResultSetHeader>(
              `INSERT INTO email_campaigns (tenant_id, created_by, name, category, sujet, expediteur, blocs_json, status, total_recipients)
               VALUES (?, ?, ?, 'A/B Test', ?, ?, ?, 'sending', ?)`,
              [test.tenant_id, test.created_by, `[Winner] ${test.name}`, winnerSubject, test.expediteur, test.blocs_json, remainder.length]
            )
            const winnerNewCampId = campWinRes.insertId

            const toEnqueue: { messageId: number; contact: ContactRow }[] = []
            for (const contact of remainder) {
              const [r] = await pool.execute<ResultSetHeader>(
                `INSERT INTO email_messages (campaign_id, contact_id, email_address, first_name, last_name, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [winnerNewCampId, contact.id, contact.email, contact.first_name, contact.last_name]
              )
              toEnqueue.push({ messageId: r.insertId, contact })
            }

            await pool.execute(
              `UPDATE users SET email_credits = email_credits - ? WHERE id = ?`,
              [remainder.length, test.created_by]
            )

            for (const { messageId, contact } of toEnqueue) {
              const html = blocksToHtml(
                blocsJson, test.expediteur, winnerSubject,
                buildContactVars(contact),
                messageId
              )
              await emailQueue.add({ messageId, campaignId: winnerNewCampId, tenantId: test.tenant_id, to: contact.email, fromName: test.expediteur, subject: winnerSubject, html })
            }
          }
        }

        await pool.execute(
          `UPDATE email_ab_tests
           SET status = 'completed', winner_id = ?, winner_subject = ?,
               rate_a = ?, rate_b = ?, completed_at = NOW()
           WHERE id = ?`,
          [winnerCampId, winnerSubject, (rateA * 100).toFixed(2), (rateB * 100).toFixed(2), test.id]
        )

        console.log(`[AB TEST] ✅ ${test.name} — Gagnant: "${winnerSubject}" (A:${(rateA*100).toFixed(1)}% vs B:${(rateB*100).toFixed(1)}%)`)

      } catch (err) {
        console.error(`[AB TEST] ❌ Erreur test #${test.id}:`, err)
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

  // ── Email Flows ──────────────────────────────────────────────────────────────

  async getFlows(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, description, status, trigger_type, group_ids_json,
              total_contacts, opens, clicks, created_at,
              JSON_LENGTH(nodes_json) AS node_count
       FROM email_flows
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows.map(r => ({
      ...r,
      group_ids_json: typeof r.group_ids_json === 'string'
        ? JSON.parse(r.group_ids_json || '[]')
        : (r.group_ids_json ?? []),
    }))
  },

  async getFlow(id: number, tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM email_flows WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [id, tenantId]
    )
    if (!rows.length) throw new Error('Flow introuvable')
    const row = rows[0]
    return {
      ...row,
      nodes_json: typeof row.nodes_json === 'string' ? JSON.parse(row.nodes_json) : row.nodes_json,
      edges_json: typeof row.edges_json === 'string' ? JSON.parse(row.edges_json) : row.edges_json,
    }
  },

  async createFlow(data: {
    name: string; description?: string; nodesJson: object[]; edgesJson: object[];
    triggerType: string; groupIds?: number[]; tenantId: number; userId: number
  }) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_flows (tenant_id, created_by, name, description, trigger_type, group_ids_json, nodes_json, edges_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.tenantId, data.userId, data.name, data.description ?? '', data.triggerType,
       JSON.stringify(data.groupIds ?? []),
       JSON.stringify(data.nodesJson), JSON.stringify(data.edgesJson)]
    )
    return { id: result.insertId }
  },

  async updateFlow(id: number, tenantId: number, data: {
    name?: string; description?: string; nodesJson?: object[]; edgesJson?: object[];
    triggerType?: string; groupIds?: number[]
  }) {
    await pool.execute(
      `UPDATE email_flows
       SET name           = COALESCE(?, name),
           description    = COALESCE(?, description),
           trigger_type   = COALESCE(?, trigger_type),
           group_ids_json = COALESCE(?, group_ids_json),
           nodes_json     = COALESCE(?, nodes_json),
           edges_json     = COALESCE(?, edges_json),
           updated_at     = NOW()
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [
        data.name        ?? null,
        data.description ?? null,
        data.triggerType ?? null,
        data.groupIds    ? JSON.stringify(data.groupIds) : null,
        data.nodesJson   ? JSON.stringify(data.nodesJson) : null,
        data.edgesJson   ? JSON.stringify(data.edgesJson) : null,
        id, tenantId,
      ]
    )
  },

  async deleteFlow(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE email_flows SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  async duplicateFlow(id: number, tenantId: number, userId: number) {
    const raw  = await emailService.getFlow(id, tenantId) as Record<string, unknown>
    const name = `${raw.name} (copie)`
    const desc = String(raw.description ?? '')
    const trig = String(raw.trigger_type ?? 'subscribe')
    const nj   = JSON.stringify(raw.nodes_json)
    const ej   = JSON.stringify(raw.edges_json)
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_flows (tenant_id, created_by, name, description, trigger_type, nodes_json, edges_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, name, desc, trig, nj, ej]
    )
    return { id: result.insertId }
  },

  async setFlowStatus(id: number, tenantId: number, status: 'active' | 'paused' | 'draft') {
    await pool.execute(
      `UPDATE email_flows SET status = ?, updated_at = NOW()
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [status, id, tenantId]
    )
    // Enrollment automatique lors de l'activation
    if (status === 'active') {
      emailService.enrollGroupsInFlow(id, tenantId).catch((err) =>
        console.error('[FLOW] Enrollment failed:', err.message)
      )
    }
  },

  // Enrôle tous les contacts des groupes associés au flow dans email_flow_contacts
  async enrollGroupsInFlow(flowId: number, tenantId: number): Promise<number> {
    const [flowRows] = await pool.execute<RowDataPacket[]>(
      `SELECT group_ids_json, nodes_json, edges_json
       FROM email_flows WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [flowId, tenantId]
    )
    if (!flowRows.length) return 0

    const flow = flowRows[0]
    const groupIds: number[] = typeof flow.group_ids_json === 'string'
      ? JSON.parse(flow.group_ids_json || '[]')
      : (flow.group_ids_json ?? [])

    if (!groupIds.length) return 0

    const nodes: { id: string }[] = typeof flow.nodes_json === 'string'
      ? JSON.parse(flow.nodes_json)
      : flow.nodes_json
    const edges: { source: string; target: string }[] = typeof flow.edges_json === 'string'
      ? JSON.parse(flow.edges_json)
      : flow.edges_json

    // Le premier nœud est celui qu'aucune edge ne cible
    const targets = new Set(edges.map(e => e.target))
    const firstNode = nodes.find(n => !targets.has(n.id))
    if (!firstNode) return 0

    const ph = groupIds.map(() => '?').join(',')
    const [contacts] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT c.id
       FROM contacts c
       JOIN contact_group_members cgm ON cgm.contact_id = c.id
       WHERE cgm.group_id IN (${ph})
         AND c.tenant_id = ?
         AND c.deleted_at IS NULL
         AND c.is_opted_out = FALSE`,
      [...groupIds, tenantId]
    )

    if (!contacts.length) return 0

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    let enrolled = 0

    for (const c of contacts) {
      const [r] = await pool.execute<ResultSetHeader>(
        `INSERT IGNORE INTO email_flow_contacts
           (tenant_id, flow_id, contact_id, current_node_id, status, next_run_at)
         VALUES (?, ?, ?, ?, 'active', ?)`,
        [tenantId, flowId, c.id, firstNode.id, now]
      )
      enrolled += r.affectedRows
    }

    if (enrolled > 0) {
      await pool.execute(
        `UPDATE email_flows SET total_contacts = total_contacts + ? WHERE id = ?`,
        [enrolled, flowId]
      )
    }

    return enrolled
  },

  // Enrôle un ou plusieurs contacts dans tous les flows actifs liés à un groupe
  async enrollContactsInActiveFlows(groupId: number, contactIds: number[], tenantId: number): Promise<void> {
    const [flows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, nodes_json, edges_json
       FROM email_flows
       WHERE tenant_id = ? AND status = 'active' AND deleted_at IS NULL
         AND JSON_CONTAINS(group_ids_json, CAST(? AS JSON), '$')`,
      [tenantId, groupId]
    )

    for (const flow of flows) {
      const nodes: { id: string }[] = typeof flow.nodes_json === 'string'
        ? JSON.parse(flow.nodes_json)
        : flow.nodes_json
      const edges: { source: string; target: string }[] = typeof flow.edges_json === 'string'
        ? JSON.parse(flow.edges_json)
        : flow.edges_json

      const targets = new Set(edges.map((e: { target: string }) => e.target))
      const firstNode = nodes.find(n => !targets.has(n.id))
      if (!firstNode) continue

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
      let enrolled = 0

      for (const contactId of contactIds) {
        const [r] = await pool.execute<ResultSetHeader>(
          `INSERT IGNORE INTO email_flow_contacts
             (tenant_id, flow_id, contact_id, current_node_id, status, next_run_at)
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [tenantId, flow.id, contactId, firstNode.id, now]
        )
        enrolled += r.affectedRows
      }

      if (enrolled > 0) {
        await pool.execute(
          `UPDATE email_flows SET total_contacts = total_contacts + ? WHERE id = ?`,
          [enrolled, flow.id]
        )
      }
    }
  },

  async getFlowStats(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_flows,
         COALESCE(SUM(total_contacts), 0)                   AS total_contacts,
         COALESCE(SUM(opens), 0)                            AS total_opens,
         COALESCE(SUM(clicks), 0)                           AS total_clicks
       FROM email_flows WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )
    const r = rows[0]
    const contacts = Number(r.total_contacts)
    const opens    = Number(r.total_opens)
    return {
      activeFlows:    Number(r.active_flows ?? 0),
      totalContacts:  contacts,
      openRate:       contacts > 0 ? Math.round((opens / contacts) * 1000) / 10 : 0,
      totalClics:     Number(r.total_clicks ?? 0),
    }
  },

  async executeFlows() {
    const conn = await pool.getConnection()
    try {
      // Find active flow contacts due for processing
      const [contacts] = await conn.execute<RowDataPacket[]>(
        `SELECT efc.id, efc.flow_id, efc.contact_id, efc.current_node_id, efc.tenant_id,
                ef.nodes_json, ef.edges_json,
                c.email, c.first_name, c.last_name, c.company
         FROM email_flow_contacts efc
         JOIN email_flows ef ON ef.id = efc.flow_id AND ef.status = 'active' AND ef.deleted_at IS NULL
         JOIN contacts c ON c.id = efc.contact_id
         WHERE efc.status = 'active' AND efc.next_run_at <= NOW()
         LIMIT 100`,
        []
      )

      for (const contact of contacts) {
        const nodes: { id: string; type: string; data: Record<string, unknown> }[] =
          typeof contact.nodes_json === 'string' ? JSON.parse(contact.nodes_json) : contact.nodes_json
        const edges: { source: string; target: string; sourceHandle?: string }[] =
          typeof contact.edges_json === 'string' ? JSON.parse(contact.edges_json) : contact.edges_json

        const currentNode = nodes.find(n => n.id === contact.current_node_id)
        if (!currentNode) {
          await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
          continue
        }

        // Find next node(s) from edges
        const outEdges = edges.filter(e => e.source === currentNode.id)

        if (currentNode.type === 'sendEmailNode') {
          const d = currentNode.data
          if (d.templateId) {
            const [tplRows] = await conn.execute<RowDataPacket[]>(
              `SELECT blocs_json FROM email_templates WHERE id = ? AND tenant_id = ?`,
              [d.templateId, contact.tenant_id]
            )
            if (tplRows.length) {
              const blocs = typeof tplRows[0].blocs_json === 'string'
                ? JSON.parse(tplRows[0].blocs_json) : tplRows[0].blocs_json
              const fromName = String(d.emailName ?? 'BIAR GROUP')
              const vars = buildContactVars(contact as unknown as ContactRow)
              const subject = String(d.subject ?? '').replace(/\{\{first_name\}\}/g, vars.prenom ?? '')

              // Créer un email_message pour le tracking (pixels, clics, désabonnement)
              const [msgResult] = await conn.execute<ResultSetHeader>(
                `INSERT INTO email_messages (flow_id, contact_id, email_address, first_name, last_name, status)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [contact.flow_id, contact.contact_id, contact.email, contact.first_name, contact.last_name]
              )
              const messageId = msgResult.insertId

              const html = blocksToHtml(blocs, fromName, subject, vars, messageId)
              await emailQueue.add({
                messageId,
                flowId:    contact.flow_id,
                tenantId:  contact.tenant_id,
                to:        contact.email,
                fromName,
                subject,
                html,
              })
            }
          }
          // Move to next node
          if (outEdges.length) {
            const nextId = outEdges[0].target
            const nextNode = nodes.find(n => n.id === nextId)
            if (nextNode?.type === 'delayNode') {
              const val  = Number(nextNode.data.delayValue ?? 3)
              const unit = String(nextNode.data.delayUnit ?? 'jours')
              const ms   = unit === 'heures' ? val * 3600000 : val * 86400000
              const runAt = new Date(Date.now() + ms).toISOString().slice(0, 19).replace('T', ' ')
              // Skip delay node, set next_run_at and move current_node to node after delay
              const afterDelay = edges.find(e => e.source === nextId)
              await conn.execute(
                `UPDATE email_flow_contacts SET current_node_id = ?, next_run_at = ? WHERE id = ?`,
                [afterDelay?.target ?? nextId, runAt, contact.id]
              )
            } else if (nextNode?.type === 'endNode') {
              await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
            } else {
              await conn.execute(
                `UPDATE email_flow_contacts SET current_node_id = ?, next_run_at = NOW() WHERE id = ?`,
                [nextId, contact.id]
              )
            }
          } else {
            await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
          }

        } else if (currentNode.type === 'conditionNode') {
          // Check if contact opened any email in this flow
          const [evtRows] = await conn.execute<RowDataPacket[]>(
            `SELECT COUNT(*) AS cnt FROM email_events ee
             JOIN email_messages em ON em.id = ee.message_id
             JOIN email_campaigns ec ON ec.id = em.campaign_id
             WHERE ec.tenant_id = ? AND em.contact_id = ? AND ee.type = 'open'`,
            [contact.tenant_id, contact.contact_id]
          )
          const opened = Number(evtRows[0]?.cnt ?? 0) > 0
          const branch = outEdges.find(e => e.sourceHandle === (opened ? 'yes' : 'no'))
          const nextId = branch?.target ?? outEdges[0]?.target
          if (nextId) {
            const nextNode = nodes.find(n => n.id === nextId)
            if (nextNode?.type === 'endNode') {
              await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
            } else {
              await conn.execute(
                `UPDATE email_flow_contacts SET current_node_id = ?, next_run_at = NOW() WHERE id = ?`,
                [nextId, contact.id]
              )
            }
          } else {
            await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
          }

        } else if (currentNode.type === 'endNode') {
          await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])

        } else {
          // actionNode, abTestNode — skip, move to next
          if (outEdges.length) {
            await conn.execute(
              `UPDATE email_flow_contacts SET current_node_id = ?, next_run_at = NOW() WHERE id = ?`,
              [outEdges[0].target, contact.id]
            )
          } else {
            await conn.execute(`UPDATE email_flow_contacts SET status = 'completed' WHERE id = ?`, [contact.id])
          }
        }
      }
    } finally {
      conn.release()
    }
  },

  // ── SMTP Configs ─────────────────────────────────────────────────────────────

  async getSmtpConfigs(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, provider, host, port, secure, username, from_name, from_email,
              reply_to, is_default, is_verified, created_at
       FROM email_smtp_configs
       WHERE tenant_id = ?
       ORDER BY is_default DESC, created_at DESC`,
      [tenantId]
    )
    return rows
  },

  async createSmtpConfig(data: {
    name: string
    provider: 'brevo' | 'sendgrid' | 'custom'
    host: string
    port: number
    secure: boolean
    username: string
    password: string
    fromName: string
    fromEmail: string
    replyTo?: string | null
  }, tenantId: number) {
    const { encrypt } = await import('../helpers/crypto.helper')
    const passwordEnc = encrypt(data.password)

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_smtp_configs
       (tenant_id, name, provider, host, port, secure, username, password_enc, from_name, from_email, reply_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, data.name, data.provider, data.host, data.port,
        data.secure ? 1 : 0, data.username, passwordEnc,
        data.fromName, data.fromEmail, data.replyTo ?? null,
      ]
    )
    return { id: result.insertId }
  },

  async updateSmtpConfig(id: number, data: {
    name?: string
    host?: string
    port?: number
    secure?: boolean
    username?: string
    password?: string
    fromName?: string
    fromEmail?: string
    replyTo?: string | null
  }, tenantId: number) {
    const { encrypt } = await import('../helpers/crypto.helper')
    const { mailerService } = await import('./mailer.service')

    const fields: string[] = []
    const values: unknown[] = []

    if (data.name      !== undefined) { fields.push('name = ?');       values.push(data.name) }
    if (data.host      !== undefined) { fields.push('host = ?');       values.push(data.host) }
    if (data.port      !== undefined) { fields.push('port = ?');       values.push(data.port) }
    if (data.secure    !== undefined) { fields.push('secure = ?');     values.push(data.secure ? 1 : 0) }
    if (data.username  !== undefined) { fields.push('username = ?');   values.push(data.username) }
    if (data.fromName  !== undefined) { fields.push('from_name = ?');  values.push(data.fromName) }
    if (data.fromEmail !== undefined) { fields.push('from_email = ?'); values.push(data.fromEmail) }
    if (data.replyTo   !== undefined) { fields.push('reply_to = ?');   values.push(data.replyTo ?? null) }
    if (data.password  !== undefined) {
      fields.push('password_enc = ?', 'is_verified = 0')
      values.push(encrypt(data.password))
    }

    if (!fields.length) return

    values.push(id, tenantId)
    await pool.execute<ResultSetHeader>(
      `UPDATE email_smtp_configs SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      values as (string | number | boolean | null)[]
    )

    mailerService.invalidateCache(id)
  },

  async deleteSmtpConfig(id: number, tenantId: number) {
    const { mailerService } = await import('./mailer.service')
    await pool.execute(
      `DELETE FROM email_smtp_configs WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
    mailerService.invalidateCache(id)
  },

  async setSmtpDefault(id: number, tenantId: number) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute(
        `UPDATE email_smtp_configs SET is_default = 0 WHERE tenant_id = ?`,
        [tenantId]
      )
      await conn.execute(
        `UPDATE email_smtp_configs SET is_default = 1 WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
      )
      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async verifySmtpConfig(id: number, tenantId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM email_smtp_configs WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [id, tenantId]
    )
    if (!rows.length) throw new Error('Configuration SMTP introuvable')

    const { mailerService } = await import('./mailer.service')

    // On force la recréation du transporter pour ce test
    mailerService.invalidateCache(id)

    try {
      // verify() utilise resolveTransporter — on lui passe un tenantId fictif
      // mais on a besoin de vérifier CETTE config précisément.
      // On crée un transporter temporaire pour le test.
      const { decrypt } = await import('../helpers/crypto.helper')
      const nodemailer = (await import('nodemailer')).default
      const [cfgRows] = await pool.execute<RowDataPacket[]>(
        `SELECT host, port, secure, username, password_enc
         FROM email_smtp_configs WHERE id = ?`,
        [id]
      )
      const cfg = cfgRows[0]
      if (!cfg) return false

      const t = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: Boolean(cfg.secure),
        auth: { user: cfg.username, pass: decrypt(cfg.password_enc as string) },
      })
      await t.verify()

      await pool.execute(
        `UPDATE email_smtp_configs SET is_verified = 1, updated_at = NOW() WHERE id = ?`,
        [id]
      )
      return true
    } catch {
      await pool.execute(
        `UPDATE email_smtp_configs SET is_verified = 0, updated_at = NOW() WHERE id = ?`,
        [id]
      )
      return false
    }
  },

  // ── Domaines DNS ─────────────────────────────────────────────────────────────

  async getDomains(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, domain, provider, spf_status, dkim_status, dmarc_status, last_checked_at, created_at
       FROM email_domains WHERE tenant_id = ? ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows
  },

  async addDomain(domain: string, provider: 'brevo' | 'sendgrid' | 'custom', tenantId: number) {
    const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO email_domains (tenant_id, domain, provider)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE provider = VALUES(provider), updated_at = NOW()`,
      [tenantId, clean, provider]
    )
    return { id: result.insertId, domain: clean }
  },

  async deleteDomain(id: number, tenantId: number) {
    await pool.execute(
      `DELETE FROM email_domains WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  async verifyDomain(id: number, tenantId: number) {
    const dns = await import('dns/promises')

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT domain, provider FROM email_domains WHERE id = ? AND tenant_id = ? LIMIT 1`,
      [id, tenantId]
    )
    if (!(rows as RowDataPacket[]).length) throw new Error('Domaine introuvable')

    const { domain, provider } = (rows as RowDataPacket[])[0]

    // ── SPF ──────────────────────────────────────────────────────────────────
    let spfStatus: 'ok' | 'fail' = 'fail'
    try {
      const txtRecords = await dns.resolveTxt(domain)
      const fullSpf = txtRecords.flat().find(r => r.includes('v=spf1')) ?? ''

      if (provider === 'brevo'    && fullSpf.includes('spf.brevo.com'))  spfStatus = 'ok'
      if (provider === 'sendgrid' && fullSpf.includes('sendgrid.net'))    spfStatus = 'ok'
      if (provider === 'custom'   && fullSpf.includes('v=spf1'))          spfStatus = 'ok'

      // Brevo nouveau système : si le Code Brevo TXT est présent, accepter aussi
      if (provider === 'brevo' && spfStatus === 'fail') {
        const hasBrevoCode = txtRecords.flat().some(r => r.startsWith('brevo-code:'))
        if (hasBrevoCode) spfStatus = 'ok'
      }
    } catch { spfStatus = 'fail' }

    // ── DKIM ─────────────────────────────────────────────────────────────────
    // Brevo utilise des CNAME (brevo1._domainkey, brevo2._domainkey) depuis 2024
    // SendGrid utilise un TXT sur s1._domainkey
    let dkimStatus: 'ok' | 'fail' = 'fail'
    try {
      if (provider === 'brevo') {
        // Essaie CNAME brevo1 ou brevo2 (nouveau système Brevo)
        let found = false
        for (const sel of ['brevo1', 'brevo2', 'brevo']) {
          try {
            const r = await dns.resolveCname(`${sel}._domainkey.${domain}`)
            if (r.length) { found = true; break }
          } catch { /* continue */ }
          try {
            const r = await dns.resolveTxt(`${sel}._domainkey.${domain}`)
            if (r.length) { found = true; break }
          } catch { /* continue */ }
        }
        if (found) dkimStatus = 'ok'
      } else if (provider === 'sendgrid') {
        await dns.resolveCname(`s1._domainkey.${domain}`)
        dkimStatus = 'ok'
      } else {
        // custom — cherche n'importe quel selector commun
        for (const sel of ['default', 'mail', 'smtp', 'dkim', 'k1']) {
          try {
            await dns.resolveTxt(`${sel}._domainkey.${domain}`)
            dkimStatus = 'ok'; break
          } catch { /* continue */ }
        }
      }
    } catch { dkimStatus = 'fail' }

    // ── DMARC ────────────────────────────────────────────────────────────────
    let dmarcStatus: 'ok' | 'fail' = 'fail'
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`)
      const hasDmarc = dmarcRecords.flat().some(r => r.startsWith('v=DMARC1'))
      if (hasDmarc) dmarcStatus = 'ok'
    } catch { dmarcStatus = 'fail' }

    await pool.execute(
      `UPDATE email_domains
       SET spf_status = ?, dkim_status = ?, dmarc_status = ?, last_checked_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [spfStatus, dkimStatus, dmarcStatus, id]
    )

    return { domain, spfStatus, dkimStatus, dmarcStatus }
  },
}
