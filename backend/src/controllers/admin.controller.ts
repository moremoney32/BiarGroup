import { Request, Response } from 'express'

// super_admin only
export const adminController = {
  async getTenants(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async getTenant(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async createTenant(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async updateTenant(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async suspendTenant(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async getUsers(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async updateUser(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async getSystemStats(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async getApiKeys(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },

  async revokeApiKey(_req: Request, _res: Response): Promise<void> {
    // TODO: implement
  },
}
