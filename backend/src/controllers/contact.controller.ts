import { Request, Response } from 'express'
import { z } from 'zod'
import { contactService } from '../services/contact.service'
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
      const tenantId = (req as any).tenant?.id ?? 1
      const contacts = await contactService.getContacts(tenantId)
      sendSuccess(res, contacts)
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async getContact(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
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
      const tenantId = (req as any).tenant?.id ?? 1
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
      const tenantId = (req as any).tenant?.id ?? 1
      await contactService.updateContact(Number(req.params.id), parsed.data, tenantId)
      sendSuccess(res, null, 'Contact mis à jour')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      await contactService.deleteContact(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Contact supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Groupes ────────────────────────────────────────────────────────────────

  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
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
      const tenantId = (req as any).tenant?.id ?? 1
      const userId   = (req as any).user?.id   ?? 1
      const group = await contactService.createGroup(parsed.data.name, parsed.data.contactIds, tenantId, userId)
      sendSuccess(res, group, 'Groupe créé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenant?.id ?? 1
      await contactService.deleteGroup(Number(req.params.id), tenantId)
      sendSuccess(res, null, 'Groupe supprimé')
    } catch (err: unknown) {
      sendError(res, 500, 'SERVER_ERROR', err instanceof Error ? err.message : 'Erreur serveur')
    }
  },

  // ── Stubs ─────────────────────────────────────────────────────────────────

  async importContacts(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
  },
  async exportContacts(_req: Request, res: Response): Promise<void> {
    sendError(res, 501, 'NOT_IMPLEMENTED', 'Non implémenté')
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
