import type { CallSession } from '../types/call.types'

export const mockCallSessions: CallSession[] = [
  {
    id: 1,
    tenantId: 1,
    agentId: 1,
    callerNumber: '+243810000001',
    calledNumber: '+243810000002',
    direction: 'inbound',
    status: 'completed',
    durationSeconds: 142,
    recordingUrl: null,
    queueId: 1,
    startedAt: '2026-04-06T08:00:00Z',
    answeredAt: '2026-04-06T08:00:12Z',
    endedAt: '2026-04-06T08:02:34Z',
    createdAt: '2026-04-06T08:00:00Z',
  },
]
