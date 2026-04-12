import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../services/api'
import type { EmailCampaign, EmailTemplate, EmailList } from '../../types/email.types'
import type { PaginatedResponse, PaginationQuery } from '../../types/api.types'

export const emailApi = createApi({
  reducerPath: 'emailApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['EmailCampaign', 'EmailTemplate', 'EmailList'],
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<EmailCampaign>, PaginationQuery>({
      query: (params) => ({ url: '/email/campaigns', method: 'GET', params }),
      providesTags: ['EmailCampaign'],
    }),

    getCampaign: builder.query<EmailCampaign, number>({
      query: (id) => ({ url: `/email/campaigns/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'EmailCampaign', id }],
    }),

    createCampaign: builder.mutation<EmailCampaign, Partial<EmailCampaign>>({
      query: (body) => ({ url: '/email/campaigns', method: 'POST', data: body }),
      invalidatesTags: ['EmailCampaign'],
    }),

    updateCampaign: builder.mutation<EmailCampaign, { id: number; data: Partial<EmailCampaign> }>({
      query: ({ id, data }) => ({ url: `/email/campaigns/${id}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EmailCampaign', id }],
    }),

    deleteCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/email/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['EmailCampaign'],
    }),

    sendCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/email/campaigns/${id}/send`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'EmailCampaign', id }],
    }),

    getLists: builder.query<EmailList[], void>({
      query: () => ({ url: '/email/lists', method: 'GET' }),
      providesTags: ['EmailList'],
    }),

    getTemplates: builder.query<EmailTemplate[], void>({
      query: () => ({ url: '/email/templates', method: 'GET' }),
      providesTags: ['EmailTemplate'],
    }),
  }),
})

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useSendCampaignMutation,
  useGetListsQuery,
  useGetTemplatesQuery,
} = emailApi
