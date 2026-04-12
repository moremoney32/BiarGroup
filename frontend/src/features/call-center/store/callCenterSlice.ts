import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../../store/index'

interface CallCenterState {
  activeTab: 'live' | 'history' | 'agents' | 'queues' | 'svi'
  selectedAgentId: number | null
  selectedQueueId: number | null
}

const initialState: CallCenterState = {
  activeTab: 'live',
  selectedAgentId: null,
  selectedQueueId: null,
}

const callCenterSlice = createSlice({
  name: 'callCenter',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<CallCenterState['activeTab']>) {
      state.activeTab = action.payload
    },
    setSelectedAgent(state, action: PayloadAction<number | null>) {
      state.selectedAgentId = action.payload
    },
    setSelectedQueue(state, action: PayloadAction<number | null>) {
      state.selectedQueueId = action.payload
    },
  },
})

export const { setActiveTab, setSelectedAgent, setSelectedQueue } = callCenterSlice.actions
export const selectCallCenterTab = (state: RootState) => state.call.agentStatus
export default callCenterSlice.reducer
