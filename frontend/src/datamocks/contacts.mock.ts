import type { Contact } from '../types/contact.types'

export const mockContacts: Contact[] = [
  {
    id: 1,
    tenantId: 1,
    firstName: 'Patient',
    lastName: 'Lukusa',
    email: 'patient.lukusa@example.cd',
    phone: '+243810000010',
    whatsapp: '+243810000010',
    company: 'Banque centrale du Congo',
    tags: ['VIP', 'gouvernement'],
    customFields: {},
    isOptedOut: false,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    tenantId: 1,
    firstName: 'Grace',
    lastName: 'Tshiamala',
    email: null,
    phone: '+243990000020',
    whatsapp: null,
    company: null,
    tags: ['client'],
    customFields: {},
    isOptedOut: false,
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-02-10T14:00:00Z',
  },
]
