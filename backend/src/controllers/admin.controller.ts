import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../helpers/response.helper'

// super_admin only
export const adminController = {
  async getTenants(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getTenant(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createTenant(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async updateTenant(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async suspendTenant(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getUsers(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async updateUser(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getSystemStats(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getApiKeys(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async revokeApiKey(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },
}
