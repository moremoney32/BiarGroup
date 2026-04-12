import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../services/api'
import type { Contact, ContactList } from '../../types/contact.types'
import type { PaginatedResponse, PaginationQuery } from '../../types/api.types'

export const contactApi = createApi({
  reducerPath: 'contactApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Contact', 'ContactList'],
  endpoints: (builder) => ({
    getContacts: builder.query<PaginatedResponse<Contact>, PaginationQuery>({
      query: (params) => ({ url: '/contacts', method: 'GET', params }),
      providesTags: ['Contact'],
    }),

    getContact: builder.query<Contact, number>({
      query: (id) => ({ url: `/contacts/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Contact', id }],
    }),

    createContact: builder.mutation<Contact, Partial<Contact>>({
      query: (body) => ({ url: '/contacts', method: 'POST', data: body }),
      invalidatesTags: ['Contact'],
    }),

    updateContact: builder.mutation<Contact, { id: number; data: Partial<Contact> }>({
      query: ({ id, data }) => ({ url: `/contacts/${id}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Contact', id }],
    }),

    deleteContact: builder.mutation<void, number>({
      query: (id) => ({ url: `/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contact'],
    }),

    getLists: builder.query<ContactList[], void>({
      query: () => ({ url: '/contacts/lists', method: 'GET' }),
      providesTags: ['ContactList'],
    }),

    createList: builder.mutation<ContactList, { name: string }>({
      query: (body) => ({ url: '/contacts/lists', method: 'POST', data: body }),
      invalidatesTags: ['ContactList'],
    }),

    addToList: builder.mutation<void, { listId: number; contactIds: number[] }>({
      query: ({ listId, contactIds }) => ({
        url: `/contacts/lists/${listId}/add`,
        method: 'POST',
        data: { contactIds },
      }),
      invalidatesTags: ['ContactList'],
    }),
  }),
})

export const {
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetListsQuery,
  useCreateListMutation,
  useAddToListMutation,
} = contactApi
