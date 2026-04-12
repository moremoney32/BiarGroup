import type { Saasplan } from './auth.types'

export interface BillingPlan {
  id: number
  name: Saasplan
  displayName: string
  priceUsd: number
  smsSmsLimit: number
  emailLimit: number
  whatsappLimit: number
  callMinutesLimit: number
  agentsLimit: number
  features: string[]
  isActive: boolean
}

export interface Subscription {
  id: number
  tenantId: number
  planId: number
  status: 'active' | 'cancelled' | 'past_due' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelledAt: Date | null
  stripeSubscriptionId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: number
  tenantId: number
  subscriptionId: number
  amountUsd: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  paidAt: Date | null
  invoiceUrl: string | null
  stripeInvoiceId: string | null
  createdAt: Date
}
