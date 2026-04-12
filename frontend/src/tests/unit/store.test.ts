import { store } from '../../store/index'
import { setCredentials, logout, selectIsAuthenticated } from '../../store/slices/authSlice'
import { addToast, removeToast, selectToasts } from '../../store/slices/notificationSlice'
import { toggleSidebar, selectSidebarCollapsed } from '../../store/slices/uiSlice'

describe('authSlice', () => {
  it('initial state — non authentifié', () => {
    expect(selectIsAuthenticated(store.getState())).toBe(false)
  })

  it('setCredentials — authentifie l utilisateur', () => {
    store.dispatch(setCredentials({
      user: { id: 1, tenantId: 1, email: 'test@test.com', firstName: 'Test', lastName: 'User', phone: null, role: 'admin', isActive: true, emailVerifiedAt: null, createdAt: '' },
      accessToken: 'fake-token',
    }))
    expect(selectIsAuthenticated(store.getState())).toBe(true)
  })

  it('logout — réinitialise l état', () => {
    store.dispatch(logout())
    expect(selectIsAuthenticated(store.getState())).toBe(false)
  })
})

describe('notificationSlice', () => {
  it('addToast — ajoute une notification', () => {
    store.dispatch(addToast({ type: 'success', title: 'Test' }))
    expect(selectToasts(store.getState()).length).toBeGreaterThan(0)
  })
})

describe('uiSlice', () => {
  it('toggleSidebar — inverse l état', () => {
    const before = selectSidebarCollapsed(store.getState())
    store.dispatch(toggleSidebar())
    expect(selectSidebarCollapsed(store.getState())).toBe(!before)
  })
})
