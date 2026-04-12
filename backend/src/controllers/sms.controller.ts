import { Request, Response } from 'express'
import { smsService } from '../services/sms.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const smsController = {
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

  async getMessages(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getTemplates(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createTemplate(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async sendOtp(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async verifyOtp(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },
}
