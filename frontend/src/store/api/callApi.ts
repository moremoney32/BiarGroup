import { createApi } from '@reduxjs/toolkit/query/react'
import { axiosBaseQuery } from '../../services/api'
import type { CallSession, Agent, CallQueue, SviConfig } from '../../types/call.types'
import type { PaginatedResponse, PaginationQuery } from '../../types/api.types'

export const callApi = createApi({
  reducerPath: 'callApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['CallSession', 'Agent', 'Queue', 'SviConfig'],
  endpoints: (builder) => ({
    getSessions: builder.query<PaginatedResponse<CallSession>, PaginationQuery>({
      query: (params) => ({ url: '/calls/sessions', method: 'GET', params }),
      providesTags: ['CallSession'],
    }),

    getAgents: builder.query<Agent[], void>({
      query: () => ({ url: '/calls/agents', method: 'GET' }),
      providesTags: ['Agent'],
    }),

    updateAgentStatus: builder.mutation<void, { id: number; status: Agent['status'] }>({
      query: ({ id, status }) => ({ url: `/calls/agents/${id}/status`, method: 'PATCH', data: { status } }),
      invalidatesTags: ['Agent'],
    }),

    getQueues: builder.query<CallQueue[], void>({
      query: () => ({ url: '/calls/queues', method: 'GET' }),
      providesTags: ['Queue'],
    }),

    getSviConfigs: builder.query<SviConfig[], void>({
      query: () => ({ url: '/calls/svi', method: 'GET' }),
      providesTags: ['SviConfig'],
    }),

    createSviConfig: builder.mutation<SviConfig, Partial<SviConfig>>({
      query: (body) => ({ url: '/calls/svi', method: 'POST', data: body }),
      invalidatesTags: ['SviConfig'],
    }),

    initiateCall: builder.mutation<CallSession, { from: string; to: string }>({
      query: (body) => ({ url: '/calls/sessions/initiate', method: 'POST', data: body }),
      invalidatesTags: ['CallSession'],
    }),

    hangupCall: builder.mutation<void, number>({
      query: (id) => ({ url: `/calls/sessions/${id}/hangup`, method: 'POST' }),
      invalidatesTags: ['CallSession'],
    }),
  }),
})

export const {
  useGetSessionsQuery,
  useGetAgentsQuery,
  useUpdateAgentStatusMutation,
  useGetQueuesQuery,
  useGetSviConfigsQuery,
  useCreateSviConfigMutation,
  useInitiateCallMutation,
  useHangupCallMutation,
} = callApi
