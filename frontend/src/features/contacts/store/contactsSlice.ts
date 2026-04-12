import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ContactsState {
  selectedIds: number[]
  activeListId: number | null
  viewMode: 'table' | 'grid'
}

const initialState: ContactsState = {
  selectedIds: [],
  activeListId: null,
  viewMode: 'table',
}

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    toggleSelected(state, action: PayloadAction<number>) {
      const idx = state.selectedIds.indexOf(action.payload)
      if (idx === -1) state.selectedIds.push(action.payload)
      else state.selectedIds.splice(idx, 1)
    },
    selectAll(state, action: PayloadAction<number[]>) {
      state.selectedIds = action.payload
    },
    clearSelection(state) {
      state.selectedIds = []
    },
    setActiveList(state, action: PayloadAction<number | null>) {
      state.activeListId = action.payload
    },
    setViewMode(state, action: PayloadAction<ContactsState['viewMode']>) {
      state.viewMode = action.payload
    },
  },
})

export const { toggleSelected, selectAll, clearSelection, setActiveList, setViewMode } = contactsSlice.actions
export default contactsSlice.reducer
