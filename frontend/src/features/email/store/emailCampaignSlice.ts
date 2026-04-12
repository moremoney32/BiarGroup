import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface EmailCampaignState {
  activeTab: 'campaigns' | 'templates' | 'lists' | 'smtp'
  editorMode: 'drag-drop' | 'html' | 'text'
}

const initialState: EmailCampaignState = {
  activeTab: 'campaigns',
  editorMode: 'drag-drop',
}

const emailCampaignSlice = createSlice({
  name: 'emailCampaign',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<EmailCampaignState['activeTab']>) {
      state.activeTab = action.payload
    },
    setEditorMode(state, action: PayloadAction<EmailCampaignState['editorMode']>) {
      state.editorMode = action.payload
    },
  },
})

export const { setActiveTab, setEditorMode } = emailCampaignSlice.actions
export default emailCampaignSlice.reducer
