import { pool } from '../db/config'

export const reportService = {
  async getDashboardStats(tenantId: number): Promise<Record<string, unknown>> {
    // TODO: implement — calls, SMS, email, WA counts + revenue
    throw new Error('Not implemented')
  },

  async getCallReport(tenantId: number, from: string, to: string): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getSmsReport(tenantId: number, from: string, to: string): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getEmailReport(tenantId: number, from: string, to: string): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getWhatsappReport(tenantId: number, from: string, to: string): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async exportToCsv(data: unknown[]): Promise<Buffer> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getAuditLogs(tenantId: number, filters: Record<string, unknown>): Promise<unknown[]> {
    // TODO: implement — gouvernement audit trail
    throw new Error('Not implemented')
  },
}
