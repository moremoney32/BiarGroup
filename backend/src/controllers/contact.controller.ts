import { Request, Response } from 'express'
import { contactService } from '../services/contact.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const contactController = {
  async getContacts(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getContact(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createContact(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async updateContact(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async deleteContact(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async importContacts(req: Request, res: Response): Promise<void> {
    // TODO: implement — CSV/Excel import
  },

  async exportContacts(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getLists(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createList(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async addToList(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async removeFromList(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },
}
