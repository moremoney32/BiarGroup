import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { pool } from '../db/config'
import { normalizePhone } from '../helpers/phone.helper'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import type {
  SmsCampaign, SmsMessage, SmsTemplate, SmsSenderId,
  SmsScheduled, SmsContactList, SmsListContact, SmsShortLink,
  SmsApiKey,
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
        <div style="display:flex;gap:24px;margin-top:4px">
          <a href="${approveUrl}"
            style="flex:1;display:block;background:#16A34A;color:#fff;text-align:center;padding:14px 12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
            ✅ Approuver
          </a>
          <a href="${rejectUrl}"
            style="flex:1;display:block;background:#DC2626;color:#fff;text-align:center;padding:14px 12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">
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

// ── Mapping MCC/MNC → Opérateur ──────────────────────────────

function resolveOperator(mccMnc: string): string {
  const map: Record<string, string> = {
    '63001': 'Vodacom', '630001': 'Vodacom',
    '63005': 'Airtel',  '630005': 'Airtel',
    '63010': 'Orange',  '630010': 'Orange',
    '63086': 'Africell','630086': 'Africell',
    '62401': 'MTN',     '624001': 'MTN',
    '62402': 'Vodafone','624002': 'Vodafone',
    '20801': 'Orange FR','208001': 'Orange FR',
    '20810': 'SFR',     '208010': 'SFR',
    '20820': 'Bouygues','208020': 'Bouygues',
  }
  return map[mccMnc] ?? `Opérateur (${mccMnc})`
}

// Pays depuis préfixe E.164
function resolveCountry(phone: string): string {
  if (phone.startsWith('+243') || phone.startsWith('243')) return 'RD Congo'
  if (phone.startsWith('+242') || phone.startsWith('242')) return 'Congo-Brazzaville'
  if (phone.startsWith('+244') || phone.startsWith('244')) return 'Angola'
  if (phone.startsWith('+237') || phone.startsWith('237')) return 'Cameroun'
  if (phone.startsWith('+33')  || phone.startsWith('33'))  return 'France'
  if (phone.startsWith('+32')  || phone.startsWith('32'))  return 'Belgique'
  if (phone.startsWith('+234') || phone.startsWith('234')) return 'Nigeria'
  if (phone.startsWith('+27')  || phone.startsWith('27'))  return 'Afrique du Sud'
  return 'Autre'
}

// ── Helpers internes ──────────────────────────────────────────

// Nombre de segments SMS (GSM-7 = 160 chars, Unicode = 70 chars)
function countSegments(text: string): number {
  // eslint-disable-next-line no-control-regex
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
    opts: { page?: number; limit?: number; status?: string; campaignType?: string; from?: string; to?: string } = {}
  ): Promise<{ campaigns: SmsCampaign[]; total: number }> {
    const page  = Math.max(1, opts.page  ?? 1)
    const limit = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE c.tenant_id = ? AND c.deleted_at IS NULL'
    const params: (string | number | null)[] = [tenantId]

    if (opts.status)       { where += ' AND c.status = ?';               params.push(opts.status) }
    if (opts.campaignType) { where += ' AND c.campaign_type = ?';        params.push(opts.campaignType) }
    if (opts.from)         { where += ' AND c.created_at >= ?';          params.push(opts.from) }
    if (opts.to)           { where += ' AND c.created_at <= ?';          params.push(opts.to) }

    // pool.query (text protocol) évite le bug mysql2 avec LIMIT/OFFSET en prepared statements
    // total_clicks : clics réels des liens courts associés à la campagne (endpoint /sms/r/:code)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*,
              (SELECT COALESCE(SUM(l.clicks), 0) FROM sms_short_links l WHERE l.campaign_id = c.id) AS total_clicks,
              (SELECT COUNT(DISTINCT k.ip_hash) FROM sms_link_clicks k
               JOIN sms_short_links l2 ON l2.id = k.link_id
               WHERE l2.campaign_id = c.id) AS total_unique_clicks,
              (SELECT COALESCE(SUM(m.cost), 0) FROM sms_messages m
               WHERE m.campaign_id = c.id AND m.deleted_at IS NULL) AS total_cost,
              (SELECT MAX(m.cost_currency) FROM sms_messages m
               WHERE m.campaign_id = c.id AND m.cost_currency IS NOT NULL AND m.deleted_at IS NULL) AS cost_currency
       FROM sms_campaigns c ${where} ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_campaigns c ${where}`,
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
    data: { name: string; message: string; senderId: string; listIds: number[]; scheduledAt?: string; campaignType?: string },
    tenantId: number,
    userId: number
  ): Promise<SmsCampaign> {
    if (data.senderId) {
      if (!SENDER_ID_RE.test(data.senderId)) {
        throw new Error('Sender ID invalide — 1 à 11 caractères alphanumériques uniquement')
      }
      const [senderRows] = await pool.execute<RowDataPacket[]>(
        "SELECT id FROM sms_sender_ids WHERE tenant_id = ? AND sender_id = ? AND status = 'approved'",
        [tenantId, data.senderId]
      )
      if (senderRows.length === 0) {
        throw new Error(`Sender ID "${data.senderId}" non approuvé pour ce compte`)
      }
    }

    const scheduledAt = data.scheduledAt ?? null

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO sms_campaigns (tenant_id, created_by, name, message, sender_id, campaign_type, status, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenantId, userId, data.name, data.message, data.senderId,
          data.campaignType ?? 'promotional',
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
    // UPDATE atomique — empêche le double envoi si deux requêtes arrivent simultanément
    const [lockResult] = await pool.execute<ResultSetHeader>(
      "UPDATE sms_campaigns SET status = 'sending', updated_at = NOW() WHERE id = ? AND tenant_id = ? AND status IN ('draft', 'scheduled')",
      [campaignId, tenantId]
    )
    if (lockResult.affectedRows === 0) {
      const existing = await smsService.getCampaignById(campaignId, tenantId)
      if (!existing) throw new Error('Campagne introuvable')
      throw new Error('Cette campagne ne peut pas être envoyée dans son état actuel')
    }

    const campaign = await smsService.getCampaignById(campaignId, tenantId)
    if (!campaign) throw new Error('Campagne introuvable')

    // Associe les liens courts présents dans le message à cette campagne (taux de clic par campagne)
    // Deux formats acceptés : /api/v1/sms/r/CODE (ancien) et /r/CODE (raccourci nginx)
    // Un faux positif (ex: reddit.com/r/xxx) est inoffensif : le WHERE code IN ne matchera rien
    const linkCodes = [...campaign.message.matchAll(/\/(?:sms\/)?r\/([A-Za-z0-9_-]{3,30})/g)].map(m => m[1])
    if (linkCodes.length > 0) {
      await pool.query(
        'UPDATE sms_short_links SET campaign_id = ? WHERE tenant_id = ? AND code IN (?)',
        [campaignId, tenantId, linkCodes]
      )
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
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [rows] = await pool.query<RowDataPacket[]>(
          `SELECT phone FROM sms_list_contacts
           WHERE list_id = ? AND opted_out = 0
           LIMIT ${BATCH} OFFSET ${offset}`,
          [listId]
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

    // MAJ total_recipients (status déjà positionné à 'sending' par le lock atomique)
    await pool.execute(
      'UPDATE sms_campaigns SET total_recipients = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?',
      [contacts.length, campaignId, tenantId]
    )

    // Insérer les sms_messages en batch de 500 puis enqueue
    const { smsQueue } = await import('../queue/sms.worker')
    const segments = countSegments(campaign.message)
    // sender_id vient en snake_case depuis MySQL — le cast SmsCampaign ne transforme pas les clés
    const rawCampaign = campaign as unknown as Record<string, unknown>
    const senderIdVal = (rawCampaign.sender_id ?? rawCampaign.senderId ?? '') as string
    let totalQueued = 0

    for (let i = 0; i < contacts.length; i += BATCH) {
      const chunk = contacts.slice(i, i + BATCH)

      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
      const vals = chunk.flatMap(c => [
        tenantId, campaignId, c.phone,
        senderIdVal, campaign.message,
        'queued', segments,
      ])
      await pool.execute(
        `INSERT INTO sms_messages
           (tenant_id, campaign_id, phone, sender_id, body, status, segments)
         VALUES ${placeholders}`,
        vals
      )

      // Récupérer les IDs des messages insérés — pool.query évite le bug mysql2 avec LIMIT en bind param
      const [msgRows] = await pool.query<RowDataPacket[]>(
        `SELECT id, phone FROM sms_messages
         WHERE campaign_id = ? AND status = 'queued'
         ORDER BY id DESC LIMIT ${chunk.length}`,
        [campaignId]
      )

      // Enqueue chaque message dans Bull
      const jobs = (msgRows as RowDataPacket[]).map(row => ({
        data: {
          messageId:  row.id as number,
          phone:      row.phone as string,
          senderId:   senderIdVal,
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
    opts: { campaignId?: number; singleOnly?: boolean; page?: number; limit?: number; status?: string } = {}
  ): Promise<{ messages: SmsMessage[]; total: number }> {
    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE tenant_id = ?'
    const params: (string | number | null)[] = [tenantId]

    if (opts.singleOnly)  { where += ' AND campaign_id IS NULL' }
    else if (opts.campaignId) { where += ' AND campaign_id = ?'; params.push(opts.campaignId) }
    if (opts.status)      { where += ' AND status = ?'; params.push(opts.status) }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM sms_messages ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_messages ${where}`, params
    )

    return { messages: rows as SmsMessage[], total: Number(total) }
  },

  /**
   * Traite un DLR reçu d'Infobip
   * Capture : statut, opérateur (mccMnc), code erreur, temps livraison, coût
   */
  async handleDlr(
    infobipMessageId: string,
    statusGroupName: string,
    failureReason?: string,
    extra?: {
      mccMnc?: string
      errorCode?: number
      errorName?: string
      doneAt?: string
      sentAt?: string
      cost?: number
      currency?: string
    }
  ): Promise<void> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, campaign_id, tenant_id, status, sent_at FROM sms_messages WHERE at_message_id = ?",
      [infobipMessageId]
    )
    if (rows.length === 0) {
      console.warn(`[DLR] ⚠ Aucun message trouvé pour at_message_id="${infobipMessageId}"`)
      return
    }

    const msg = rows[0]
    console.log(`[DLR] Message #${msg.id} trouvé — statut actuel="${msg.status}" → nouveau statut Infobip="${statusGroupName}"`)
    if (msg.status !== 'sent') {
      console.warn(`[DLR] ⚠ Ignoré — statut local déjà "${msg.status}" (attendu "sent")`)
      return
    }
    if (statusGroupName === 'PENDING' || statusGroupName === 'SENT') return

    const isDelivered = statusGroupName === 'DELIVERED'
    const newStatus   = isDelivered ? 'delivered' : 'undelivered'

    // Calcul temps de livraison en ms si on a les deux timestamps
    let deliveryTimeMs: number | null = null
    if (isDelivered && extra?.doneAt && (extra?.sentAt || msg.sent_at)) {
      const doneTs = new Date(extra.doneAt).getTime()
      const sentTs = extra.sentAt ? new Date(extra.sentAt).getTime() : new Date(msg.sent_at).getTime()
      if (!isNaN(doneTs) && !isNaN(sentTs) && doneTs > sentTs) {
        deliveryTimeMs = doneTs - sentTs
      }
    }

    // Mapping mccMnc → nom opérateur lisible
    const operatorName = extra?.mccMnc ? resolveOperator(extra.mccMnc) : null

    if (isDelivered) {
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'delivered', delivered_at = NOW(), failure_reason = NULL,
             operator = COALESCE(?, operator),
             error_code = '0',
             delivery_time_ms = ?,
             cost = COALESCE(?, cost),
             cost_currency = COALESCE(?, cost_currency),
             updated_at = NOW()
         WHERE id = ?`,
        [operatorName, deliveryTimeMs, extra?.cost ?? null, extra?.currency ?? null, msg.id]
      )
    } else {
      await pool.execute(
        `UPDATE sms_messages
         SET status = 'undelivered', failure_reason = ?,
             operator = COALESCE(?, operator),
             error_code = ?,
             cost = COALESCE(?, cost),
             cost_currency = COALESCE(?, cost_currency),
             updated_at = NOW()
         WHERE id = ?`,
        [
          failureReason ?? statusGroupName,
          operatorName,
          extra?.errorCode !== undefined ? String(extra.errorCode) : null,
          extra?.cost ?? null,
          extra?.currency ?? null,
          msg.id,
        ]
      )
    }

    // Débit du coût Infobip réel (fourni dans le DLR via price.pricePerMessage)
    const infobipCost = extra?.cost ?? null
    if (infobipCost && infobipCost > 0) {
      await pool.execute(
        `INSERT INTO sms_transactions (tenant_id, campaign_id, type, amount, currency, sms_count, description)
         VALUES (?, ?, 'debit', ?, ?, 1, ?)`,
        [msg.tenant_id, msg.campaign_id ?? null, infobipCost, extra?.currency ?? null, `SMS ${newStatus}`]
      )
      // Crée la ligne sms_credits si elle n'existe pas encore, puis déduit
      await pool.execute(
        `INSERT INTO sms_credits (tenant_id, balance) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE balance = balance - ?`,
        [msg.tenant_id, -infobipCost, infobipCost]
      )
    }

    if (!msg.campaign_id) return

    if (newStatus === 'delivered') {
      await pool.execute(
        'UPDATE sms_campaigns SET total_delivered = total_delivered + 1, updated_at = NOW() WHERE id = ?',
        [msg.campaign_id]
      )
    } else {
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

    // Envoyer via Infobip
    const { infobipService } = await import('./infobip.service')
    await infobipService.sendSms({
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

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM sms_scheduled ${where} ORDER BY scheduled_at ASC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
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
    opts: { page?: number; limit?: number; search?: string; optedOut?: boolean } = {}
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

    let where = 'WHERE list_id = ?'
    const params: (string | number)[] = [listId]

    if (opts.search?.trim()) {
      where += ' AND (phone LIKE ? OR first_name LIKE ? OR last_name LIKE ?)'
      const like = `%${opts.search.trim()}%`
      params.push(like, like, like)
    }
    if (opts.optedOut !== undefined) {
      where += ' AND opted_out = ?'
      params.push(opts.optedOut ? 1 : 0)
    }

    // msg_sent / msg_delivered : stats réelles par numéro (DLR) pour la colonne Performance
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.*,
              (SELECT COUNT(*) FROM sms_messages m
               WHERE m.phone = c.phone AND m.tenant_id = ? AND m.deleted_at IS NULL
                 AND m.status IN ('sent','delivered','undelivered','failed')) AS msg_sent,
              (SELECT COUNT(*) FROM sms_messages m
               WHERE m.phone = c.phone AND m.tenant_id = ? AND m.deleted_at IS NULL
                 AND m.status = 'delivered') AS msg_delivered
       FROM sms_list_contacts c ${where} ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [tenantId, tenantId, ...params]
    )
    const [[{ total }]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_list_contacts c ${where}`, params
    )
    // Normalise opted_out : MySQL retourne TINYINT (0/1), le type attend boolean
    const contacts = (rows as RowDataPacket[]).map(r => ({
      ...r,
      opted_out: !!r.opted_out,
      msg_sent: Number(r.msg_sent) || 0,
      msg_delivered: Number(r.msg_delivered) || 0,
    })) as unknown as SmsListContact[]
    return { contacts, total: Number(total) }
  },

  // Stats globales contacts du tenant (KPI onglet Contacts de SMS en Masse)
  async getContactsStats(tenantId: number): Promise<{ total: number; active: number; optedOut: number }> {
    const [[row]] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(c.opted_out = 0), 0) AS active,
              COALESCE(SUM(c.opted_out = 1), 0) AS optedOut
       FROM sms_list_contacts c
       JOIN sms_contact_lists l ON l.id = c.list_id
       WHERE l.tenant_id = ? AND l.deleted_at IS NULL`,
      [tenantId]
    )
    return {
      total:    Number(row.total)    || 0,
      active:   Number(row.active)   || 0,
      optedOut: Number(row.optedOut) || 0,
    }
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

  async importContactsCsv(
    listId: number,
    csvContent: string,
    tenantId: number
  ): Promise<{ added: number; invalid: string[]; skipped: number }> {
    const [listRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM sms_contact_lists WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [listId, tenantId]
    )
    if (listRows.length === 0) throw new Error('Liste introuvable')

    // Parse CSV simple — séparateur virgule ou point-virgule
    const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    const contacts: Array<{ phone: string; firstName?: string; lastName?: string }> = []

    for (const raw of lines) {
      const line = raw.trim()
      if (!line) continue
      // Split sur , ou ; en tenant compte des guillemets basiques
      const cols = line.split(/[,;]/).map(c => c.replace(/^["']|["']$/g, '').trim())
      const phone = cols[0] ?? ''
      if (!phone || phone.toLowerCase().startsWith('phone') || phone.toLowerCase().startsWith('tel')) {
        continue // Ligne d'en-tête ou vide
      }
      contacts.push({
        phone,
        firstName: cols[1] || undefined,
        lastName:  cols[2] || undefined,
      })
    }

    if (contacts.length === 0) return { added: 0, invalid: [], skipped: 0 }

    const result = await this.addContactsToList(listId, contacts, tenantId, 'CD')
    return { added: result.added, invalid: result.invalid, skipped: result.invalid.length }
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
    data: { url: string; title?: string; expiresInDays?: number; customCode?: string },
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

    let code: string
    if (data.customCode) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM sms_short_links WHERE code = ?',
        [data.customCode]
      )
      if (existing.length > 0) throw new Error('Ce code personnalisé est déjà utilisé')
      code = data.customCode
    } else {
      code = await generateUniqueCode()
    }
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
    rawIp: string,
    countClick: boolean = true
  ): Promise<{ url: string; title: string | null } | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, original_url, title, expires_at FROM sms_short_links
       WHERE code = ? AND deleted_at IS NULL`,
      [code]
    )
    if (rows.length === 0) return null

    const link = rows[0]

    // Lien expiré
    if (link.expires_at && new Date(link.expires_at) < new Date()) return null

    const result = { url: link.original_url as string, title: (link.title as string | null) ?? null }

    // Résolution seule (GET interstitiel) — le comptage passe par le beacon JS
    if (!countClick) return result

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

    return result
  },

  async getShortLinkStats(
    id: number,
    tenantId: number
  ): Promise<{ total_clicks: number; unique_clicks: number; clicks_by_day: Array<{ date: string; count: number }> }> {
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

    // Uniques : 1 par personne/jour (le hash IP est salé quotidiennement)
    const [[uniqueRow]] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(DISTINCT ip_hash) as uniques FROM sms_link_clicks WHERE link_id = ?',
      [id]
    )

    const link = rows[0] as SmsShortLink
    return {
      total_clicks:  Number(link.clicks),
      unique_clicks: Number(uniqueRow.uniques) || 0,
      clicks_by_day: clickRows.map(r => ({ date: r.date as string, count: Number(r.count) })),
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

    const normalized = normalizePhone(phone)
    if (!normalized) throw new Error('Numéro de téléphone invalide — vérifiez le format E.164 (+243...)')
    const segments = countSegments(message)

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO sms_messages (tenant_id, campaign_id, phone, sender_id, body, status, segments)
       VALUES (?, NULL, ?, ?, ?, 'queued', ?)`,
      [tenantId, normalized, senderId, message, segments]
    )
    const messageId = result.insertId

    const { infobipService } = await import('./infobip.service')
    let providerMessageId = ''
    let sendStatus: 'sent' | 'failed' = 'failed'

    console.log('[SMS SINGLE] ▶ Envoi Infobip', { phone: normalized, senderId: senderId || '(aucun)', messageId })

    try {
      const results = await infobipService.sendSms({
        to: normalized,
        message,
        ...(senderId ? { from: senderId } : {}),
      })

      console.log('[SMS SINGLE] ◀ Réponse Infobip:', JSON.stringify(results, null, 2))

      const result = results[0]
      if (result) {
        providerMessageId = result.messageId
        sendStatus = ['PENDING', 'SENT'].includes(result.status.groupName) ? 'sent' : 'failed'
        if (sendStatus === 'failed') {
          console.warn(`[SMS SINGLE] ❌ Infobip rejet — status: "${result.status.groupName}", desc: "${result.status.description}"`)
        } else {
          console.log(`[SMS SINGLE] ✅ Infobip accepté — messageId: ${providerMessageId}`)
        }
      } else {
        console.warn('[SMS SINGLE] ⚠ Infobip a retourné un tableau vide')
      }

      await pool.execute(
        `UPDATE sms_messages
           SET status = ?, at_message_id = ?,
               sent_at = IF(? = 'sent', NOW(), NULL), updated_at = NOW()
         WHERE id = ?`,
        [sendStatus, providerMessageId || null, sendStatus, messageId]
      )

      return { messageId, atMessageId: providerMessageId, status: sendStatus }
    } catch (err) {
      console.error('[SMS SINGLE] 💥 Exception Infobip:', err)
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
    totalContacts: number
    totalLists: number
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

    const [[contactStats]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as totalLists,
         COALESCE(SUM(count), 0) as totalContacts
       FROM sms_contact_lists
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
      activeCampaigns: Number(stats.activeCampaigns)    || 0,
      totalContacts:   Number(contactStats.totalContacts) || 0,
      totalLists:      Number(contactStats.totalLists)    || 0,
    }
  },

  // ── Clés API ─────────────────────────────────────────────────

  async getApiKeys(tenantId: number): Promise<SmsApiKey[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, created_by, name, key_preview, module,
              is_active, requests_count, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows as SmsApiKey[]
  },

  async createApiKey(
    data: { name: string; module?: string },
    tenantId: number,
    userId: number
  ): Promise<{ key: SmsApiKey; rawKey: string }> {
    // Génère une clé aléatoire robuste : préfixe + 32 bytes hex
    const rawKey     = `bsk_live_${crypto.randomBytes(32).toString('hex')}`
    const keyHash    = crypto.createHash('sha256').update(rawKey).digest('hex')
    const lastFour   = rawKey.slice(-4)
    const keyPreview = `bsk_live_****...****${lastFour}`
    const module     = data.module ?? 'sms'

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO api_keys (tenant_id, created_by, name, key_hash, key_preview, module)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, data.name, keyHash, keyPreview, module]
    )

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, tenant_id, created_by, name, key_preview, module,
              is_active, requests_count, last_used_at, expires_at, created_at
       FROM api_keys WHERE id = ?`,
      [result.insertId]
    )

    return { key: rows[0] as SmsApiKey, rawKey }
  },

  async deleteApiKey(id: number, tenantId: number): Promise<void> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE api_keys SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
      [id, tenantId]
    )
    if (result.affectedRows === 0) throw new Error('Clé API introuvable')
  },

  // ── Analytics KPIs (page d'accueil Analytics SMS) ────────────

  async getAnalyticsKpis(tenantId: number): Promise<{
    totalSms: number
    successRate: number
    uniqueRecipients: number
    totalCost: number
    costCurrency: string | null
    totalClicks: number
    uniqueClicks: number
    clickRate: number
  }> {
    // costCurrency : devise réelle renvoyée par Infobip dans les DLR (un compte = une devise)
    const [[stats]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as totalSms,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status IN ('delivered','sent') THEN 1 ELSE 0 END) as success,
         COUNT(DISTINCT phone) as uniqueRecipients,
         COALESCE(SUM(cost), 0) as totalCost,
         MAX(cost_currency) as costCurrency
       FROM sms_messages
       WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )
    // Clics réels sur les liens courts du tenant (endpoint /sms/r/:code — aucune dépendance Infobip)
    // totalClicks = tous les clics ; uniqueClicks = 1 par personne/lien/jour (ip_hash salé quotidien)
    // Le taux de clic utilise les UNIQUES : 2 clics du même user = 1 seule personne engagée
    const [[clickStats]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(l.clicks), 0) as totalClicks,
         (SELECT COUNT(DISTINCT k.link_id, k.ip_hash)
          FROM sms_link_clicks k
          JOIN sms_short_links l2 ON l2.id = k.link_id
          WHERE l2.tenant_id = ?) as uniqueClicks
       FROM sms_short_links l WHERE l.tenant_id = ?`,
      [tenantId, tenantId]
    )
    const total   = Number(stats.totalSms) || 0
    const success = Number(stats.success) || 0
    const clicks  = Number(clickStats.totalClicks) || 0
    const uniques = Number(clickStats.uniqueClicks) || 0
    return {
      totalSms:         total,
      successRate:      total > 0 ? Math.round((success / total) * 1000) / 10 : 0,
      uniqueRecipients: Number(stats.uniqueRecipients) || 0,
      totalCost:        Math.round(Number(stats.totalCost) * 100) / 100,
      costCurrency:     (stats.costCurrency as string | null) ?? null,
      totalClicks:      clicks,
      uniqueClicks:     uniques,
      clickRate:        success > 0 ? Math.round((uniques / success) * 1000) / 10 : 0,
    }
  },

  // ── Rapports SMS ─────────────────────────────────────────────

  async getRapportsSms(tenantId: number, opts: { period?: string } = {}): Promise<{
    byDayOfWeek: Array<{ day: string; sent: number; delivered: number; failed: number }>
    statusDistribution: { delivered: number; pending: number; failed: number; rejected: number }
    byHour: Array<{ hour: string; count: number }>
    engagementRate: Array<{ day: string; ouverture: number; clic: number; conversion: number }>
    byCountry: Array<{ country: string; count: number }>
    topCampaigns: Array<{ name: string; sent: number; delivered: number; openRate: number | null; clickRate: number | null; revenue: number | null }>
  }> {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    const periodDays = opts.period === '7j' ? 7 : opts.period === '90j' ? 90 : 30

    const [byDayRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         DAYOFWEEK(created_at) as dow,
         SUM(CASE WHEN status IN ('sent','delivered') THEN 1 ELSE 0 END) as sent,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status IN ('undelivered','failed') THEN 1 ELSE 0 END) as failed
       FROM sms_messages
       WHERE tenant_id = ? AND deleted_at IS NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY dow ORDER BY dow`,
      [tenantId, periodDays]
    )

    // MySQL DAYOFWEEK: 1=Sun,2=Mon,...,7=Sat → on réindexe
    const byDayMap: Record<number, { sent: number; delivered: number; failed: number }> = {}
    for (const r of byDayRows as RowDataPacket[]) {
      byDayMap[Number(r.dow)] = { sent: Number(r.sent), delivered: Number(r.delivered), failed: Number(r.failed) }
    }
    const byDayOfWeek = [2,3,4,5,6,7,1].map((dow, i) => ({
      day: days[i],
      sent:      byDayMap[dow]?.sent      ?? 0,
      delivered: byDayMap[dow]?.delivered ?? 0,
      failed:    byDayMap[dow]?.failed    ?? 0,
    }))

    const [[distRow]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status IN ('sent','queued','pending') THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'undelivered' THEN 1 ELSE 0 END) as failed,
         SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as rejected
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )

    const [byHourRows] = await pool.execute<RowDataPacket[]>(
      `SELECT LPAD(HOUR(created_at), 2, '0') as hr, COUNT(*) as cnt
       FROM sms_messages
       WHERE tenant_id = ? AND deleted_at IS NULL AND DATE(created_at) = CURDATE()
       GROUP BY hr ORDER BY hr`,
      [tenantId]
    )
    const hourMap: Record<string, number> = {}
    for (const r of byHourRows as RowDataPacket[]) { hourMap[r.hr as string] = Number(r.cnt) }
    const byHour = Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0')
      return { hour: `${h}h`, count: hourMap[h] ?? 0 }
    })

    // Clic : réel, via les liens courts (le clic passe par notre endpoint /sms/r/:code).
    // Ouverture/conversion : non trackables en SMS standard → 0, jamais inventé (RCS les apportera).
    const [clickRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DAYOFWEEK(k.clicked_at) as dow, COUNT(DISTINCT k.ip_hash) as clicks
       FROM sms_link_clicks k
       JOIN sms_short_links l ON l.id = k.link_id
       WHERE l.tenant_id = ? AND k.clicked_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY dow`,
      [tenantId, periodDays]
    )
    const clickMap: Record<number, number> = {}
    for (const r of clickRows as RowDataPacket[]) { clickMap[Number(r.dow)] = Number(r.clicks) }

    const engagementRate = [2,3,4,5,6,7,1].map((dow, i) => {
      const delivered = byDayMap[dow]?.delivered ?? 0
      const clicks    = clickMap[dow] ?? 0
      return {
        day: days[i],
        ouverture:  0,
        clic:       delivered > 0 ? Math.round((clicks / delivered) * 1000) / 10 : 0,
        conversion: 0,
      }
    })

    // Distribution géographique depuis préfixe téléphone
    const [phoneRows] = await pool.execute<RowDataPacket[]>(
      `SELECT phone FROM sms_messages
       WHERE tenant_id = ? AND deleted_at IS NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LIMIT 5000`,
      [tenantId, periodDays]
    )
    const countryCount: Record<string, number> = {}
    for (const r of phoneRows as RowDataPacket[]) {
      const c = resolveCountry(r.phone as string)
      countryCount[c] = (countryCount[c] ?? 0) + 1
    }
    const byCountry = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([country, count]) => ({ country, count }))

    const [topCampRows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.name, c.total_sent as sent, c.total_delivered as delivered,
              (SELECT COUNT(DISTINCT k.ip_hash) FROM sms_link_clicks k
               JOIN sms_short_links l ON l.id = k.link_id
               WHERE l.campaign_id = c.id) as clicks
       FROM sms_campaigns c
       WHERE c.tenant_id = ? AND c.deleted_at IS NULL AND c.status = 'sent'
       ORDER BY c.total_delivered DESC LIMIT 5`,
      [tenantId]
    )
    // clickRate : réel via liens courts. openRate/revenue : null tant que non trackés (RCS / billing).
    const topCampaigns = (topCampRows as RowDataPacket[]).map(r => {
      const sent   = Number(r.sent) || 0
      const del    = Number(r.delivered) || 0
      const clicks = Number(r.clicks) || 0
      return {
        name:       r.name as string,
        sent,
        delivered:  del,
        openRate:   null,
        clickRate:  del > 0 ? Math.round((clicks / del) * 1000) / 10 : 0,
        revenue:    null,
      }
    })

    return {
      byDayOfWeek,
      statusDistribution: {
        delivered: Number(distRow.delivered) || 0,
        pending:   Number(distRow.pending)   || 0,
        failed:    Number(distRow.failed)    || 0,
        rejected:  Number(distRow.rejected)  || 0,
      },
      byHour,
      engagementRate,
      byCountry,
      topCampaigns,
    }
  },

  // ── Historique SMS ────────────────────────────────────────────

  async getHistoriqueSms(
    tenantId: number,
    opts: { page?: number; limit?: number; status?: string; search?: string; from?: string; to?: string } = {}
  ): Promise<{ messages: RowDataPacket[]; total: number }> {
    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit

    let where = 'WHERE m.tenant_id = ? AND m.deleted_at IS NULL'
    const params: (string | number)[] = [tenantId]

    if (opts.status) { where += ' AND m.status = ?';          params.push(opts.status) }
    if (opts.search) { where += ' AND m.phone LIKE ?';        params.push(`%${opts.search}%`) }
    if (opts.from)   { where += ' AND m.created_at >= ?';     params.push(opts.from) }
    if (opts.to)     { where += ' AND m.created_at <= ?';     params.push(opts.to) }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.phone, m.sender_id, m.body, m.status, m.operator, m.error_code, m.delivery_time_ms,
              m.cost, m.campaign_id, c.name AS campaign_name, m.sent_at, m.delivered_at, m.failure_reason, m.created_at
       FROM sms_messages m
       LEFT JOIN sms_campaigns c ON c.id = m.campaign_id
       ${where}
       ORDER BY m.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    )
    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM sms_messages m ${where}`, params
    )
    return { messages: rows, total: Number(total) }
  },

  // ── Rapport Transactions ──────────────────────────────────────

  async getRapportTransactions(tenantId: number): Promise<{
    totalUsed: number
    thisMonth: number
    today: number
    currency: string | null
    transactions: RowDataPacket[]
  }> {
    const [[agg]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(amount),0) as totalUsed,
         COALESCE(SUM(CASE WHEN created_at >= DATE_FORMAT(NOW(),'%Y-%m-01') THEN amount ELSE 0 END),0) as thisMonth,
         COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END),0) as today,
         MAX(currency) as currency
       FROM sms_transactions WHERE tenant_id = ? AND type = 'debit'`,
      [tenantId]
    )

    const [txRows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.*, c.name as campaign_name
       FROM sms_transactions t
       LEFT JOIN sms_campaigns c ON c.id = t.campaign_id
       WHERE t.tenant_id = ?
       ORDER BY t.created_at DESC LIMIT 50`,
      [tenantId]
    )

    return {
      totalUsed:    Math.round(Number(agg.totalUsed)  * 100) / 100,
      thisMonth:    Math.round(Number(agg.thisMonth)  * 100) / 100,
      today:        Math.round(Number(agg.today)      * 100) / 100,
      currency:     (agg.currency as string | null) ?? null,
      transactions: txRows,
    }
  },

  // ── Rapport DLR ──────────────────────────────────────────────

  async getRapportDlr(tenantId: number, opts: { status?: string; search?: string; page?: number; limit?: number } = {}): Promise<{
    kpis: { delivered: number; pending: number; failed: number; avgTimeMs: number }
    statusDistribution: Array<{ name: string; value: number; pct: number }>
    byHour: Array<{ hour: string; count: number }>
    deliveryTimeDistrib: Array<{ range: string; count: number }>
    byOperator: Array<{ operator: string; delivered: number; failed: number }>
    errorCodes: Array<{ code: string; label: string; count: number }>
    messages: RowDataPacket[]
    total: number
  }> {
    const [[kpiRow]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status IN ('sent','queued','pending') THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status IN ('undelivered','failed') THEN 1 ELSE 0 END) as failed,
         AVG(CASE WHEN delivery_time_ms IS NOT NULL THEN delivery_time_ms ELSE NULL END) as avgTimeMs
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    )
    const del  = Number(kpiRow.delivered) || 0
    const pend = Number(kpiRow.pending)   || 0
    const fail = Number(kpiRow.failed)    || 0
    const total = del + pend + fail

    const statusDistribution = [
      { name: 'Délivrés',   value: del,  pct: total > 0 ? Math.round(del / total * 1000) / 10 : 0 },
      { name: 'En attente', value: pend, pct: total > 0 ? Math.round(pend / total * 1000) / 10 : 0 },
      { name: 'Échecs',     value: fail, pct: total > 0 ? Math.round(fail / total * 1000) / 10 : 0 },
    ]

    const [byHourRows] = await pool.execute<RowDataPacket[]>(
      `SELECT LPAD(HOUR(created_at),2,'0') as hr, COUNT(*) as cnt
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL AND DATE(created_at) = CURDATE()
       GROUP BY hr ORDER BY hr`,
      [tenantId]
    )
    const hourMap: Record<string, number> = {}
    for (const r of byHourRows as RowDataPacket[]) { hourMap[r.hr as string] = Number(r.cnt) }
    const byHour = Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0')
      return { hour: `${h}:00`, count: hourMap[h] ?? 0 }
    })

    const [timeRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         SUM(CASE WHEN delivery_time_ms < 1000 THEN 1 ELSE 0 END) as r0,
         SUM(CASE WHEN delivery_time_ms BETWEEN 1000 AND 1999 THEN 1 ELSE 0 END) as r1,
         SUM(CASE WHEN delivery_time_ms BETWEEN 2000 AND 4999 THEN 1 ELSE 0 END) as r2,
         SUM(CASE WHEN delivery_time_ms BETWEEN 5000 AND 9999 THEN 1 ELSE 0 END) as r3,
         SUM(CASE WHEN delivery_time_ms >= 10000 THEN 1 ELSE 0 END) as r4
       FROM sms_messages WHERE tenant_id = ? AND status='delivered' AND delivery_time_ms IS NOT NULL`,
      [tenantId]
    )
    const tr = timeRows[0] as RowDataPacket
    const deliveryTimeDistrib = [
      { range: '0-1s',   count: Number(tr?.r0) || 0 },
      { range: '1-2s',   count: Number(tr?.r1) || 0 },
      { range: '2-5s',   count: Number(tr?.r2) || 0 },
      { range: '5-10s',  count: Number(tr?.r3) || 0 },
      { range: '>10s',   count: Number(tr?.r4) || 0 },
    ]

    const [opRows] = await pool.execute<RowDataPacket[]>(
      `SELECT operator,
         SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as delivered,
         SUM(CASE WHEN status IN ('undelivered','failed') THEN 1 ELSE 0 END) as failed
       FROM sms_messages
       WHERE tenant_id = ? AND operator IS NOT NULL AND deleted_at IS NULL
       GROUP BY operator ORDER BY delivered DESC LIMIT 10`,
      [tenantId]
    )
    const byOperator = (opRows as RowDataPacket[]).map(r => ({
      operator:  r.operator as string,
      delivered: Number(r.delivered) || 0,
      failed:    Number(r.failed)    || 0,
    }))

    const errorLabels: Record<string, string> = {
      '0': 'Delivered',          '1': 'Unknown subscriber',
      '5': 'Undeliverable',      '6': 'Subscriber busy',
      '8': 'Network error',      '9': 'Illegal subscriber',
      '11': 'Teleservice not provisioned', '29': 'Facility rejected',
    }
    const [errRows] = await pool.execute<RowDataPacket[]>(
      `SELECT error_code, COUNT(*) as cnt
       FROM sms_messages
       WHERE tenant_id = ? AND error_code IS NOT NULL AND deleted_at IS NULL
       GROUP BY error_code ORDER BY cnt DESC LIMIT 10`,
      [tenantId]
    )
    const errorCodes = (errRows as RowDataPacket[]).map(r => ({
      code:  r.error_code as string,
      label: errorLabels[r.error_code as string] ?? `Code ${r.error_code}`,
      count: Number(r.cnt),
    }))

    const page   = Math.max(1, opts.page  ?? 1)
    const limit  = Math.min(100, opts.limit ?? 20)
    const offset = (page - 1) * limit
    let where = 'WHERE tenant_id = ? AND deleted_at IS NULL'
    const msgParams: (string | number)[] = [tenantId]
    if (opts.status) { where += ' AND status = ?'; msgParams.push(opts.status) }
    if (opts.search) { where += ' AND (phone LIKE ? OR at_message_id LIKE ?)'; msgParams.push(`%${opts.search}%`, `%${opts.search}%`) }

    const [msgRows] = await pool.query<RowDataPacket[]>(
      `SELECT id as messageId, phone, status, created_at as sentAt, delivered_at,
              delivery_time_ms as deliveryTime, operator, error_code as errorCode, at_message_id
       FROM sms_messages ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      msgParams
    )
    const [[{ msgTotal }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as msgTotal FROM sms_messages ${where}`, msgParams
    )

    return {
      kpis: { delivered: del, pending: pend, failed: fail, avgTimeMs: Math.round(Number(kpiRow.avgTimeMs) || 0) },
      statusDistribution,
      byHour,
      deliveryTimeDistrib,
      byOperator,
      errorCodes,
      messages: msgRows,
      total: Number(msgTotal),
    }
  },

  // ── Trafic Client ─────────────────────────────────────────────

  async getTraficClient(tenantId: number, opts: { period?: string } = {}): Promise<{
    kpis: { activeClients: number; newClients: number; engagementRate: number; retentionRate: number }
    trends: Array<{ date: string; actifs: number; nouveaux: number; inactifs: number; engagement: number }>
    segmentation: Array<{ segment: string; clients: number; engagement: number }>
    byHour: Array<{ hour: number; count: number }>
  }> {
    const periodDays = opts.period === '7j' ? 7 : opts.period === '90j' ? 90 : 30

    const [[kpiRow]] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(DISTINCT phone) as total,
         COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) THEN phone END) as active,
         COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN phone END) as newC
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL`,
      [periodDays, tenantId]
    )

    const total  = Number(kpiRow.total)  || 0
    const active = Number(kpiRow.active) || 0
    const newC   = Number(kpiRow.newC)   || 0

    // Tendances sur la période sélectionnée
    const [trendRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(created_at) as d, COUNT(DISTINCT phone) as phones,
              SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as del,
              COUNT(*) as total
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY d ORDER BY d`,
      [tenantId, periodDays]
    )

    // Nouveaux clients réels par jour = numéros vus pour la première fois ce jour-là
    const [newRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE(first_seen) as d, COUNT(*) as cnt FROM (
         SELECT phone, MIN(created_at) as first_seen
         FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL
         GROUP BY phone
       ) fs
       WHERE first_seen >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY d`,
      [tenantId, periodDays]
    )
    const newByDay: Record<string, number> = {}
    for (const r of newRows as RowDataPacket[]) { newByDay[String(r.d)] = Number(r.cnt) }

    const trends = (trendRows as RowDataPacket[]).map(r => ({
      date:       r.d as string,
      actifs:     Number(r.phones) || 0,
      nouveaux:   newByDay[String(r.d)] ?? 0,
      // Inactifs journaliers : nécessite un suivi d'activité par contact — 0 tant que non tracké
      inactifs:   0,
      engagement: Number(r.total) > 0 ? Math.round((Number(r.del) / Number(r.total)) * 1000) / 10 : 0,
    }))

    // Segmentation par volume d'envois reçus
    const [segRows] = await pool.execute<RowDataPacket[]>(
      `SELECT phone, COUNT(*) as msgs,
              SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) as del
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL
       GROUP BY phone`,
      [tenantId]
    )
    const segs = { VIP: 0, Premium: 0, Standard: 0, Occasionnel: 0, Inactif: 0 }
    const engSegs = { VIP: 0, Premium: 0, Standard: 0, Occasionnel: 0, Inactif: 0 }
    for (const r of segRows as RowDataPacket[]) {
      const msgs = Number(r.msgs)
      const eng  = msgs > 0 ? Number(r.del) / msgs : 0
      if (msgs >= 20)      { segs.VIP++;         engSegs.VIP         += eng }
      else if (msgs >= 10) { segs.Premium++;      engSegs.Premium     += eng }
      else if (msgs >= 5)  { segs.Standard++;     engSegs.Standard    += eng }
      else if (msgs >= 1)  { segs.Occasionnel++;  engSegs.Occasionnel += eng }
      else                 { segs.Inactif++ }
    }
    const segmentation = (['VIP','Premium','Standard','Occasionnel','Inactif'] as const).map(s => ({
      segment:    s,
      clients:    segs[s],
      engagement: segs[s] > 0 ? Math.round((engSegs[s] / segs[s]) * 1000) / 10 : 0,
    }))

    const [hourRows] = await pool.execute<RowDataPacket[]>(
      `SELECT HOUR(created_at) as hr, COUNT(DISTINCT phone) as cnt
       FROM sms_messages WHERE tenant_id = ? AND deleted_at IS NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY hr ORDER BY hr`,
      [tenantId]
    )
    const hourMap: Record<number, number> = {}
    for (const r of hourRows as RowDataPacket[]) { hourMap[Number(r.hr)] = Number(r.cnt) }
    const byHour = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourMap[i] ?? 0 }))

    return {
      kpis: {
        activeClients:   active,
        newClients:      newC,
        engagementRate:  total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
        retentionRate:   total > 0 ? Math.round(((total - newC) / Math.max(total, 1)) * 1000) / 10 : 0,
      },
      trends,
      segmentation,
      byHour,
    }
  },

  // ── Tarifs & Couverture (données statiques) ───────────────────

  getTarifsEtCouverture(): Array<{ pays: string; code: string; prixParSms: number; couverture: number }> {
    return [
      { pays: 'RD Congo',          code: '+243', prixParSms: 0.045, couverture: 99.9 },
      { pays: 'Congo-Brazzaville', code: '+242', prixParSms: 0.048, couverture: 98.5 },
      { pays: 'Angola',            code: '+244', prixParSms: 0.052, couverture: 97.8 },
      { pays: 'Cameroun',          code: '+237', prixParSms: 0.038, couverture: 98.2 },
      { pays: 'France',            code: '+33',  prixParSms: 0.035, couverture: 99.9 },
      { pays: 'Belgique',          code: '+32',  prixParSms: 0.038, couverture: 99.9 },
      { pays: 'Nigeria',           code: '+234', prixParSms: 0.042, couverture: 97.5 },
      { pays: 'Afrique du Sud',    code: '+27',  prixParSms: 0.040, couverture: 98.8 },
      { pays: 'Sénégal',           code: '+221', prixParSms: 0.047, couverture: 97.1 },
      { pays: 'Côte d\'Ivoire',    code: '+225', prixParSms: 0.046, couverture: 97.3 },
      { pays: 'Ghana',             code: '+233', prixParSms: 0.043, couverture: 97.9 },
      { pays: 'Kenya',             code: '+254', prixParSms: 0.041, couverture: 98.4 },
    ]
  },

  // ── Crédits Compte ────────────────────────────────────────────

  async getCreditsCompte(tenantId: number): Promise<{
    balance: number
    usedThisMonth: number
    remaining: number
    currency: string | null
    transactions: RowDataPacket[]
  }> {
    const [[creditRow]] = await pool.execute<RowDataPacket[]>(
      'SELECT balance FROM sms_credits WHERE tenant_id = ?',
      [tenantId]
    )
    const [[curRow]] = await pool.execute<RowDataPacket[]>(
      'SELECT MAX(currency) as currency FROM sms_transactions WHERE tenant_id = ?',
      [tenantId]
    )
    const balance = Math.round(Number(creditRow?.balance ?? 0) * 100) / 100

    const [[monthRow]] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount),0) as used
       FROM sms_transactions
       WHERE tenant_id = ? AND type = 'debit'
         AND created_at >= DATE_FORMAT(NOW(),'%Y-%m-01')`,
      [tenantId]
    )
    const usedThisMonth = Math.round(Number(monthRow.used) * 100) / 100

    const [txRows] = await pool.execute<RowDataPacket[]>(
      `SELECT t.*, c.name as campaign_name
       FROM sms_transactions t
       LEFT JOIN sms_campaigns c ON c.id = t.campaign_id
       WHERE t.tenant_id = ?
       ORDER BY t.created_at DESC LIMIT 20`,
      [tenantId]
    )

    return {
      balance,
      usedThisMonth,
      remaining: Math.max(0, Math.round((balance - usedThisMonth) * 100) / 100),
      currency: (curRow?.currency as string | null) ?? null,
      transactions: txRows,
    }
  },

  // ── HLR Lookup (Infobip Number Lookup) ───────────────────────

  async hlrLookup(phone: string): Promise<{
    valid: boolean
    number: string
    operator?: string
    country?: string
    networkType?: string
    roaming?: boolean
    ported?: boolean
    raw?: unknown
  }> {
    const normalized = normalizePhone(phone, 'CD') ?? phone

    const apiKey  = process.env.INFOBIP_API_KEY
    const baseUrl = process.env.INFOBIP_BASE_URL

    if (!apiKey || !baseUrl) {
      // Si Infobip pas configuré — retour basique depuis le préfixe
      return {
        valid:   !!normalizePhone(phone, 'CD'),
        number:  normalized,
        country: resolveCountry(normalized),
      }
    }

    try {
      const { data } = await (await import('axios')).default.get(
        `https://${baseUrl}/2/number/info`,
        {
          params:  { to: normalized },
          headers: { Authorization: `App ${apiKey}`, Accept: 'application/json' },
          timeout: 8000,
        }
      )
      const result = data?.results?.[0]
      if (!result) return { valid: false, number: normalized }

      return {
        valid:       result.status?.groupName !== 'UNDELIVERABLE',
        number:      result.to ?? normalized,
        operator:    result.network?.networkName,
        country:     result.countryName ?? resolveCountry(normalized),
        networkType: result.network?.networkType,
        roaming:     result.roaming?.status === 'ROAMING',
        ported:      result.ported,
        raw:         result,
      }
    } catch {
      // En cas d'erreur Infobip — retour dégradé sans planter
      return {
        valid:   !!normalizePhone(phone, 'CD'),
        number:  normalized,
        country: resolveCountry(normalized),
      }
    }
  },
}
