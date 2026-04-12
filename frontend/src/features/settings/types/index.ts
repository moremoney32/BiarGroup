export interface SmtpConfig {
  id: number
  name: string
  host: string
  port: number
  user: string
  secure: boolean
  isDefault: boolean
  dailyLimit: number
  sentToday: number
}

export interface SmppConfig {
  id: number
  name: string
  host: string
  port: number
  systemId: string
  isActive: boolean
}

export interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  permissions: string[]
  lastUsedAt: string | null
  createdAt: string
}

export interface ProfileUpdateInput {
  firstName: string
  lastName: string
  phone?: string
}

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
