import { Request, Response } from 'express'
import { callService } from '../services/call.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const callController = {
  async getSessions(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getSession(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async initiateCall(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async hangupCall(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getAgents(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async updateAgentStatus(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getQueues(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async getSviConfigs(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },

  async createSviConfig(req: Request, res: Response): Promise<void> {
    // TODO: implement
  },
}
