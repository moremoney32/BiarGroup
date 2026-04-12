import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../services/api'
import type { SmsCampaign, SmsTemplate, SmsMessage } from '../../types/sms.types'
import type { PaginatedResponse, PaginationQuery } from '../../types/api.types'

export const smsApi = createApi({
  reducerPath: 'smsApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['SmsCampaign', 'SmsTemplate', 'SmsMessage'],
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<SmsCampaign>, PaginationQuery>({
      query: (params) => ({ url: '/sms/campaigns', method: 'GET', params }),
      providesTags: ['SmsCampaign'],
    }),

    getCampaign: builder.query<SmsCampaign, number>({
      query: (id) => ({ url: `/sms/campaigns/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'SmsCampaign', id }],
    }),

    createCampaign: builder.mutation<SmsCampaign, Partial<SmsCampaign>>({
      query: (body) => ({ url: '/sms/campaigns', method: 'POST', data: body }),
      invalidatesTags: ['SmsCampaign'],
    }),

    updateCampaign: builder.mutation<SmsCampaign, { id: number; data: Partial<SmsCampaign> }>({
      query: ({ id, data }) => ({ url: `/sms/campaigns/${id}`, method: 'PUT', data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SmsCampaign', id }],
    }),

    deleteCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/sms/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['SmsCampaign'],
    }),

    sendCampaign: builder.mutation<void, number>({
      query: (id) => ({ url: `/sms/campaigns/${id}/send`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'SmsCampaign', id }],
    }),

    getTemplates: builder.query<SmsTemplate[], void>({
      query: () => ({ url: '/sms/templates', method: 'GET' }),
      providesTags: ['SmsTemplate'],
    }),

    getMessages: builder.query<PaginatedResponse<SmsMessage>, PaginationQuery>({
      query: (params) => ({ url: '/sms/messages', method: 'GET', params }),
      providesTags: ['SmsMessage'],
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
  useGetMessagesQuery,
} = smsApi
