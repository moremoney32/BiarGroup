import { pool } from '../db/config'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

export interface Criterion {
  field:    string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value?:   string
}

// Champs directs autorisés — whitelist anti-injection SQL
const ALLOWED_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'phone', 'company',
  'is_opted_out', 'created_at', 'tags',
])

// Préfixe custom. → JSON_EXTRACT sur custom_fields
// Ex: field = 'custom.ville' → JSON_UNQUOTE(JSON_EXTRACT(custom_fields, '$.ville'))
function isCustomField(field: string) { return field.startsWith('custom.') }
function customFieldKey(field: string) { return field.slice(7) } // retire 'custom.'
function customFieldSQL(field: string) {
  const key = customFieldKey(field).replace(/[^a-zA-Z0-9_]/g, '') // sanitize
  return `JSON_UNQUOTE(JSON_EXTRACT(custom_fields, '$.${key}'))`
}

export function buildCriteriaSQL(criteria: Criterion[]): { sql: string; params: unknown[] } {
  const parts: string[] = []
  const params: unknown[] = []

  for (const c of criteria) {
    const isCustom = isCustomField(c.field)
    if (!isCustom && !ALLOWED_FIELDS.has(c.field)) continue

    const col = isCustom ? customFieldSQL(c.field) : c.field

    switch (c.operator) {
      case 'equals':
        if (c.field === 'tags') {
          parts.push(`JSON_CONTAINS(tags, JSON_QUOTE(?), '$')`)
          params.push(c.value ?? '')
        } else {
          parts.push(`${col} = ?`)
          params.push(c.value ?? '')
        }
        break
      case 'not_equals':
        parts.push(`(${col} != ? OR ${col} IS NULL)`)
        params.push(c.value ?? '')
        break
      case 'contains':
        if (c.field === 'tags') {
          parts.push(`JSON_CONTAINS(tags, JSON_QUOTE(?), '$')`)
          params.push(c.value ?? '')
        } else {
          parts.push(`${col} LIKE ?`)
          params.push(`%${c.value ?? ''}%`)
        }
        break
      case 'starts_with':
        parts.push(`${col} LIKE ?`)
        params.push(`${c.value ?? ''}%`)
        break
      case 'greater_than':
        parts.push(`CAST(${col} AS SIGNED) > ?`)
        params.push(Number(c.value ?? 0))
        break
      case 'less_than':
        parts.push(`CAST(${col} AS SIGNED) < ?`)
        params.push(Number(c.value ?? 0))
        break
      case 'is_empty':
        parts.push(`(${col} IS NULL OR ${col} = '')`)
        break
      case 'is_not_empty':
        parts.push(`(${col} IS NOT NULL AND ${col} != '')`)
        break
    }
  }

  return { sql: parts.length ? parts.join(' AND ') : '1=1', params }
}

interface ContactRow extends RowDataPacket {
  id: number
  tenant_id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  company: string | null
  tags: unknown
  custom_fields: unknown
  is_opted_out: number
  created_at: string
  updated_at: string
}

interface GroupContactRow extends RowDataPacket {
  group_id: number
  group_name: string
  c_id: number | null
  c_first_name: string | null
  c_last_name: string | null
  c_email: string | null
  c_phone: string | null
  c_company: string | null
}

