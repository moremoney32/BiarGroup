import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface WhatsappState {
  activeTab: 'campaigns' | 'templates' | 'contacts' | 'chatbot'
}

const initialState: WhatsappState = {
  activeTab: 'campaigns',
}

const whatsappSlice = createSlice({
  name: 'whatsapp',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<WhatsappState['activeTab']>) {
      state.activeTab = action.payload
    },
  },
})

export const { setActiveTab } = whatsappSlice.actions
export default whatsappSlice.reducer
