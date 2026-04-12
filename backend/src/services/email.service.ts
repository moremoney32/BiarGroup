import { pool } from '../db/config'
import nodemailer from 'nodemailer'
import type { EmailCampaign, EmailTemplate, EmailList } from '../types/email.types'

// Multi-SMTP + Bull queue
export const emailService = {
  async getCampaigns(tenantId: number, filters: Record<string, unknown>): Promise<EmailCampaign[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getCampaignById(id: number, tenantId: number): Promise<EmailCampaign | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createCampaign(data: Partial<EmailCampaign>, tenantId: number): Promise<EmailCampaign> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async updateCampaign(id: number, data: Partial<EmailCampaign>, tenantId: number): Promise<EmailCampaign> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async deleteCampaign(id: number, tenantId: number): Promise<void> {
    // TODO: implement — soft delete
    throw new Error('Not implemented')
  },

  async sendCampaign(campaignId: number, tenantId: number): Promise<void> {
    // TODO: implement — enqueue in Bull, multi-SMTP rotation
    throw new Error('Not implemented')
  },

  async sendTransactional(to: string, subject: string, html: string, tenantId: number): Promise<void> {
    // TODO: implement — single email send
    throw new Error('Not implemented')
  },

  async getTemplates(tenantId: number): Promise<EmailTemplate[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createTemplate(data: Partial<EmailTemplate>, tenantId: number): Promise<EmailTemplate> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getLists(tenantId: number): Promise<EmailList[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async handleBounce(email: string, tenantId: number): Promise<void> {
    // TODO: implement — bounce / unsubscribe management
    throw new Error('Not implemented')
  },
}
