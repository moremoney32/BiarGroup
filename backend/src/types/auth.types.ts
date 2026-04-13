export type UserRole = 'super_admin' | 'admin' | 'client' | 'agent' | 'superviseur'
export type Saasplan = 'free' | 'basic' | 'pro' | 'enterprise'

export interface JwtPayload {
  id: number
  tenantId: number
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  tenantName?: string
  plan?: Saasplan
}

export interface LoginInput {
  email: string
  password: string
}

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
  emailVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Tenant {
  id: number
  name: string
  slug: string
  plan: Saasplan
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
