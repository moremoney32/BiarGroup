import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { CallSession, AgentStatus } from '../../types/call.types'

interface CallState {
  activeSessions: CallSession[]
  currentSession: CallSession | null
  agentStatus: AgentStatus
  isSoftphoneOpen: boolean
  isMuted: boolean
  isOnHold: boolean
}

const initialState: CallState = {
  activeSessions: [],
  currentSession: null,
  agentStatus: 'offline',
  isSoftphoneOpen: false,
  isMuted: false,
  isOnHold: false,
}

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    setActiveSessions(state, action: PayloadAction<CallSession[]>) {
      state.activeSessions = action.payload
    },
    setCurrentSession(state, action: PayloadAction<CallSession | null>) {
      state.currentSession = action.payload
    },
    setAgentStatus(state, action: PayloadAction<AgentStatus>) {
      state.agentStatus = action.payload
    },
    toggleSoftphone(state) {
      state.isSoftphoneOpen = !state.isSoftphoneOpen
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted
    },
    toggleHold(state) {
      state.isOnHold = !state.isOnHold
    },
    addSession(state, action: PayloadAction<CallSession>) {
      state.activeSessions.push(action.payload)
    },
    removeSession(state, action: PayloadAction<number>) {
      state.activeSessions = state.activeSessions.filter((s) => s.id !== action.payload)
    },
    updateSession(state, action: PayloadAction<Partial<CallSession> & { id: number }>) {
      const idx = state.activeSessions.findIndex((s) => s.id === action.payload.id)
      if (idx !== -1) Object.assign(state.activeSessions[idx], action.payload)
    },
  },
})

export const {
  setActiveSessions,
  setCurrentSession,
  setAgentStatus,
  toggleSoftphone,
  toggleMute,
  toggleHold,
  addSession,
  removeSession,
  updateSession,
} = callSlice.actions

export const selectActiveSessions = (state: RootState) => state.call.activeSessions
export const selectCurrentSession = (state: RootState) => state.call.currentSession
export const selectAgentStatus = (state: RootState) => state.call.agentStatus
export const selectIsSoftphoneOpen = (state: RootState) => state.call.isSoftphoneOpen

export default callSlice.reducer
