import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

// Styles par type
const styles = {
  success: {
    icon: <CheckCircle size={18} className="shrink-0" style={{ color: '#22c55e' }} />,
    borderColor: '#22c55e',
    iconBg: '#dcfce7',
  },
  error: {
    icon: <XCircle size={18} className="shrink-0" style={{ color: '#ef4444' }} />,
    borderColor: '#ef4444',
    iconBg: '#fee2e2',
  },
  warning: {
    icon: <AlertTriangle size={18} className="shrink-0" style={{ color: '#f97316' }} />,
    borderColor: '#f97316',
    iconBg: '#ffedd5',
  },
  info: {
    icon: <Info size={18} className="shrink-0" style={{ color: '#3b82f6' }} />,
    borderColor: '#3b82f6',
    iconBg: '#dbeafe',
  },
}

type ToastType = keyof typeof styles

function toastContent(message: string, type: ToastType) {
  const s = styles[type]
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: s.iconBg }}
      >
        {s.icon}
      </span>
      <p className="text-[13px] font-medium text-[#1a0033]">{message}</p>
    </div>
  )
}

const baseStyle = {
  borderRadius: '12px',
  padding: '12px 14px',
  background: '#ffffff',
  boxShadow: '0 4px 24px rgba(59, 47, 143, 0.12)',
  maxWidth: '360px',
  minWidth: '280px',
}

export const showToast = {
  success: (message: string) =>
    toast(toastContent(message, 'success'), {
      style: { ...baseStyle, borderLeft: '4px solid #22c55e' },
      duration: 4000,
    }),

  error: (message: string) =>
    toast(toastContent(message, 'error'), {
      style: { ...baseStyle, borderLeft: '4px solid #ef4444' },
      duration: 5000,
    }),

  warning: (message: string) =>
    toast(toastContent(message, 'warning'), {
      style: { ...baseStyle, borderLeft: '4px solid #f97316' },
      duration: 4500,
    }),

  info: (message: string) =>
    toast(toastContent(message, 'info'), {
      style: { ...baseStyle, borderLeft: '4px solid #3b82f6' },
      duration: 4000,
    }),
}

// Toaster à monter dans App.tsx
export function BiarToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        style: baseStyle,
      }}
    />
  )
}
