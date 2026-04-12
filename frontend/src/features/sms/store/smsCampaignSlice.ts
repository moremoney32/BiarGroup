import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SmsCampaignState {
  activeTab: 'campaigns' | 'messages' | 'templates' | 'otp'
  draftCampaignId: number | null
}

const initialState: SmsCampaignState = {
  activeTab: 'campaigns',
  draftCampaignId: null,
}

const smsCampaignSlice = createSlice({
  name: 'smsCampaign',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<SmsCampaignState['activeTab']>) {
      state.activeTab = action.payload
    },
    setDraftCampaign(state, action: PayloadAction<number | null>) {
      state.draftCampaignId = action.payload
    },
  },
})

export const { setActiveTab, setDraftCampaign } = smsCampaignSlice.actions
export default smsCampaignSlice.reducer
