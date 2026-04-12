import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { User } from '../../types/auth.types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
    },
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setCredentials, updateAccessToken, logout, setLoading } = authSlice.actions

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAccessToken = (state: RootState) => state.auth.accessToken
export const selectAuthLoading = (state: RootState) => state.auth.isLoading

export default authSlice.reducer
