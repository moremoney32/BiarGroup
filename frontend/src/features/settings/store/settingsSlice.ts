import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type SettingsTab = 'profile' | 'security' | 'smtp' | 'smpp' | 'api-keys' | 'notifications' | 'integrations'

interface SettingsState {
  activeTab: SettingsTab
}

const initialState: SettingsState = {
  activeTab: 'profile',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<SettingsTab>) {
      state.activeTab = action.payload
    },
  },
})

export const { setActiveTab } = settingsSlice.actions
export default settingsSlice.reducer
