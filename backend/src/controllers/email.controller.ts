import { Request, Response } from 'express'
import { emailService } from '../services/email.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const emailController = {
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

  async getLists(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createList(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getTemplates(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createTemplate(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getSmtpConfigs(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createSmtpConfig(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },
}
