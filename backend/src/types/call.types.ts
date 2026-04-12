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
  startedAt: Date
  answeredAt: Date | null
  endedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Agent {
  id: number
  tenantId: number
  userId: number
  extension: string
  status: AgentStatus
  currentCallId: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CallQueue {
  id: number
  tenantId: number
  name: string
  strategy: 'ring_all' | 'round_robin' | 'least_recent' | 'fewest_calls'
  maxWaitSeconds: number
  musicOnHold: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SviConfig {
  id: number
  tenantId: number
  name: string
  phoneNumber: string
  welcomeMessage: string
  menuOptions: SviMenuOption[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SviMenuOption {
  digit: string
  action: 'queue' | 'extension' | 'playback' | 'voicemail'
  target: string
  label: string
}
