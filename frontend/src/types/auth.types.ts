export type UserRole = 'super_admin' | 'admin' | 'client' | 'agent' | 'superviseur'
export type SaasPlan = 'free' | 'basic' | 'pro' | 'enterprise'

export interface User {
  id: number
  tenantId: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  emailVerifiedAt: string | null
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  tenantName?: string
  plan?: SaasPlan
}
