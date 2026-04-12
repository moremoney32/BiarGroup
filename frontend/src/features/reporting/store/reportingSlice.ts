import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ReportFilter } from '../types/index'

interface ReportingState {
  filter: ReportFilter
  activeTab: 'dashboard' | 'calls' | 'sms' | 'email' | 'whatsapp' | 'audit'
}

const today = new Date().toISOString().split('T')[0]
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

const initialState: ReportingState = {
  filter: { from: weekAgo, to: today, module: 'all' },
  activeTab: 'dashboard',
}

const reportingSlice = createSlice({
  name: 'reporting',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<Partial<ReportFilter>>) {
      state.filter = { ...state.filter, ...action.payload }
    },
    setActiveTab(state, action: PayloadAction<ReportingState['activeTab']>) {
      state.activeTab = action.payload
    },
  },
})

export const { setFilter, setActiveTab } = reportingSlice.actions
export default reportingSlice.reducer
