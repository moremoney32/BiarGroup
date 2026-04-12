import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface BillingState {
  activeTab: 'plans' | 'subscription' | 'invoices' | 'payment'
}

const initialState: BillingState = {
  activeTab: 'plans',
}

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<BillingState['activeTab']>) {
      state.activeTab = action.payload
    },
  },
})

export const { setActiveTab } = billingSlice.actions
export default billingSlice.reducer
