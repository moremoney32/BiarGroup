// Constantes globales BIAR GROUP AFRICA

export const APP_NAME = 'BIAR Actor Hub'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

// Charte graphique BIAR
export const COLORS = {
  primary: '#E91E8C',
  secondary: '#3B2F8F',
  bgDark: '#0F0F1A',
  text: '#1A1A2E',
} as const

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// SMS
export const MAX_SMS_LENGTH = 160
export const MAX_SMS_CONCAT = 10 // max 1600 chars
export const MAX_SMS_PER_BATCH = 10_000

// Email
export const MAX_EMAIL_SUBJECT_LENGTH = 150
export const MAX_EMAIL_SIZE_MB = 10

// Phone — RDC Congo
export const RDC_PHONE_PREFIX = '+243'
export const RDC_OPERATORS = ['Vodacom', 'Airtel', 'Orange', 'Africell'] as const

// Plans SaaS
export const PLANS = ['free', 'basic', 'pro', 'enterprise'] as const

// Rôles
export const ROLES = ['super_admin', 'admin', 'client', 'agent', 'superviseur'] as const

// Langues supportées
export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
] as const
