export interface Contact {
  id: number
  tenantId: number
  firstName: string
  lastName: string | null
  email: string | null
  phone: string
  whatsapp: string | null
  company: string | null
  tags: string[]
  customFields: Record<string, string>
  isOptedOut: boolean
  createdAt: string
  updatedAt: string
}

export interface ContactList {
  id: number
  tenantId: number
  name: string
  description: string | null
  contactCount: number
  createdAt: string
}
