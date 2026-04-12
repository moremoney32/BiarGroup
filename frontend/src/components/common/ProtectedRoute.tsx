import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../store/index'
import { selectIsAuthenticated, selectCurrentUser } from '../../store/slices/authSlice'
import type { UserRole } from '../../types/auth.types'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()

  if (!isAuthenticated) {
    // Mémorise la page demandée pour rediriger après login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/app/email/campagnes" replace />
  }

  return <>{children}</>
}
