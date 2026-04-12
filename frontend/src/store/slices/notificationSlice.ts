import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number // ms, 0 = persistent
}

interface NotificationState {
  toasts: Notification[]
  unreadCount: number
}

const initialState: NotificationState = {
  toasts: [],
  unreadCount: 0,
}

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<Omit<Notification, 'id'>>) {
      state.toasts.push({
        ...action.payload,
        id: crypto.randomUUID(),
        duration: action.payload.duration ?? 4000,
      })
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    clearToasts(state) {
      state.toasts = []
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },
    decrementUnread(state) {
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    },
  },
})

export const { addToast, removeToast, clearToasts, setUnreadCount, decrementUnread } =
  notificationSlice.actions

export const selectToasts = (state: RootState) => state.notification.toasts
export const selectUnreadCount = (state: RootState) => state.notification.unreadCount

export default notificationSlice.reducer
