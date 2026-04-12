import type { SaasPlan } from '../../../types/auth.types'

export interface BillingPlan {
  id: number
  name: SaasPlan
  displayName: string
  priceUsd: number
  smsLimit: number
  emailLimit: number
  whatsappLimit: number
  callMinutesLimit: number
  agentsLimit: number
  features: string[]
}

export interface Subscription {
  id: number
  tenantId: number
  planId: number
  plan: BillingPlan
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodEnd: string
}

export interface Invoice {
  id: number
  amountUsd: number
  currency: string
  status: 'paid' | 'open' | 'void'
  paidAt: string | null
  invoiceUrl: string | null
  createdAt: string
}