function mapContact(r: ContactRow) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    firstName: r.first_name,
    lastName: r.last_name || null,
    email: r.email,
    phone: r.phone ?? '',
    whatsapp: r.whatsapp,
    company: r.company,
    tags: Array.isArray(r.tags)
      ? r.tags
      : typeof r.tags === 'string'
        ? JSON.parse(r.tags || '[]')
        : [],
    customFields:
      r.custom_fields && typeof r.custom_fields === 'object'
        ? (r.custom_fields as Record<string, string>)
        : {},
    isOptedOut: Boolean(r.is_opted_out),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const contactService = {

  async getContacts(tenantId: number) {
    const [rows] = await pool.execute<ContactRow[]>(
      `SELECT id, tenant_id, first_name, last_name, email, phone, whatsapp, company,
              tags, custom_fields, is_opted_out, created_at, updated_at
       FROM contacts
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows.map(mapContact)
  },

  async createContact(
    data: { firstName: string; lastName?: string; email?: string | null; phone?: string | null; company?: string | null },
    tenantId: number
  ) {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO contacts (tenant_id, first_name, last_name, email, phone, company)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenantId, data.firstName, data.lastName ?? '', data.email || null, data.phone || null, data.company || null]
    )
    const [rows] = await pool.execute<ContactRow[]>(
      `SELECT id, tenant_id, first_name, last_name, email, phone, whatsapp, company,
              tags, custom_fields, is_opted_out, created_at, updated_at
       FROM contacts WHERE id = ?`,
      [result.insertId]
    )
    return mapContact(rows[0])
  },

  async updateContact(
    id: number,
    data: { firstName?: string; lastName?: string | null; email?: string | null; phone?: string | null; company?: string | null },
    tenantId: number
  ) {
    await pool.execute(
      `UPDATE contacts
       SET first_name = COALESCE(?, first_name),
           last_name  = COALESCE(?, last_name),
           email      = ?,
           phone      = COALESCE(?, phone),
           company    = ?
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [
        data.firstName ?? null,
        data.lastName ?? null,
        data.email ?? null,
        data.phone ?? null,
        data.company ?? null,
        id,
        tenantId,
      ]
    )
  },

  async deleteContact(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE contacts SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  // ── Groupes ────────────────────────────────────────────────────────────────

  async getGroupsWithContacts(tenantId: number) {
    const [rows] = await pool.execute<GroupContactRow[]>(
      `SELECT g.id AS group_id, g.name AS group_name,
              c.id AS c_id, c.first_name AS c_first_name, c.last_name AS c_last_name,
              c.email AS c_email, c.phone AS c_phone, c.company AS c_company
       FROM contact_groups g
       LEFT JOIN contact_group_members m ON m.group_id = g.id
       LEFT JOIN contacts c ON c.id = m.contact_id AND c.deleted_at IS NULL
       WHERE g.tenant_id = ? AND g.deleted_at IS NULL
       ORDER BY g.id DESC, c.id`,
      [tenantId]
    )

    const groupMap = new Map<number, { id: number; name: string; contacts: object[] }>()
    for (const row of rows) {
      if (!groupMap.has(row.group_id)) {
        groupMap.set(row.group_id, { id: row.group_id, name: row.group_name, contacts: [] })
      }
      if (row.c_id !== null) {
        groupMap.get(row.group_id)!.contacts.push({
          id: row.c_id,
          tenantId,
          firstName: row.c_first_name ?? '',
          lastName: row.c_last_name ?? null,
          email: row.c_email,
          phone: row.c_phone ?? '',
          whatsapp: null,
          company: row.c_company,
          tags: [],
          customFields: {},
          isOptedOut: false,
          createdAt: '',
          updatedAt: '',
        })
      }
    }
    return Array.from(groupMap.values())
  },

  async createGroup(name: string, contactIds: number[], tenantId: number, userId: number) {
    // Vérifier que tous les contacts appartiennent à ce tenant — anti cross-tenant
    if (contactIds.length > 0) {
      const ph = contactIds.map(() => '?').join(',')
      const [owned] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM contacts WHERE id IN (${ph}) AND tenant_id = ? AND deleted_at IS NULL`,
        [...contactIds, tenantId]
      )
      const ownedIds = new Set((owned as { id: number }[]).map(r => r.id))
      contactIds = contactIds.filter(id => ownedIds.has(id))
      if (contactIds.length === 0) throw new Error('Aucun contact valide pour ce tenant')
    }

    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()

      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO contact_groups (tenant_id, name, created_by) VALUES (?, ?, ?)`,
        [tenantId, name, userId]
      )
      const groupId = result.insertId

      for (const contactId of contactIds) {
        await conn.execute(
          `INSERT IGNORE INTO contact_group_members (group_id, contact_id) VALUES (?, ?)`,
          [groupId, contactId]
        )
      }

      await conn.commit()
      return { id: groupId, name, contactCount: contactIds.length }
    } catch (err) {
      await conn.rollback()
      throw err
    } finally {
      conn.release()
    }
  },

  async deleteGroup(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE contact_groups SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  // ── Segments avancés ───────────────────────────────────────────────────────

  async getSegments(tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, name, description, type, criteria_json, contact_count, created_at, updated_at
       FROM contact_segments
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [tenantId]
    )
    return rows.map(r => ({
      ...r,
      criteria_json: typeof r.criteria_json === 'string' ? JSON.parse(r.criteria_json) : (r.criteria_json ?? []),
    }))
  },

  async createSegment(data: {
    name: string
    description?: string
    type: 'dynamique' | 'statique'
    criteriaJson: Criterion[]
  }, tenantId: number, userId: number) {
    const count = data.type === 'dynamique'
      ? await contactService.countByCriteria(data.criteriaJson, tenantId)
      : 0

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO contact_segments (tenant_id, created_by, name, description, type, criteria_json, contact_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, userId, data.name, data.description ?? '', data.type, JSON.stringify(data.criteriaJson), count]
    )
    return { id: result.insertId, contactCount: count }
  },

  async updateSegment(id: number, data: {
    name?: string
    description?: string
    criteriaJson?: Criterion[]
  }, tenantId: number) {
    const seg = await contactService.getSegmentById(id, tenantId)
    if (!seg) throw new Error('Segment introuvable')

    const criteria = data.criteriaJson ?? (seg.criteria_json as Criterion[])
    const segTyped = seg as unknown as { type: string; contact_count: number }
    const count    = segTyped.type === 'dynamique' ? await contactService.countByCriteria(criteria, tenantId) : segTyped.contact_count

    await pool.execute(
      `UPDATE contact_segments
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           criteria_json = ?,
           contact_count = ?,
           updated_at = NOW()
       WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [data.name ?? null, data.description ?? null, JSON.stringify(criteria), count, id, tenantId]
    )
  },

  async deleteSegment(id: number, tenantId: number) {
    await pool.execute(
      `UPDATE contact_segments SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    )
  },

  async getSegmentById(id: number, tenantId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM contact_segments WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL`,
      [id, tenantId]
    )
    if (!rows.length) return null
    const r = rows[0]
    return {
      ...r,
      criteria_json: typeof r.criteria_json === 'string' ? JSON.parse(r.criteria_json) : (r.criteria_json ?? []),
    }
  },

  // Compte les contacts correspondant à des critères dynamiques
  async countByCriteria(criteria: Criterion[], tenantId: number): Promise<number> {
    const { sql, params } = buildCriteriaSQL(criteria)
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM contacts WHERE tenant_id = ? AND deleted_at IS NULL AND ${sql}`,
      [tenantId, ...params] as Parameters<typeof pool.execute>[1]
    )
    return Number(rows[0]?.cnt ?? 0)
  },

  // Stats globales pour la page
  async getSegmentStats(tenantId: number) {
    const [[countRow], [segRow], [newRow]] = await Promise.all([
      pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM contacts WHERE tenant_id = ? AND deleted_at IS NULL`,
        [tenantId]
      ),
      pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS active FROM contact_segments WHERE tenant_id = ? AND deleted_at IS NULL`,
        [tenantId]
      ),
      pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS new_contacts FROM contacts
         WHERE tenant_id = ? AND deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [tenantId]
      ),
    ])
    return {
      totalContacts:  Number(countRow[0]?.total       ?? 0),
      activeSegments: Number(segRow[0]?.active        ?? 0),
      newContacts:    Number(newRow[0]?.new_contacts  ?? 0),
    }
  },

  // Retourne tous les noms de custom_fields utilisés par le tenant
  async getCustomFieldKeys(tenantId: number): Promise<string[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT DISTINCT jt.key_name
         FROM contacts c,
         JSON_TABLE(JSON_KEYS(c.custom_fields), '$[*]'
           COLUMNS (key_name VARCHAR(100) PATH '$')) AS jt
         WHERE c.tenant_id = ? AND c.custom_fields IS NOT NULL AND c.deleted_at IS NULL
         LIMIT 200`,
        [tenantId]
      )
      return (rows as { key_name: string }[]).map(r => r.key_name).filter(Boolean)
    } catch {
      return []
    }
  },

  // Résout les contacts correspondant à une liste de segmentIds (union, sans doublons)
  async getContactsBySegmentIds(segmentIds: number[], tenantId: number): Promise<Array<{
    id: number; first_name: string; last_name: string; email: string
    company: string | null; custom_fields: string | null
  }>> {
    if (!segmentIds.length) return []

    const ph = segmentIds.map(() => '?').join(',')
    const [segs] = await pool.execute<RowDataPacket[]>(
      `SELECT id, criteria_json FROM contact_segments WHERE id IN (${ph}) AND tenant_id = ? AND deleted_at IS NULL`,
      [...segmentIds, tenantId]
    )
    if (!segs.length) return []

    type Row = { id: number; first_name: string; last_name: string; email: string; company: string | null; custom_fields: string | null }
    const seen = new Map<number, Row>()

    for (const seg of segs as { id: number; criteria_json: string | Criterion[] }[]) {
      const criteria: Criterion[] = typeof seg.criteria_json === 'string'
        ? JSON.parse(seg.criteria_json) as Criterion[]
        : seg.criteria_json

      const { sql, params } = buildCriteriaSQL(criteria)
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, first_name, last_name, email, company, custom_fields
         FROM contacts
         WHERE tenant_id = ? AND deleted_at IS NULL AND is_opted_out = FALSE AND email IS NOT NULL AND (${sql})`,
        [tenantId, ...params] as Parameters<typeof pool.execute>[1]
      )
      for (const r of rows as Row[]) {
        if (!seen.has(r.id)) seen.set(r.id, r)
      }
    }
    return Array.from(seen.values())
  },

  // Export contacts → CSV string
  async exportContacts(tenantId: number): Promise<string> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT first_name, last_name, email, phone, whatsapp, company, tags, custom_fields, is_opted_out
       FROM contacts WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [tenantId]
    )

    const parseCf = (raw: unknown): Record<string, string> => {
      if (!raw) return {}
      if (typeof raw === 'object') return raw as Record<string, string>
      try { return JSON.parse(raw as string) as Record<string, string> } catch { return {} }
    }

    // Collecter tous les noms de champs custom
    const customKeys = new Set<string>()
    for (const r of rows) {
      Object.keys(parseCf(r.custom_fields)).forEach(k => customKeys.add(k))
    }
    const extra = Array.from(customKeys)
    const headers = ['prenom', 'nom', 'email', 'telephone', 'whatsapp', 'entreprise', 'tags', 'opted_out', ...extra]

    const esc = (v: unknown) => {
      if (v == null) return ''
      const s = String(v)
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"`
        : s
    }

    const lines = [headers.join(',')]
    for (const r of rows) {
      let tags: string[] = []
      try { tags = Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags ?? '[]') } catch { tags = [] }
      const cf = parseCf(r.custom_fields)
      lines.push([
        esc(r.first_name), esc(r.last_name), esc(r.email),
        esc(r.phone), esc(r.whatsapp), esc(r.company),
        esc(tags.join('|')), esc(r.is_opted_out ? '1' : '0'),
        ...extra.map(k => esc(cf[k] ?? '')),
      ].join(','))
    }
    return lines.join('\r\n')
  },

  // Import CSV bulk — 10 000 lignes max, custom_fields pour les colonnes inconnues
  async importBulk(
    rows: Array<{
      firstName: string
      lastName: string
      email: string | null
      phone: string | null
      whatsapp: string | null
      company: string | null
      tags: string[]
      customFields: Record<string, string>
    }>,
    tenantId: number
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    if (rows.length === 0) return { inserted: 0, updated: 0, skipped: 0 }

    // Récupérer les emails existants pour ce tenant
    const emails = rows.filter(r => r.email).map(r => r.email!)
    let existingEmails = new Set<string>()
    if (emails.length > 0) {
      const ph = emails.map(() => '?').join(',')
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT email FROM contacts WHERE tenant_id = ? AND email IN (${ph}) AND deleted_at IS NULL`,
        [tenantId, ...emails]
      )
      existingEmails = new Set((existing as { email: string }[]).map(r => r.email))
    }

    const toInsert = rows.filter(r => !r.email || !existingEmails.has(r.email))
    const toUpdate = rows.filter(r => r.email && existingEmails.has(r.email))

    let inserted = 0
    let updated  = 0
    let skipped  = 0

    // Bulk insert par chunks de 500
    const CHUNK = 500
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const chunk = toInsert.slice(i, i + CHUNK)
      if (!chunk.length) break
      const ph2 = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')
      const values = chunk.flatMap(r => [
        tenantId,
        r.firstName || '',
        r.lastName  || '',
        r.email     || null,
        r.phone     || null,
        r.whatsapp  || null,
        r.company   || null,
        JSON.stringify(r.tags),
        JSON.stringify(r.customFields),
      ])
      try {
        await pool.execute(
          `INSERT INTO contacts
           (tenant_id, first_name, last_name, email, phone, whatsapp, company, tags, custom_fields)
           VALUES ${ph2}`,
          values
        )
        inserted += chunk.length
      } catch { skipped += chunk.length }
    }

    // Mise à jour des contacts existants
    for (const r of toUpdate) {
      try {
        await pool.execute(
          `UPDATE contacts SET
             first_name    = COALESCE(NULLIF(?, ''), first_name),
             last_name     = COALESCE(NULLIF(?, ''), last_name),
             phone         = COALESCE(NULLIF(?, ''), phone),
             whatsapp      = COALESCE(NULLIF(?, ''), whatsapp),
             company       = COALESCE(NULLIF(?, ''), company),
             custom_fields = JSON_MERGE_PATCH(COALESCE(custom_fields, '{}'), ?),
             updated_at    = NOW()
           WHERE email = ? AND tenant_id = ? AND deleted_at IS NULL`,
          [
            r.firstName, r.lastName, r.phone, r.whatsapp, r.company,
            JSON.stringify(r.customFields),
            r.email, tenantId,
          ]
        )
        updated++
      } catch { skipped++ }
    }

    return { inserted, updated, skipped }
  },
}
