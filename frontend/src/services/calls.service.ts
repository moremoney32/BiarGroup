import api from './api'
import type { CallSession, Agent } from '../types/call.types'

export const callsService = {
  async initiate(from: string, to: string): Promise<CallSession> {
    const res = await api.post('/calls/sessions/initiate', { from, to })
    return res.data.data
  },

  async hangup(sessionId: number): Promise<void> {
    await api.post(`/calls/sessions/${sessionId}/hangup`)
  },

  async updateAgentStatus(agentId: number, status: Agent['status']): Promise<void> {
    await api.patch(`/calls/agents/${agentId}/status`, { status })
  },
}
