import { pool } from '../db/config'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

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
}
