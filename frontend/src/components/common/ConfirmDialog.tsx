import Modal from './Modal'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmer', variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
          variant === 'danger' ? 'bg-red-500/15' : 'bg-yellow-500/15'
        }`}>
          <AlertTriangle size={22} className={variant === 'danger' ? 'text-red-400' : 'text-yellow-400'} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/50">{description}</p>
        </div>
        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Annuler
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            {loading ? '...' : confirmLabel}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
}
