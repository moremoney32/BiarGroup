import { pool } from '../db/config'
import type { Contact, ContactList } from '../types/contact.types'

export const contactService = {
  async getContacts(tenantId: number, filters: Record<string, unknown>): Promise<Contact[]> {
    // TODO: implement — paginated, filterable
    throw new Error('Not implemented')
  },

  async getContactById(id: number, tenantId: number): Promise<Contact | null> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createContact(data: Partial<Contact>, tenantId: number): Promise<Contact> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async updateContact(id: number, data: Partial<Contact>, tenantId: number): Promise<Contact> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async softDeleteContact(id: number, tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async importContacts(rows: Partial<Contact>[], tenantId: number): Promise<{ imported: number; errors: number }> {
    // TODO: implement — bulk insert with transaction
    throw new Error('Not implemented')
  },

  async getLists(tenantId: number): Promise<ContactList[]> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async createList(name: string, tenantId: number): Promise<ContactList> {
    // TODO: implement
    throw new Error('Not implemented')
  },

  async addContactsToList(listId: number, contactIds: number[], tenantId: number): Promise<void> {
    // TODO: implement
    throw new Error('Not implemented')
  },
}
