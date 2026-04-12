import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/index'
import { removeToast, selectToasts, type Notification } from '../../store/slices/notificationSlice'

const icons = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  info: <Info size={16} className="text-blue-400" />,
}

function Toast({ toast }: { toast: Notification }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!toast.duration) return
    const t = setTimeout(() => dispatch(removeToast(toast.id)), toast.duration)
    return () => clearTimeout(t)
  }, [toast, dispatch])

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex w-80 items-start gap-3 rounded-xl border border-white/10 bg-[#1a1a2e] p-4 shadow-2xl"
    >
      <span className="mt-0.5 shrink-0">{icons[toast.type]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs text-white/50">{toast.message}</p>}
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="shrink-0 text-white/30 hover:text-white"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

export default function ToastContainer() {
  const toasts = useAppSelector(selectToasts)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}
