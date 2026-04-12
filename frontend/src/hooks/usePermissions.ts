import { useAppSelector } from '../store/index'
import { selectCurrentUser } from '../store/slices/authSlice'
import type { UserRole } from '../types/auth.types'

export function usePermissions() {
  const user = useAppSelector(selectCurrentUser)

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const list = Array.isArray(roles) ? roles : [roles]
    return list.includes(user.role)
  }

  const isSuperAdmin = hasRole('super_admin')
  const isAdmin = hasRole(['admin', 'super_admin'])
  const isAgent = hasRole('agent')
  const isSuperviseur = hasRole('superviseur')
  const isClient = hasRole(['client', 'admin', 'super_admin'])

  return { hasRole, isSuperAdmin, isAdmin, isAgent, isSuperviseur, isClient, role: user?.role }
}
