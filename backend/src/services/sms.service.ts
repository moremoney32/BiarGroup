import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { pool } from '../db/config'
import { normalizePhone } from '../helpers/phone.helper'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import type {
  SmsCampaign, SmsMessage, SmsTemplate, SmsSenderId,
  SmsScheduled, SmsContactList, SmsListContact, SmsShortLink,
} from '../types/sms.types'

// Mailer système (pour les notifications internes — utilise le SMTP par défaut)
function getSystemMailer() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp-relay.brevo.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function sendSenderIdNotification(params: {
  senderIdId: number
  senderIdValue: string
  tenantName: string
  requestedBy: string
  apiBase: string
}) {
  const { senderIdId, senderIdValue, tenantName, requestedBy, apiBase } = params
  const secret = process.env.JWT_SECRET!

  const approveToken = jwt.sign(
    { senderIdId, act: 'approve' },
    secret,
    { expiresIn: '7d' }
  )
  const rejectToken = jwt.sign(
    { senderIdId, act: 'reject' },
    secret,
    { expiresIn: '7d' }
  )

  const approveUrl = `${apiBase}/api/v1/sms/sender-ids/action?t=${approveToken}`
  const rejectUrl  = `${apiBase}/api/v1/sms/sender-ids/action?t=${rejectToken}`

  // Trouver tous les admins et super_admins de la plateforme
  const [admins] = await pool.execute<RowDataPacket[]>(
    "SELECT email, first_name FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL LIMIT 10"
  )
  if (admins.length === 0) return

  const mailer = getSystemMailer()
  const fromName  = process.env.EMAIL_DEFAULT_SENDER_NAME || 'BIAR Actor Hub'
  const fromEmail = process.env.EMAIL_DEFAULT_SENDER      || 'info@biargroup.sbs'

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <div style="background:#E91E8C;padding:16px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:18px">Demande de Sender ID</h1>
      </div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="color:#374151;font-size:14px;margin:0 0 16px">
          Le client <strong>${tenantName}</strong> (demandé par <strong>${requestedBy}</strong>)
          souhaite utiliser le Sender ID suivant :
        </p>
        <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:16px;text-align:center;margin:0 0 24px">
          <span style="font-size:22px;font-weight:700;color:#EA580C;letter-spacing:2px">${senderIdValue}</span>
        </div>
        <p style="color:#6B7280;font-size:12px;margin:0 0 20px">
          Ce Sender ID apparaîtra sur le téléphone du destinataire à la place du numéro.
          Vérifiez qu'il ne s'agit pas d'une usurpation de marque.
        </p>
        <div style="display:flex;gap:12px">
          <a href="${approveUrl}"
            style="flex:1;display:block;background:#16A34A;color:#fff;text-align:center;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
            ✅ Approuver
          </a>
          <a href="${rejectUrl}"
            style="flex:1;display:block;background:#DC2626;color:#fff;text-align:center;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
            ❌ Rejeter
          </a>
        </div>
        <p style="color:#9CA3AF;font-size:10px;margin:16px 0 0;text-align:center">
          Ces liens expirent dans 7 jours. Aucune connexion requise.
        </p>
      </div>
    </div>
  `

  for (const admin of admins as RowDataPacket[]) {
    await mailer.sendMail({
      from:    `"${fromName}" <${fromEmail}>`,
      to:      admin.email as string,
      subject: `[BIAR] Sender ID en attente : ${senderIdValue} — ${tenantName}`,
      html,
    }).catch(() => { /* silencieux — notif non bloquante */ })
  }
}

// ── Helpers internes ──────────────────────────────────────────

// Nombre de segments SMS (GSM-7 = 160 chars, Unicode = 70 chars)
function countSegments(text: string): number {
  const isGsm = /^[\x00-\x7F@£$¥èéùìòçØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜàäöñü§¿\n\r]*$/.test(text)
  const limit = isGsm ? 160 : 70
  const segLimit = isGsm ? 153 : 67
  return text.length <= limit ? 1 : Math.ceil(text.length / segLimit)
}

// Hash OTP : sha256(code + tenantId + phone) — pas de bcrypt, OTP est éphémère
function hashOtpCode(code: string, tenantId: number, phone: string): string {
  return crypto.createHash('sha256').update(`${code}:${tenantId}:${phone}`).digest('hex')
}

// Code court URL : 6 chars base64url (cryptographiquement sûr)
async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomBytes(4).toString('base64url').slice(0, 6)
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_short_links WHERE code = ?', [code]
    )
    if (rows.length === 0) return code
  }
  throw new Error('Impossible de générer un code court unique')
}

// Valide le format Sender ID : 1–11 chars, A-Z a-z 0-9 uniquement
const SENDER_ID_RE = /^[A-Za-z0-9]{1,11}$/

// ── Campagnes ─────────────────────────────────────────────────

export const smsService = {

  async getCampaigns(
    tenantId: number,
    opts: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ campaigns: SmsCampaign[]; total: number }> {
    const page  = Math.max(1, opts.page  ?? 1)
    const limit = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE tenant_id = ? AND deleted_at IS NULL'
    const params: (string | number | null)[] = [tenantId]

    if (opts.status) {
      where += ' AND status = ?'
      params.push(opts.status)
    }

    // pool.query (text protocol) évite le bug mysql2 avec LIMIT/OFFSET en prepared statements
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM sms_campaigns ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_campaigns ${where}`,
      params
    )

    return { campaigns: rows as SmsCampaign[], total: Number(countRows[0]?.total ?? 0) }
  },

  async getCampaignById(id: number, tenantId: number): Promise<SmsCampaign | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_campaigns WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    )
    return rows[0] as SmsCampaign ?? null
  },

  async createCampaign(
    data: { name: string; message: string; senderId: string; listIds: number[]; scheduledAt?: string },
    tenantId: number,
    userId: number
  ): Promise<SmsCampaign> {
    if (!SENDER_ID_RE.test(data.senderId)) {
      throw new Error('Sender ID invalide — 1 à 11 caractères alphanumériques uniquement')
    }

    // Vérifier que le sender ID est approuvé pour ce tenant
    const [senderRows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM sms_sender_ids WHERE tenant_id = ? AND sender_id = ? AND status = 'approved'",
      [tenantId, data.senderId]
    )
    if (senderRows.length === 0) {
      throw new Error(`Sender ID "${data.senderId}" non approuvé pour ce compte`)
    }

    const scheduledAt = data.scheduledAt ?? null

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO sms_campaigns (tenant_id, created_by, name, message, sender_id, status, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, userId, data.name, data.message, data.senderId,
          scheduledAt ? 'scheduled' : 'draft', scheduledAt]
      )
      const campaignId = result.insertId

      // Lier les listes à la campagne
      if (data.listIds.length > 0) {
        const values = data.listIds.map(() => '(?, ?)').join(', ')
        const params = data.listIds.flatMap(lid => [campaignId, lid])
        await conn.execute(
          `INSERT IGNORE INTO sms_campaign_lists (campaign_id, list_id) VALUES ${values}`,
          params
        )
      }

      await conn.commit()

      const [newRows] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM sms_campaigns WHERE id = ?', [campaignId]
      )
      return newRows[0] as SmsCampaign
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async updateCampaign(
    id: number,
    data: Partial<{ name: string; message: string; senderId: string; listIds: number[]; scheduledAt: string | null }>,
    tenantId: number
  ): Promise<SmsCampaign> {
    const existing = await smsService.getCampaignById(id, tenantId)
    if (!existing) throw new Error('Campagne introuvable')
    if (existing.status !== 'draft' && existing.status !== 'scheduled') {
      throw new Error('Seules les campagnes en brouillon ou planifiées peuvent être modifiées')
    }

    if (data.senderId && !SENDER_ID_RE.test(data.senderId)) {
      throw new Error('Sender ID invalide — 1 à 11 caractères alphanumériques uniquement')
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const sets: string[] = ['updated_at = NOW()']
      const params: (string | number | null)[] = []

      if (data.name    !== undefined) { sets.push('name = ?');       params.push(data.name) }
      if (data.message !== undefined) { sets.push('message = ?');    params.push(data.message) }
      if (data.senderId !== undefined) { sets.push('sender_id = ?'); params.push(data.senderId) }
      if ('scheduledAt' in data) {
        sets.push('scheduled_at = ?', 'status = ?')
        params.push(data.scheduledAt ?? null, data.scheduledAt ? 'scheduled' : 'draft')
      }

      params.push(id, tenantId)
      await conn.execute(
        `UPDATE sms_campaigns SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`,
        params
      )

      if (data.listIds !== undefined) {
        await conn.execute('DELETE FROM sms_campaign_lists WHERE campaign_id = ?', [id])
        if (data.listIds.length > 0) {
          const values = data.listIds.map(() => '(?, ?)').join(', ')
          await conn.execute(
            `INSERT IGNORE INTO sms_campaign_lists (campaign_id, list_id) VALUES ${values}`,
            data.listIds.flatMap(lid => [id, lid])
          )
        }
      }

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_campaigns WHERE id = ?', [id]
    )
    return rows[0] as SmsCampaign
  },

  async deleteCampaign(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_campaigns SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Campagne introuvable')
  },

  /**
   * Lance l'envoi d'une campagne :
   * 1. Charge les contacts des listes (dédupliqués, non opt-out)
   * 2. Crée les sms_messages en batch
   * 3. Enqueue dans Bull
   * 4. Met à jour la campagne status=sending
   */
  async sendCampaign(campaignId: number, tenantId: number): Promise<{ queued: number }> {
    const campaign = await smsService.getCampaignById(campaignId, tenantId)
    if (!campaign) throw new Error('Campagne introuvable')
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Cette campagne ne peut pas être envoyée dans son état actuel')
    }

    // Charger les listes liées
    const [listRows] = await pool.execute<RowDataPacket[]>(
      'SELECT list_id FROM sms_campaign_lists WHERE campaign_id = ?',
      [campaignId]
    )
    if (listRows.length === 0) throw new Error('Aucune liste de contacts liée à cette campagne')

    const listIds = listRows.map(r => r.list_id as number)

    // Charger les contacts (dédupliqués, non opt-out) — pagination pour éviter saturation mémoire
    const seenPhones = new Set<string>()
    const contacts: Array<{ phone: string }> = []
    const BATCH = 500

    for (const listId of listIds) {
      let offset = 0
      while (true) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT phone FROM sms_list_contacts
           WHERE list_id = ? AND opted_out = 0
           LIMIT ? OFFSET ?`,
          [listId, BATCH, offset]
        )
        if ((rows as RowDataPacket[]).length === 0) break
        for (const row of rows) {
          if (!seenPhones.has(row.phone)) {
            seenPhones.add(row.phone)
            contacts.push({ phone: row.phone })
          }
        }
        offset += BATCH
        if ((rows as RowDataPacket[]).length < BATCH) break
      }
    }

    if (contacts.length === 0) throw new Error('Aucun contact valide dans les listes sélectionnées')

    // Marquer la campagne sending + MAJ total_recipients
    await pool.execute(
      "UPDATE sms_campaigns SET status = 'sending', total_recipients = ?, updated_at = NOW() WHERE id = ?",
      [contacts.length, campaignId]
    )

    // Insérer les sms_messages en batch de 500 puis enqueue
    const { smsQueue } = await import('../queue/sms.worker')
    const segments = countSegments(campaign.message)
    let totalQueued = 0

    for (let i = 0; i < contacts.length; i += BATCH) {
      const chunk = contacts.slice(i, i + BATCH)

      // INSERT batch
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
      const vals = chunk.flatMap(c => [
        tenantId, campaignId, c.phone,
        campaign.senderId, campaign.message,
        'queued', segments,
      ])
      await pool.execute(
        `INSERT INTO sms_messages
           (tenant_id, campaign_id, phone, sender_id, body, status, segments)
         VALUES ${placeholders}`,
        vals
      )

      // Récupérer les IDs des messages insérés
      const [msgRows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, phone FROM sms_messages
         WHERE campaign_id = ? AND status = 'queued'
         ORDER BY id DESC LIMIT ?`,
        [campaignId, chunk.length]
      )

      // Enqueue chaque message dans Bull
      const jobs = (msgRows as RowDataPacket[]).map(row => ({
        data: {
          messageId:  row.id as number,
          phone:      row.phone as string,
          senderId:   campaign.senderId,
          body:       campaign.message,
          tenantId,
          campaignId,
        },
      }))
      await smsQueue.addBulk(jobs)
      totalQueued += jobs.length
    }

    return { queued: totalQueued }
  },

  // ── Messages ────────────────────────────────────────────────

  async getMessages(
    tenantId: number,
    opts: { campaignId?: number; page?: number; limit?: number; status?: string } = {}
  ): Promise<{ messages: SmsMessage[]; total: number }> {
    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE tenant_id = ?'
    const params: (string | number | null)[] = [tenantId]

    if (opts.campaignId) { where += ' AND campaign_id = ?'; params.push(opts.campaignId) }
    if (opts.status)     { where += ' AND status = ?';      params.push(opts.status) }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM sms_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_messages ${where}`, params
    )

    return { messages: rows as SmsMessage[], total: Number(total) }
  },

  /**
   * Traite un DLR reçu d'AfricasTalking
   * Distinction 'sent' vs 'delivered' vs 'undelivered' — ne jamais confondre
   */
  async handleDlr(
    atMessageId: string,
    atStatus: string,
    failureReason?: string
  ): Promise<void> {
    // Trouver le message par son ID AfricasTalking
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, campaign_id, tenant_id, status FROM sms_messages WHERE at_message_id = ?",
      [atMessageId]
    )
    if (rows.length === 0) return // DLR pour un message inconnu → ignorer

    const msg = rows[0]

    // Ne traiter que les messages en statut 'sent' (éviter double traitement)
    if (msg.status !== 'sent') return

    if (atStatus === 'Buffered') return // encore en transit — pas de changement

    const isDelivered = atStatus === 'Success'
    const newStatus   = isDelivered ? 'delivered' : 'undelivered'

    // MAJ message — deux requêtes séparées pour éviter SQL dynamique
    if (isDelivered) {
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'delivered', delivered_at = NOW(), failure_reason = NULL, updated_at = NOW()
         WHERE id = ?`,
        [msg.id]
      )
    } else {
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'undelivered', failure_reason = ?, updated_at = NOW()
         WHERE id = ?`,
        [failureReason ?? atStatus, msg.id]
      )
    }

    if (!msg.campaign_id) return

    // MAJ compteurs campagne (atomique)
    if (newStatus === 'delivered') {
      await pool.execute(
        'UPDATE sms_campaigns SET total_delivered = total_delivered + 1, updated_at = NOW() WHERE id = ?',
        [msg.campaign_id]
      )
    } else if (newStatus === 'undelivered') {
      await pool.execute(
        'UPDATE sms_campaigns SET total_undelivered = total_undelivered + 1, updated_at = NOW() WHERE id = ?',
        [msg.campaign_id]
      )
    }
  },

  // ── Templates ────────────────────────────────────────────────

  async getTemplates(tenantId: number): Promise<SmsTemplate[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_templates WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      [tenantId]
    )
    return rows as SmsTemplate[]
  },

  async createTemplate(
    data: { name: string; body: string },
    tenantId: number,
    userId: number
  ): Promise<SmsTemplate> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO sms_templates (tenant_id, created_by, name, body) VALUES (?, ?, ?, ?)',
      [tenantId, userId, data.name, data.body]
    )
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_templates WHERE id = ?', [result.insertId]
    )
    return rows[0] as SmsTemplate
  },

  async updateTemplate(
    id: number,
    data: Partial<{ name: string; body: string }>,
    tenantId: number
  ): Promise<SmsTemplate> {
    const sets: string[] = ['updated_at = NOW()']
    const params: (string | number | null)[] = []
    if (data.name) { sets.push('name = ?'); params.push(data.name) }
    if (data.body) { sets.push('body = ?'); params.push(data.body) }
    params.push(id, tenantId)

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE sms_templates SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      params
    )
    if (result.affectedRows === 0) throw new Error('Template introuvable')

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_templates WHERE id = ?', [id]
    )
    return rows[0] as SmsTemplate
  },

  async deleteTemplate(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_templates SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Template introuvable')
  },

  // ── Sender IDs ───────────────────────────────────────────────

  async getSenderIds(tenantId: number): Promise<SmsSenderId[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_sender_ids WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    )
    return rows as SmsSenderId[]
  },

  async createSenderId(
    senderId: string,
    tenantId: number,
    userId: number,
    apiBase?: string
  ): Promise<SmsSenderId> {
    if (!SENDER_ID_RE.test(senderId)) {
      throw new Error('Sender ID invalide — 1 à 11 caractères alphanumériques (A-Z, a-z, 0-9) uniquement')
    }

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_sender_ids WHERE tenant_id = ? AND sender_id = ?',
      [tenantId, senderId]
    )
    if (existing.length > 0) throw new Error(`Le Sender ID "${senderId}" existe déjà`)

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO sms_sender_ids (tenant_id, sender_id, created_by) VALUES (?, ?, ?)',
      [tenantId, senderId, userId]
    )
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_sender_ids WHERE id = ?', [result.insertId]
    )
    const record = rows[0] as SmsSenderId

    // Notification email asynchrone — non bloquante
    const [[tenant]] = await pool.execute<RowDataPacket[]>(
      'SELECT name FROM tenants WHERE id = ?', [tenantId]
    )
    const [[creator]] = await pool.execute<RowDataPacket[]>(
      'SELECT email, first_name FROM users WHERE id = ?', [userId]
    )
    const tenantName  = (tenant as RowDataPacket)?.name   as string ?? `Tenant #${tenantId}`
    const creatorName = (creator as RowDataPacket)?.email as string ?? `User #${userId}`

    // record est en réalité RowDataPacket snake_case depuis MySQL
    const rawRecord = record as unknown as RowDataPacket
    sendSenderIdNotification({
      senderIdId:    rawRecord['id'] as number,
      senderIdValue: rawRecord['sender_id'] as string,
      tenantName,
      requestedBy: creatorName,
      apiBase: apiBase ?? `http://localhost:${process.env.PORT ?? 5000}`,
    }).catch(() => { /* silencieux */ })

    return record
  },

  // Appelé via le lien magique dans l'email (pas d'auth requise)
  async handleSenderIdAction(token: string): Promise<{ action: string; senderId: string }> {
    let payload: { senderIdId: number; act: 'approve' | 'reject' }
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as typeof payload
    } catch {
      throw new Error('Lien expiré ou invalide')
    }

    const { senderIdId, act } = payload
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_sender_ids WHERE id = ?', [senderIdId]
    )
    if (rows.length === 0) throw new Error('Sender ID introuvable')
    const record = rows[0] as RowDataPacket

    if (record['status'] !== 'pending_approval') {
      return { action: 'already_done', senderId: record['sender_id'] as string }
    }

    if (act === 'approve') {
      await pool.execute(
        "UPDATE sms_sender_ids SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = ?",
        [senderIdId]
      )
    } else {
      await pool.execute(
        "UPDATE sms_sender_ids SET status = 'rejected', updated_at = NOW() WHERE id = ?",
        [senderIdId]
      )
    }

    return { action: act, senderId: record['sender_id'] as string }
  },

  async approveSenderId(id: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_sender_ids SET status = 'approved', updated_at = NOW() WHERE id = ?",
      [id]
    )
    if (result.affectedRows === 0) throw new Error('Sender ID introuvable')
  },

  async rejectSenderId(id: number): Promise<void> {
    await pool.execute(
      "UPDATE sms_sender_ids SET status = 'rejected', updated_at = NOW() WHERE id = ?",
      [id]
    )
  },

  async deleteSenderId(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM sms_sender_ids WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Sender ID introuvable')
  },

  // ── OTP ──────────────────────────────────────────────────────

  /**
   * Envoie un OTP par SMS
   * - Rate limit : 3 tentatives / 10 min / numéro
   * - Code généré avec crypto.randomInt (cryptographiquement sûr)
   * - Stocké hashé (sha256), jamais en clair
   * - TTL : 5 minutes
   */
  async sendOtp(
    rawPhone: string,
    tenantId: number,
    senderId?: string
  ): Promise<{ expiresAt: Date }> {
    const phone = normalizePhone(rawPhone, 'CD')
    if (!phone) throw new Error(`Numéro invalide : ${rawPhone}`)

    // Rate limit DB : 3 OTP / 10 min / numéro
    const [[{ cnt }]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt FROM sms_otp
       WHERE tenant_id = ? AND phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [tenantId, phone]
    )
    if (Number(cnt) >= 3) {
      throw new Error('Trop de tentatives OTP. Réessayez dans 10 minutes.')
    }

    // Expirer les OTP précédents de ce numéro
    await pool.execute(
      "UPDATE sms_otp SET status = 'expired' WHERE tenant_id = ? AND phone = ? AND status = 'pending'",
      [tenantId, phone]
    )

    // Générer le code (6 chiffres, cryptographiquement sûr)
    const code    = crypto.randomInt(100_000, 999_999).toString()
    const hash    = hashOtpCode(code, tenantId, phone)
    const expires = new Date(Date.now() + 5 * 60 * 1000)

    await pool.execute(
      'INSERT INTO sms_otp (tenant_id, phone, code_hash, expires_at) VALUES (?, ?, ?, ?)',
      [tenantId, phone, hash, expires]
    )

    // Envoyer via AfricasTalking
    const { africastalkingService } = await import('./africastalking.service')
    await africastalkingService.sendSms({
      to: phone,
      message: `Votre code de vérification est : ${code}. Valide 5 minutes.`,
      from: senderId,
    })

    return { expiresAt: expires }
  },

  async verifyOtp(
    rawPhone: string,
    code: string,
    tenantId: number
  ): Promise<boolean> {
    const phone = normalizePhone(rawPhone, 'CD')
    if (!phone) return false

    const hash = hashOtpCode(code, tenantId, phone)

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM sms_otp
       WHERE tenant_id = ? AND phone = ? AND code_hash = ?
         AND status = 'pending' AND expires_at > NOW()`,
      [tenantId, phone, hash]
    )
    if (rows.length === 0) return false

    // Brûler l'OTP après usage
    await pool.execute(
      "UPDATE sms_otp SET status = 'used', used_at = NOW() WHERE id = ?",
      [rows[0].id]
    )
    return true
  },

  // ── Messages Programmés ──────────────────────────────────────

  async getScheduled(
    tenantId: number,
    opts: { status?: string; page?: number; limit?: number } = {}
  ): Promise<{ items: SmsScheduled[]; total: number }> {
    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE tenant_id = ? AND deleted_at IS NULL'
    const params: (string | number | null)[] = [tenantId]
    if (opts.status) { where += ' AND status = ?'; params.push(opts.status) }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM sms_scheduled ${where} ORDER BY scheduled_at ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_scheduled ${where}`, params
    )
    return { items: rows as SmsScheduled[], total: Number(total) }
  },

  async createScheduled(
    data: {
      titre: string
      message: string
      senderId: string
      listId?: number
      scheduledAt: string  // ISO string UTC
      timezone?: string
    },
    tenantId: number,
    userId: number
  ): Promise<SmsScheduled> {
    if (!SENDER_ID_RE.test(data.senderId)) {
      throw new Error('Sender ID invalide')
    }

    const scheduledAt = new Date(data.scheduledAt)
    const minAt = new Date(Date.now() + 5 * 60 * 1000) // minimum 5 min dans le futur
    if (scheduledAt <= minAt) {
      throw new Error('L\'heure d\'envoi doit être dans au moins 5 minutes')
    }

    // Compter les destinataires si une liste est fournie
    let recipientCount = 0
    if (data.listId) {
      const [[{ cnt }]] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as cnt FROM sms_list_contacts WHERE list_id = ? AND opted_out = 0',
        [data.listId]
      )
      recipientCount = Number(cnt)
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sms_scheduled
         (tenant_id, created_by, titre, message, sender_id, list_id, recipient_count, scheduled_at, timezone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, data.titre, data.message, data.senderId,
        data.listId ?? null, recipientCount, scheduledAt, data.timezone ?? 'Africa/Kinshasa']
    )

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_scheduled WHERE id = ?', [result.insertId]
    )
    return rows[0] as SmsScheduled
  },

  async cancelScheduled(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE sms_scheduled SET status = 'cancelled', updated_at = NOW()
       WHERE id = ? AND tenant_id = ? AND status = 'pending' AND deleted_at IS NULL`,
      [id, tenantId]
    )
    if (result.affectedRows === 0) {
      throw new Error('Message programmé introuvable ou ne peut plus être annulé')
    }
  },

  /**
   * Appelé par le cron worker toutes les 60s
   * UPDATE atomique pour éviter le double dispatch (race condition multi-instance)
   */
  async dispatchDueScheduled(): Promise<void> {
    const conn = await pool.getConnection()
    let dueIds: number[] = []

    try {
      await conn.beginTransaction()

      // Verrouiller les messages dus (FOR UPDATE = verrou exclusif)
      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT id FROM sms_scheduled
         WHERE status = 'pending'
           AND scheduled_at <= UTC_TIMESTAMP()
           AND deleted_at IS NULL
         LIMIT 10
         FOR UPDATE`
      )

      dueIds = (rows as RowDataPacket[]).map(r => r.id as number)
      if (dueIds.length === 0) {
        await conn.rollback()
        return
      }

      const placeholders = dueIds.map(() => '?').join(',')
      await conn.execute(
        `UPDATE sms_scheduled SET status = 'processing', updated_at = NOW()
         WHERE id IN (${placeholders})`,
        dueIds
      )

      await conn.commit()
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }

    // Traiter chaque message programmé verrouillé
    const [scheduledRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM sms_scheduled WHERE id IN (${dueIds.map(() => '?').join(',')})`,
      dueIds
    )

    for (const item of scheduledRows as RowDataPacket[]) {
      try {
        await smsService._dispatchOneScheduled(item)
      } catch (err) {
        await pool.execute(
          "UPDATE sms_scheduled SET status = 'failed', updated_at = NOW() WHERE id = ?",
          [item.id]
        )
      }
    }
  },

  // Reçoit un RowDataPacket directement (snake_case depuis MySQL)
  async _dispatchOneScheduled(item: RowDataPacket): Promise<void> {
    if (!item['list_id']) {
      await pool.execute(
        "UPDATE sms_scheduled SET status = 'dispatched', dispatched_at = NOW() WHERE id = ?",
        [item['id']]
      )
      return
    }

    // Créer une campagne automatique pour ce message programmé
    const [campResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sms_campaigns
         (tenant_id, created_by, name, message, sender_id, status)
       VALUES (?, ?, ?, ?, ?, 'sending')`,
      [item['tenant_id'], item['created_by'], item['titre'], item['message'], item['sender_id']]
    )
    const campaignId = campResult.insertId

    await pool.execute(
      'INSERT INTO sms_campaign_lists (campaign_id, list_id) VALUES (?, ?)',
      [campaignId, item['list_id']]
    )

    await pool.execute(
      "UPDATE sms_scheduled SET campaign_id = ?, status = 'dispatched', dispatched_at = NOW() WHERE id = ?",
      [campaignId, item['id']]
    )

    // Envoyer la campagne
    await smsService.sendCampaign(campaignId, item['tenant_id'] as number)
  },

  // ── Listes de contacts SMS ───────────────────────────────────

  async getContactLists(tenantId: number): Promise<SmsContactList[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, name, description, count AS contact_count,
              created_by, created_at, updated_at, deleted_at
       FROM sms_contact_lists
       WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY name ASC`,
      [tenantId]
    )
    return rows as SmsContactList[]
  },

  async createContactList(
    data: { name: string; description?: string },
    tenantId: number,
    userId: number
  ): Promise<SmsContactList> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO sms_contact_lists (tenant_id, name, description, created_by) VALUES (?, ?, ?, ?)',
      [tenantId, data.name, data.description ?? null, userId]
    )
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, name, description, count AS contact_count,
              created_by, created_at, updated_at, deleted_at
       FROM sms_contact_lists WHERE id = ?`,
      [result.insertId]
    )
    return rows[0] as SmsContactList
  },

  async deleteContactList(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_contact_lists SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Liste introuvable')
  },

  /**
   * Ajoute des contacts à une liste — normalise les numéros avant stockage
   * @returns { added, invalid } — les numéros invalides sont retournés pour info
   */
  async addContactsToList(
    listId: number,
    contacts: Array<{ phone: string; firstName?: string; lastName?: string }>,
    tenantId: number,
    defaultIso = 'CD'
  ): Promise<{ added: number; invalid: string[] }> {
    // Vérifier que la liste appartient au tenant
    const [listRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_contact_lists WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [listId, tenantId]
    )
    if (listRows.length === 0) throw new Error('Liste introuvable')

    const valid: Array<{ phone: string; firstName: string | null; lastName: string | null }> = []
    const invalid: string[] = []

    for (const c of contacts) {
      const normalized = normalizePhone(c.phone, defaultIso)
      if (!normalized) { invalid.push(c.phone); continue }
      valid.push({ phone: normalized, firstName: c.firstName ?? null, lastName: c.lastName ?? null })
    }

    if (valid.length === 0) return { added: 0, invalid }

    // INSERT en batch de 500, IGNORE les doublons (UNIQUE KEY list+phone)
    const BATCH = 500
    let added = 0

    for (let i = 0; i < valid.length; i += BATCH) {
      const chunk = valid.slice(i, i + BATCH)
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ')
      const vals = chunk.flatMap(c => [listId, tenantId, c.phone, c.firstName, c.lastName])

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT IGNORE INTO sms_list_contacts (list_id, tenant_id, phone, first_name, last_name)
         VALUES ${placeholders}`,
        vals
      )
      added += result.affectedRows
    }

    // MAJ compteur de la liste
    await pool.execute(
      'UPDATE sms_contact_lists SET count = count + ?, updated_at = NOW() WHERE id = ?',
      [added, listId]
    )

    return { added, invalid }
  },

  async getContactsInList(
    listId: number,
    tenantId: number,
    opts: { page?: number; limit?: number } = {}
  ): Promise<{ contacts: SmsListContact[]; total: number }> {
    // Vérifier appartenance tenant
    const [listRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_contact_lists WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [listId, tenantId]
    )
    if (listRows.length === 0) throw new Error('Liste introuvable')

    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(500, opts.limit ?? 50)
    const offset = (page - 1) * limit

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_list_contacts WHERE list_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [listId, limit, offset]
    )
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM sms_list_contacts WHERE list_id = ?', [listId]
    )
    return { contacts: rows as SmsListContact[], total: Number(total) }
  },

  // Opt-out d'un contact (réponse STOP reçue via SMPP MO ou déclaration manuelle)
  // ── Import depuis le CRM global ──────────────────────────────

  async getCrmContacts(
    tenantId: number,
    opts: { search?: string; page?: number; limit?: number } = {}
  ): Promise<{ contacts: Array<{ id: number; first_name: string; last_name: string; email: string | null; phone: string }>; total: number }> {
    const page  = Math.max(1, opts.page  ?? 1)
    const limit = Math.min(200, opts.limit ?? 50)
    const offset = (page - 1) * limit

    let where = 'WHERE tenant_id = ? AND phone IS NOT NULL AND phone != "" AND deleted_at IS NULL'
    const params: (string | number)[] = [tenantId]

    if (opts.search?.trim()) {
      where += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR email LIKE ?)'
      const like = `%${opts.search.trim()}%`
      params.push(like, like, like, like)
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, email, phone FROM contacts ${where}
       ORDER BY first_name ASC, last_name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM contacts ${where}`, params
    )

    return {
      contacts: rows as Array<{ id: number; first_name: string; last_name: string; email: string | null; phone: string }>,
      total: Number(total),
    }
  },

  async importFromCrm(
    listId: number,
    contactIds: number[],
    tenantId: number
  ): Promise<{ added: number; skipped: number }> {
    const [listRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_contact_lists WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [listId, tenantId]
    )
    if (listRows.length === 0) throw new Error('Liste introuvable')
    if (contactIds.length === 0) return { added: 0, skipped: 0 }

    const placeholders = contactIds.map(() => '?').join(',')
    const [crmRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, phone FROM contacts
       WHERE id IN (${placeholders}) AND tenant_id = ? AND phone IS NOT NULL AND deleted_at IS NULL`,
      [...contactIds, tenantId]
    )
    if (crmRows.length === 0) return { added: 0, skipped: contactIds.length }

    const BATCH = 500
    let added = 0
    const skipped = contactIds.length - (crmRows as RowDataPacket[]).length

    for (let i = 0; i < (crmRows as RowDataPacket[]).length; i += BATCH) {
      const chunk = (crmRows as RowDataPacket[]).slice(i, i + BATCH)
      const vals = chunk.flatMap(c => [
        listId, tenantId,
        normalizePhone(c.phone as string) ?? (c.phone as string),
        (c.first_name as string) || null,
        (c.last_name  as string) || null,
      ])
      const ph = chunk.map(() => '(?, ?, ?, ?, ?)').join(', ')

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT IGNORE INTO sms_list_contacts (list_id, tenant_id, phone, first_name, last_name)
         VALUES ${ph}`,
        vals
      )
      added += result.affectedRows
    }

    if (added > 0) {
      await pool.execute(
        'UPDATE sms_contact_lists SET count = count + ?, updated_at = NOW() WHERE id = ?',
        [added, listId]
      )
    }

    return { added, skipped }
  },

  async optOutContact(phone: string, tenantId: number): Promise<void> {
    const normalized = normalizePhone(phone, 'CD') ?? phone
    await pool.execute(
      `UPDATE sms_list_contacts
       SET opted_out = 1, opted_out_at = NOW()
       WHERE phone = ? AND tenant_id = ? AND opted_out = 0`,
      [normalized, tenantId]
    )
  },

  // ── Réducteur d'URL ──────────────────────────────────────────

  async getShortLinks(tenantId: number): Promise<SmsShortLink[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_short_links WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
      [tenantId]
    )
    return rows as SmsShortLink[]
  },

  async createShortLink(
    data: { url: string; title?: string; expiresInDays?: number },
    tenantId: number,
    userId: number
  ): Promise<SmsShortLink> {
    // Valider l'URL (anti open redirect)
    let parsed: URL
    try {
      parsed = new URL(data.url)
    } catch {
      throw new Error('URL invalide')
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Seules les URLs http et https sont acceptées')
    }

    const code      = await generateUniqueCode()
    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sms_short_links (tenant_id, code, original_url, title, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, code, data.url, data.title ?? null, expiresAt, userId]
    )
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_short_links WHERE id = ?', [result.insertId]
    )
    return rows[0] as SmsShortLink
  },

  async deleteShortLink(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_short_links SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL",
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Lien introuvable')
  },

  /**
   * Résout un code court et log le clic — utilisé par l'endpoint de redirect public
   * L'IP est hashée (sha256 + sel quotidien) — jamais l'IP brute stockée
   */
  async resolveAndLogClick(
    code: string,
    rawIp: string
  ): Promise<string | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, original_url, expires_at FROM sms_short_links
       WHERE code = ? AND deleted_at IS NULL`,
      [code]
    )
    if (rows.length === 0) return null

    const link = rows[0]

    // Lien expiré
    if (link.expires_at && new Date(link.expires_at) < new Date()) return null

    // Hash IP avec sel quotidien (pas de stockage IP brute — vie privée)
    const dailySalt = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const ipHash = crypto.createHash('sha256').update(`${rawIp}:${dailySalt}`).digest('hex')

    await Promise.all([
      pool.execute('UPDATE sms_short_links SET clicks = clicks + 1 WHERE id = ?', [link.id]),
      pool.execute(
        'INSERT INTO sms_link_clicks (link_id, ip_hash) VALUES (?, ?)',
        [link.id, ipHash]
      ),
    ])

    return link.original_url as string
  },

  async getShortLinkStats(
    id: number,
    tenantId: number
  ): Promise<{ link: SmsShortLink; clicksByDay: Array<{ date: string; count: number }> }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sms_short_links WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    )
    if (rows.length === 0) throw new Error('Lien introuvable')

    const [clickRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(clicked_at) as date, COUNT(*) as count
       FROM sms_link_clicks WHERE link_id = ?
       GROUP BY DATE(clicked_at) ORDER BY date DESC LIMIT 30`,
      [id]
    )

    return {
      link: rows[0] as SmsShortLink,
      clicksByDay: clickRows.map(r => ({ date: r.date as string, count: Number(r.count) })),
    }
  },

  // ── Envoi unique (SMS Simple) ─────────────────────────────────

  async sendSingle(params: {
    phone: string
    message: string
    senderId?: string
    tenantId: number
    userId: number
  }): Promise<{ messageId: number; atMessageId: string; status: string }> {
    const { phone, message, tenantId } = params
    const senderId = params.senderId?.trim() ?? ''

    // Valider le sender ID uniquement s'il est fourni
    if (senderId) {
      if (!SENDER_ID_RE.test(senderId)) {
        throw new Error('Sender ID invalide — 1 à 11 caractères alphanumériques')
      }

      const [senderRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM sms_sender_ids WHERE tenant_id = ? AND sender_id = ? AND status = 'approved'",
        [tenantId, senderId]
      )
      if (senderRows.length === 0) {
        throw new Error(`Sender ID "${senderId}" non approuvé pour ce compte`)
      }
    }

    const normalized = normalizePhone(phone) ?? phone.trim()
    const segments = countSegments(message)

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sms_messages (tenant_id, campaign_id, phone, sender_id, body, status, segments)
       VALUES (?, NULL, ?, ?, ?, 'queued', ?)`,
      [tenantId, normalized, senderId, message, segments]
    )
    const messageId = result.insertId

    const { africastalkingService } = await import('./africastalking.service')
    let atMessageId = ''
    let atStatus: 'sent' | 'failed' = 'failed'

    console.log('[SMS SINGLE] ▶ Envoi AT', { phone: normalized, senderId: senderId || '(aucun)', messageId })

    try {
      const recipients = await africastalkingService.sendSms({
        to: normalized,
        message,
        ...(senderId ? { from: senderId } : {}),
      })

      console.log('[SMS SINGLE] ◀ Réponse AT:', JSON.stringify(recipients, null, 2))

      const recipient = recipients[0]
      if (recipient) {
        atMessageId = recipient.messageId
        // AT retourne 100 ou 101 pour succès selon le type de compte
        atStatus = recipient.status === 'Success' ? 'sent' : 'failed'
        if (atStatus === 'failed') {
          console.warn(
            `[SMS SINGLE] ❌ AT rejet — code: ${recipient.statusCode}, status: "${recipient.status}", numéro: ${recipient.number}`
          )
        } else {
          console.log(`[SMS SINGLE] ✅ AT accepté — messageId: ${atMessageId}, coût: ${recipient.cost}`)
        }
      } else {
        console.warn('[SMS SINGLE] ⚠ AT a retourné un tableau vide')
      }

      await pool.execute(
        `UPDATE sms_messages
           SET status = ?, at_message_id = ?, at_status_code = ?,
               sent_at = IF(? = 'sent', NOW(), NULL), updated_at = NOW()
         WHERE id = ?`,
        [atStatus, atMessageId || null, recipient?.statusCode ?? null, atStatus, messageId]
      )

      return { messageId, atMessageId, status: atStatus }
    } catch (err) {
      console.error('[SMS SINGLE] 💥 Exception AT:', err)
      await pool.execute(
        "UPDATE sms_messages SET status = 'failed', updated_at = NOW() WHERE id = ?",
        [messageId]
      )
      throw err
    }
  },

  // ── Analytics ────────────────────────────────────────────────

  async getOverviewStats(tenantId: number): Promise<{
    totalSent: number
    totalDelivered: number
    totalFailed: number
    deliveryRate: number
    activeCampaigns: number
  }> {
    const [[stats]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         SUM(total_sent)        as totalSent,
         SUM(total_delivered)   as totalDelivered,
         SUM(total_failed)      as totalFailed,
         SUM(CASE WHEN status IN ('sending','queued') THEN 1 ELSE 0 END) as activeCampaigns
       FROM sms_campaigns
       WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )

    const sent      = Number(stats.totalSent)      || 0
    const delivered = Number(stats.totalDelivered) || 0
    const failed    = Number(stats.totalFailed)    || 0

    return {
      totalSent:       sent,
      totalDelivered:  delivered,
      totalFailed:     failed,
      deliveryRate:    sent > 0 ? Math.round((delivered / sent) * 100 * 10) / 10 : 0,
      activeCampaigns: Number(stats.activeCampaigns) || 0,
    }
  },
}
