import PageTransition from '../../../components/animations/PageTransition'
import { usePermissions } from '../../../hooks/usePermissions'
import { Navigate } from 'react-router-dom'

export default function AdminPage() {
  const { isSuperAdmin } = usePermissions()

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Administration — Super Admin</h1>
        {/* TODO: tenants, utilisateurs, stats globales, API keys, audit logs */}
      </div>
    </PageTransition>
  )
}
