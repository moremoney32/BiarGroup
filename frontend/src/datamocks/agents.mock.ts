import type { Agent } from '../types/call.types'

export const mockAgents: Agent[] = [
  {
    id: 1,
    tenantId: 1,
    userId: 2,
    extension: '1001',
    status: 'available',
    currentCallId: null,
    firstName: 'Jean',
    lastName: 'Kabila',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    tenantId: 1,
    userId: 3,
    extension: '1002',
    status: 'busy',
    currentCallId: 1,
    firstName: 'Marie',
    lastName: 'Mukendi',
    createdAt: '2026-01-01T00:00:00Z',
  },
]
