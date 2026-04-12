import type { SaasPlan, UserRole } from '../../../types/auth.types'

export interface Tenant {
  id: number
  name: string
  slug: string
  plan: SaasPlan
  isActive: boolean
  userCount: number
  createdAt: string
}

export interface AdminUser {
  id: number
  tenantId: number
  tenantName: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface SystemStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalSmsSent: number
  totalEmailsSent: number
  totalCallMinutes: number
  revenueUsd: number
}
