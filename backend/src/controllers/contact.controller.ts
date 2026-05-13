import { Request, Response } from 'express'
import { z } from 'zod'
import { contactService, Criterion } from '../services/contact.service'
import { emailService } from '../services/email.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

const createContactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName:  z.string().optional().default(''),
  email:     z.string().email('Email invalide').optional().nullable(),
  phone:     z.string().optional().nullable(),
  company:   z.string().optional().nullable(),
})

const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName:  z.string().optional().nullable(),
  email:     z.string().email('Email invalide').optional().nullable(),
  phone:     z.string().optional().nullable(),
  company:   z.string().optional().nullable(),
})

const createGroupSchema = z.object({
  name:       z.string().min(1, 'Le nom du groupe est requis'),
  contactIds: z.array(z.number().int().positive()).min(1, 'Sélectionnez au moins un contact'),
})

export const contactController = {

  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const contacts = await contactService.getContacts(tenantId)
      sendSuccess(res, contacts)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async getContact(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const contacts = await contactService.getContacts(tenantId)
      const contact = contacts.find(c => c.id === Number(req.params.id))
      if (!contact) { sendError(res, 404, 'NOT_FOUND', 'Contact introuvable'); return }
      sendSuccess(res, contact)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createContact(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createContactSchema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = req.tenantId!
      const contact = await contactService.createContact(parsed.data, tenantId)
      sendSuccess(res, contact, 'Contact créé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async updateContact(req: Request, res: Response): Promise<void> {
    try {
      const parsed = updateContactSchema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = req.tenantId!
      await contactService.updateContact(Number(req.params.id), parsed.data, tenantId)
      sendSuccess(res, null, 'Contact mis à jour')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await contactService.deleteContact(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Contact supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Groupes ────────────────────────────────────────────────────────────────

  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const groups = await contactService.getGroupsWithContacts(tenantId)
      sendSuccess(res, groups)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const parsed = createGroupSchema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }
      const tenantId = req.tenantId!
      const userId   = req.user!.id
      const group = await contactService.createGroup(parsed.data.name, parsed.data.contactIds, tenantId, userId)

      // Auto-enrollment dans les flows actifs qui ciblent ce groupe
      emailService.enrollContactsInActiveFlows(group.id, parsed.data.contactIds, tenantId)
        .catch((err) => console.error('[FLOW] Auto-enrollment failed:', err.message))

      sendSuccess(res, group, 'Groupe créé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await contactService.deleteGroup(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Groupe supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Segments ──────────────────────────────────────────────────────────────

  async getSegments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const [segments, stats] = await Promise.all([
        contactService.getSegments(tenantId),
        contactService.getSegmentStats(tenantId),
      ])
      sendSuccess(res, { segments, stats })
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async createSegment(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:         z.string().min(1, 'Nom requis'),
        description:  z.string().optional(),
        type:         z.enum(['dynamique', 'statique']),
        criteriaJson: z.array(z.object({
          field:    z.string(),
          operator: z.enum(['equals','not_equals','contains','starts_with','greater_than','less_than','is_empty','is_not_empty']),
          value:    z.string().optional(),
        })).default([]),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }

      const tenantId = req.tenantId!
      const userId   = req.user!.id
      const result = await contactService.createSegment(parsed.data, tenantId, userId)
      sendSuccess(res, result, 'Segment créé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async updateSegment(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        name:         z.string().min(1).optional(),
        description:  z.string().optional(),
        criteriaJson: z.array(z.object({
          field:    z.string(),
          operator: z.enum(['equals','not_equals','contains','starts_with','greater_than','less_than','is_empty','is_not_empty']),
          value:    z.string().optional(),
        })).optional(),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }

      const tenantId = req.tenantId!
      await contactService.updateSegment(Number(req.params.id), parsed.data as { name?: string; description?: string; criteriaJson?: Criterion[] }, tenantId)
      sendSuccess(res, null, 'Segment mis à jour')
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Segment introuvable') {
        sendError(res, 404, 'NOT_FOUND', err.message); return
      }
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteSegment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      await contactService.deleteSegment(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Segment supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async estimateCriteria(req: Request, res: Response): Promise<void> {
    try {
      const schema = z.object({
        criteria: z.array(z.object({
          field:    z.string(),
          operator: z.enum(['equals','not_equals','contains','starts_with','greater_than','less_than','is_empty','is_not_empty']),
          value:    z.string().optional(),
        })),
      })
      const parsed = schema.safeParse(req.body)
      if (!parsed.success) { sendError(res, 422, 'VALIDATION_ERROR', parsed.error.errors[0].message); return }

      const tenantId = req.tenantId!
      const count = await contactService.countByCriteria(parsed.data.criteria as Criterion[], tenantId)
      sendSuccess(res, { count })
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Stubs ─────────────────────────────────────────────────────────────────

  async getCustomFieldKeys(req: Request, res: Response): Promise<void> {
    const keys = await contactService.getCustomFieldKeys(req.tenantId!)
    sendSuccess(res, keys)
  },

  async importContacts(req: Request, res: Response): Promise<void> {
    const tenantId = req.tenantId!

    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) { sendError(res, 400, 'NO_FILE', 'Aucun fichier reçu'); return }

    // Mapping colonnes → champs connus (partagé CSV + Excel)
    const KNOWN: Record<string, string> = {
      prenom: 'firstName', first_name: 'firstName', first: 'firstName', firstname: 'firstName', given_name: 'firstName', 'prénom': 'firstName',
      nom: 'lastName', last_name: 'lastName', lastname: 'lastName', surname: 'lastName',
      email: 'email', mail: 'email', courriel: 'email',
      telephone: 'phone', phone: 'phone', tel: 'phone', mobile: 'phone', gsm: 'phone', portable: 'phone', 'téléphone': 'phone',
      whatsapp: 'whatsapp', wa: 'whatsapp',
      entreprise: 'company', company: 'company', societe: 'company', organisation: 'company', org: 'company', 'société': 'company',
      tags: 'tags', etiquettes: 'tags', labels: 'tags',
    }

    type ImportRow = {
      firstName: string; lastName: string; email: string | null
      phone: string | null; whatsapp: string | null; company: string | null
      tags: string[]; customFields: Record<string, string>
    }

    function normalizeHeader(h: string): string {
      return String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    }

    function buildRow(headers: string[], values: string[]): ImportRow {
      const row: ImportRow = { firstName: '', lastName: '', email: null, phone: null, whatsapp: null, company: null, tags: [], customFields: {} }
      headers.forEach((h, i) => {
        const val = String(values[i] ?? '').trim()
        if (!val) return
        const mapped = KNOWN[h] ?? `custom:${h}`
        if (mapped === 'firstName')           row.firstName  = val
        else if (mapped === 'lastName')       row.lastName   = val
        else if (mapped === 'email')          row.email      = val.toLowerCase()
        else if (mapped === 'phone')          row.phone      = val
        else if (mapped === 'whatsapp')       row.whatsapp   = val
        else if (mapped === 'company')        row.company    = val
        else if (mapped === 'tags')           row.tags       = val.split('|').map(t => t.trim()).filter(Boolean)
        else if (mapped.startsWith('custom:')) {
          const key = mapped.slice(7)
          if (key) row.customFields[key] = val
        }
      })
      return row
    }

    let rows: ImportRow[] = []
    const fileName = file.originalname.toLowerCase()
    const isExcel  = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    if (isExcel) {
      // ── Parsing Excel ─────────────────────────────────────────────────────
      try {
        const XLSX = await import('xlsx')
        const wb   = XLSX.read(file.buffer, { type: 'buffer', cellDates: true })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        if (data.length === 0) { sendError(res, 400, 'EMPTY_FILE', 'Fichier Excel vide ou sans données'); return }
        if (data.length > 10000) { sendError(res, 400, 'TOO_MANY_ROWS', 'Maximum 10 000 lignes par import'); return }

        const headers = Object.keys(data[0]).map(normalizeHeader)

        rows = data.map(rowObj => {
          const values = Object.values(rowObj).map(v => {
            if (v instanceof Date) return v.toISOString().slice(0, 10)
            return String(v ?? '')
          })
          return buildRow(headers, values)
        }).filter(r => r.firstName || r.lastName || r.email)
      } catch {
        sendError(res, 400, 'INVALID_EXCEL', 'Impossible de lire le fichier Excel — vérifiez le format'); return
      }
    } else {
      // ── Parsing CSV ───────────────────────────────────────────────────────
      const text  = file.buffer.toString('utf-8').replace(/^﻿/, '') // strip BOM
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) { sendError(res, 400, 'EMPTY_FILE', 'Fichier vide ou sans données'); return }
      if (lines.length > 10001) { sendError(res, 400, 'TOO_MANY_ROWS', 'Maximum 10 000 lignes par import'); return }

      const sep      = lines[0].includes(';') ? ';' : ','
      const parseLine = (line: string) => line.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''))
      const headers  = parseLine(lines[0]).map(normalizeHeader)

      rows = lines.slice(1).map(line => buildRow(headers, parseLine(line)))
        .filter(r => r.firstName || r.lastName || r.email)
    }

    if (rows.length === 0) { sendError(res, 400, 'NO_VALID_ROWS', 'Aucune ligne valide trouvée'); return }

    const result = await contactService.importBulk(rows, tenantId)
    sendSuccess(res, result, `Import terminé : ${result.inserted} ajouté(s), ${result.updated} mis à jour, ${result.skipped} ignoré(s)`)
  },
  async exportContacts(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenantId!
      const csv = await contactService.exportContacts(tenantId)
      const filename = `contacts_${new Date().toISOString().slice(0, 10)}.csv`
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send('﻿' + csv) // BOM UTF-8 pour Excel
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },
  async getLists(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, [])
  },
  async createList(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
  async addToList(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
  async removeFromList(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
}
