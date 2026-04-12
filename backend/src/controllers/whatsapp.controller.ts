import { Request, Response } from 'express'
import { whatsappService } from '../services/whatsapp.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const whatsappController = {
  async getCampaigns(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getCampaign(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createCampaign(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async updateCampaign(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async deleteCampaign(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async sendCampaign(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getTemplates(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createTemplate(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getContacts(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async webhook(req: Request, res: Response): Promise<void> {
    // TODO: implement — WA Business API webhook
  },
}
