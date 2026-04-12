import { Request, Response } from 'express'
import { reportService } from '../services/report.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const reportController = {
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getCallReport(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getSmsReport(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getEmailReport(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getWhatsappReport(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async exportReport(req: Request, res: Response): Promise<void> {
    // TODO: implement — CSV / PDF export
  },

  async getAuditLogs(req: Request, res: Response): Promise<void> {
    // TODO: implement — gouvernement audit trail
  },
}
