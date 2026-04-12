import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

type Theme = 'dark' | 'light'
type Lang = 'fr' | 'en' | 'ar' | 'es' | 'pt' | 'ru'

interface UiState {
  theme: Theme
  lang: Lang
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
}

const initialState: UiState = {
  theme: 'dark',
  lang: 'fr', // Français par défaut — RDC Congo
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
    },
    setLang(state, action: PayloadAction<Lang>) {
      state.lang = action.payload
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload
    },
    toggleMobileSidebar(state) {
      state.sidebarMobileOpen = !state.sidebarMobileOpen
    },
    closeMobileSidebar(state) {
      state.sidebarMobileOpen = false
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  setLang,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  closeMobileSidebar,
} = uiSlice.actions

export const selectTheme = (state: RootState) => state.ui.theme
export const selectLang = (state: RootState) => state.ui.lang
export const selectSidebarCollapsed = (state: RootState) => state.ui.sidebarCollapsed
export const selectMobileSidebarOpen = (state: RootState) => state.ui.sidebarMobileOpen

export default uiSlice.reducer
