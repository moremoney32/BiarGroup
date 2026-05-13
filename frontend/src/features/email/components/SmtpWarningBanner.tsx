import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import { emailService } from '../../../services/email.service'

export default function SmtpWarningBanner() {
  const navigate = useNavigate()
  const [show, setShow]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Ne pas re-fetcher si déjà fermé par l'user dans cette session
    if (sessionStorage.getItem('smtp_banner_dismissed') === '1') return

    emailService.getSmtpConfigs()
      .then(configs => {
        const hasActive = configs.some(c => c.is_default && c.is_verified)
        setShow(!hasActive)
      })
      .catch(() => {}) // silencieux — pas critique
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('smtp_banner_dismissed', '1')
    setDismissed(true)
  }

  if (!show || dismissed) return null

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <AlertTriangle size={16} className="shrink-0 text-orange-500" />
        <div>
          <p className="text-[13px] font-semibold text-orange-800">
            Aucun SMTP configuré
          </p>
          <p className="text-[12px] text-orange-600">
            Vos emails partent via le SMTP système BIAR. Configurez votre propre serveur pour envoyer depuis votre domaine.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/email/smtp')}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-orange-600"
        >
          Configurer <ArrowRight size={11} />
        </button>
        <button
          onClick={dismiss}
          className="rounded-full p-1 text-orange-400 hover:bg-orange-100"
          title="Fermer"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
