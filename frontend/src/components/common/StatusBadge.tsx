type Status = 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused' | 'failed' |
              'active' | 'inactive' | 'pending' | 'approved' | 'rejected' |
              'available' | 'busy' | 'offline'

const styles: Record<Status, string> = {
  draft: 'bg-white/10 text-white/60',
  scheduled: 'bg-blue-500/20 text-blue-400',
  sending: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  available: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-orange-500/20 text-orange-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  busy: 'bg-orange-500/20 text-orange-400',
  failed: 'bg-red-500/20 text-red-400',
  inactive: 'bg-red-500/20 text-red-400',
  rejected: 'bg-red-500/20 text-red-400',
  offline: 'bg-white/10 text-white/40',
}

const labels: Record<Status, string> = {
  draft: 'Brouillon', scheduled: 'Planifié', sending: 'En cours',
  completed: 'Terminé', active: 'Actif', approved: 'Approuvé',
  available: 'Disponible', paused: 'Pausé', pending: 'En attente',
  busy: 'Occupé', failed: 'Échoué', inactive: 'Inactif',
  rejected: 'Rejeté', offline: 'Hors ligne',
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]} ${className}`}>
      {labels[status]}
    </span>
  )
}
