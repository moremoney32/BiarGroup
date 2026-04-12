export type CallDirection = 'inbound' | 'outbound'
export type CallStatus = 'ringing' | 'answered' | 'busy' | 'no_answer' | 'failed' | 'completed'
export type AgentStatus = 'available' | 'busy' | 'paused' | 'offline'

export interface CallSession {
  id: number
  tenantId: number
  agentId: number | null
  callerNumber: string
  calledNumber: string
  direction: CallDirection
  status: CallStatus
  durationSeconds: number | null
  recordingUrl: string | null
  queueId: number | null
  startedAt: string
  answeredAt: string | null
  endedAt: string | null
  createdAt: string
}

export interface Agent {
  id: number
  tenantId: number
  userId: number
  extension: string
  status: AgentStatus
  currentCallId: number | null
  firstName: string
  lastName: string
  createdAt: string
}

export interface CallQueue {
  id: number
  tenantId: number
  name: string
  strategy: 'ring_all' | 'round_robin' | 'least_recent' | 'fewest_calls'
  maxWaitSeconds: number
}

export interface SviConfig {
  id: number
  tenantId: number
  name: string
  phoneNumber: string
  welcomeMessage: string
  menuOptions: SviMenuOption[]
  isActive: boolean
}

export interface SviMenuOption {
  digit: string
  action: 'queue' | 'extension' | 'playback' | 'voicemail'
  target: string
  label: string
}
