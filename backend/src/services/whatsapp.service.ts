import { pool } from '../db/config'
import axios from 'axios'
import type { WaCampaign, WaTemplate, WaMessage } from '../types/whatsapp.types'

// WhatsApp Business API + Bull queue
export const whatsappService = {
  async getCampaigns(tenantId: number, filters: Record<string, unknown>): Promise<WaCampaign[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getCampaignById(id: number, tenantId: number): Promise<WaCampaign | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createCampaign(data: Partial<WaCampaign>, tenantId: number): Promise<WaCampaign> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async sendCampaign(campaignId: number, tenantId: number): Promise<void> {
    // TODO: implement — enqueue in Bull
    throw new Error('Not implemented')
  },

  async sendMessage(to: string, templateName: string, params: string[], tenantId: number): Promise<WaMessage> {
    // TODO: implement — call WA Business API
    throw new Error('Not implemented')
  },

  async getTemplates(tenantId: number): Promise<WaTemplate[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async syncTemplates(tenantId: number): Promise<void> {
    // TODO: implement — fetch approved templates from WA API
    throw new Error('Not implemented')
  },

  async handleWebhook(payload: unknown, tenantId: number): Promise<void> {
    // TODO: implement — process incoming WA messages & status updates
    throw new Error('Not implemented')
  },
}
