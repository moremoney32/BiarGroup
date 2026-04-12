import { pool } from '../db/config'
import type { CallSession, AgentStatus, SviConfig } from '../types/call.types'

// Asterisk AMI / FreeSWITCH ESL integration
export const callService = {
  async getSessions(tenantId: number, filters: Record<string, unknown>): Promise<CallSession[]> {
    // TODO: implement — paginated call sessions by tenant
    throw new Error('Not implemented')
  },

  async getSessionById(id: number, tenantId: number): Promise<CallSession | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async initiateCall(from: string, to: string, tenantId: number): Promise<CallSession> {
    // TODO: implement — AMI originate
    throw new Error('Not implemented')
  },

  async hangupCall(sessionId: number, tenantId: number): Promise<void> {
    // TODO: implement — AMI hangup
    throw new Error('Not implemented')
  },

  async updateAgentStatus(agentId: number, status: AgentStatus, tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getQueues(tenantId: number): Promise<unknown[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getSviConfigs(tenantId: number): Promise<SviConfig[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createSviConfig(config: Partial<SviConfig>, tenantId: number): Promise<SviConfig> {
    // TODO: implement
    throw new Error('Not implemented')
  },
}
