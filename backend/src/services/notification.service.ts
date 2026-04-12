import { pool } from '../db/config'
import { io } from '../server'

export const notificationService = {
  async create(userId: number, tenantId: number, message: string, type: string): Promise<void> {
    // TODO: implement — insert in DB + emit via Socket.io
    throw new Error('Not implemented')
  },

  async getUnread(userId: number, tenantId: number): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async markAsRead(notificationId: number, userId: number, tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async markAllAsRead(userId: number, tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  broadcastToTenant(tenantId: number, event: string, data: unknown): void {
    // TODO: implement — emit to tenant room via Socket.io
  },

  broadcastToUser(userId: number, event: string, data: unknown): void {
    // TODO: implement — emit to user socket
  },
}
