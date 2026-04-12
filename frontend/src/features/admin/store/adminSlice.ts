import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AdminTab = 'tenants' | 'users' | 'stats' | 'api-keys' | 'audit'

interface AdminState {
  activeTab: AdminTab
  selectedTenantId: number | null
}

const initialState: AdminState = {
  activeTab: 'tenants',
  selectedTenantId: null,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<AdminTab>) {
      state.activeTab = action.payload
    },
    setSelectedTenant(state, action: PayloadAction<number | null>) {
      state.selectedTenantId = action.payload
    },
  },
})

export const { setActiveTab, setSelectedTenant } = adminSlice.actions
export default adminSlice.reducer
