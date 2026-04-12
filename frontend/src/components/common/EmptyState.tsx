import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          <Icon size={24} className="text-white/30" />
        </div>
      )}
      <h3 className="mb-1 text-base font-medium text-white/80">{title}</h3>
      {description && <p className="mb-4 max-w-xs text-sm text-white/40">{description}</p>}
      {action}
    </div>
  )
}
