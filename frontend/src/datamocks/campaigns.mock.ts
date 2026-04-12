import type { SmsCampaign } from '../types/sms.types'
import type { EmailCampaign } from '../types/email.types'

export const mockSmsCampaigns: SmsCampaign[] = [
  {
    id: 1,
    tenantId: 1,
    name: 'Promo Vodacom Avril',
    message: 'Bénéficiez de 20% de réduction ce mois-ci ! Code : BIAR20',
    senderId: 'BIAR',
    contactListId: 1,
    status: 'completed',
    scheduledAt: null,
    sentCount: 5000,
    deliveredCount: 4820,
    failedCount: 180,
    totalRecipients: 5000,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T11:30:00Z',
  },
  {
    id: 2,
    tenantId: 1,
    name: 'OTP Connexion',
    message: 'Votre code de vérification : {{code}}. Valide 5 min.',
    senderId: 'BIARAUTH',
    contactListId: null,
    status: 'draft',
    scheduledAt: null,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    totalRecipients: 0,
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-05T09:00:00Z',
  },
]

export const mockEmailCampaigns: EmailCampaign[] = [
  {
    id: 1,
    tenantId: 1,
    name: 'Newsletter Avril 2026',
    subject: 'Nouveautés BIAR Group — Avril 2026',
    fromName: 'BIAR Group Africa',
    fromEmail: 'info@biargroup.cd',
    replyTo: null,
    templateId: 1,
    htmlBody: '<h1>Bonjour</h1>',
    status: 'completed',
    scheduledAt: null,
    sentCount: 1200,
    openCount: 480,
    clickCount: 96,
    bounceCount: 24,
    totalRecipients: 1200,
    createdAt: '2026-04-01T08:00:00Z',
  },
]
