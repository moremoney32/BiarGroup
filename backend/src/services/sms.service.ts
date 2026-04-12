import { pool } from '../db/config'
import type { SmsCampaign, SmsMessage, SmsTemplate } from '../types/sms.types'

// SMPP + Bull queue integration
export const smsService = {
  async getCampaigns(tenantId: number, filters: Record<string, unknown>): Promise<SmsCampaign[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getCampaignById(id: number, tenantId: number): Promise<SmsCampaign | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createCampaign(data: Partial<SmsCampaign>, tenantId: number): Promise<SmsCampaign> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async updateCampaign(id: number, data: Partial<SmsCampaign>, tenantId: number): Promise<SmsCampaign> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async deleteCampaign(id: number, tenantId: number): Promise<void> {
    // TODO: implement — soft delete
    throw new Error('Not implemented')
  },

  async sendCampaign(campaignId: number, tenantId: number): Promise<void> {
    // TODO: implement — enqueue in Bull, dispatch via SMPP
    throw new Error('Not implemented')
  },

  async sendOtp(phone: string, code: string, tenantId: number): Promise<void> {
    // TODO: implement — rate limited OTP send
    throw new Error('Not implemented')
  },

  async getDeliveryStatus(messageId: number, tenantId: number): Promise<SmsMessage | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getTemplates(tenantId: number): Promise<SmsTemplate[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createTemplate(data: Partial<SmsTemplate>, tenantId: number): Promise<SmsTemplate> {
    // TODO: implement
    throw new Error('Not implemented')
  },
}
