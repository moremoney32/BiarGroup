import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import authReducer from './slices/authSlice'
import callReducer from './slices/callSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'
import { smsApi } from './api/smsApi'
import { callApi } from './api/callApi'
import { emailApi } from './api/emailApi'
import { whatsappApi } from './api/whatsappApi'
import { contactApi } from './api/contactApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    call: callReducer,
    notification: notificationReducer,
    ui: uiReducer,
    [smsApi.reducerPath]: smsApi.reducer,
    [callApi.reducerPath]: callApi.reducer,
    [emailApi.reducerPath]: emailApi.reducer,
    [whatsappApi.reducerPath]: whatsappApi.reducer,
    [contactApi.reducerPath]: contactApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      smsApi.middleware,
      callApi.middleware,
      emailApi.middleware,
      whatsappApi.middleware,
      contactApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks — utiliser partout à la place de useDispatch/useSelector bruts
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
