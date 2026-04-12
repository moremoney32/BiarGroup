import { pool } from '../db/config'
import Stripe from 'stripe'
import type { BillingPlan, Subscription, Invoice } from '../types/billing.types'

export const billingService = {
  async getPlans(): Promise<BillingPlan[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getSubscription(tenantId: number): Promise<Subscription | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createSubscription(tenantId: number, planId: number, paymentMethod: string): Promise<Subscription> {
    // TODO: implement — Stripe + Mobile Money (M-Pesa, Airtel, Orange)
    throw new Error('Not implemented')
  },

  async cancelSubscription(tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async getInvoices(tenantId: number): Promise<Invoice[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async checkQuota(tenantId: number, resource: 'sms' | 'email' | 'whatsapp' | 'calls'): Promise<boolean> {
    // TODO: implement — check plan limits before sending
    throw new Error('Not implemented')
  },

  async handleStripeWebhook(event: unknown): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },
}
