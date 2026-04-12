import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../services/api'
import type { WaCampaign, WaTemplate, WaMessage } from '../../types/whatsapp.types'
import type { PaginatedResponse, PaginationQuery } from '../../types/api.types'

export const whatsappApi = createApi({
  reducerPath: 'whatsappApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['WaCampaign', 'WaTemplate', 'WaMessage'],
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<WaCampaign>, PaginationQuery>({
      query: (params) => ({ url: '/whatsapp/campaigns', method: 'GET', params }),
      providesTags: ['WaCampaign'],
    }),

    getCampaign: builder.query<WaCampaign, number>({
      query: (id) => ({ url: `/whatsapp/campaigns/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'WaCampaign', id }],
    }),

    createCampaign: builder.mutation<WaCampaign, Partial<WaCampaign>>({
      query: (body) => ({ url: '/whatsapp/campaigns', method: 'POST', data: body }),
      invalidatesTags: ['WaCampaign'],
    }),

    updateCampaign: builder.mutation<WaCampaign, { id: number; data: Partial<WaCampaign> }>({
      query: ({ id, data }) => ({ url: `/whatsapp/campaigns/${id}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WaCampaign', id }],
    }),

    deleteCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/whatsapp/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WaCampaign'],
    }),

    sendCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/whatsapp/campaigns/${id}/send`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'WaCampaign', id }],
    }),

    getTemplates: builder.query<WaTemplate[], void>({
      query: () => ({ url: '/whatsapp/templates', method: 'GET' }),
      providesTags: ['WaTemplate'],
    }),

    syncTemplates: builder.mutation<void, void>({
      query: () => ({ url: '/whatsapp/templates/sync', method: 'POST' }),
      invalidatesTags: ['WaTemplate'],
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
  useGetTemplatesQuery,
  useSyncTemplatesMutation,
} = whatsappApi
