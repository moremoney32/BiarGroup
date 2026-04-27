import { useEffect, useState } from 'react'
import { Search, Sun, Bell, LogOut, Zap, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppSelector } from '../../store/index'
import { selectUnreadCount } from '../../store/slices/notificationSlice'
import { useLocation } from 'react-router-dom'
import apiFetch from '../../services/api'

interface NavbarProps {
  onMenuClick?: () => void
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout } = useAuth()
  const unread = useAppSelector(selectUnreadCount)
  const location = useLocation()
  const [credits, setCredits] = useState<number | null>(null)

  const isEmailSection = location.pathname.startsWith('/app/email')

  const fetchCredits = () => {
    apiFetch.get<{ data: { credits: number } }>('/email/credits')
      .then(r => setCredits(r.data.credits))
      .catch(() => {})
  }

  // Charge au montage et à chaque changement de page dans la section email
  useEffect(() => {
    if (!isEmailSection) return
    fetchCredits()
  }, [isEmailSection, location.pathname])

  // Écoute l'événement déclenché par l'éditeur après un envoi réussi
  useEffect(() => {
    window.addEventListener('email-credits-updated', fetchCredits)
    return () => window.removeEventListener('email-credits-updated', fetchCredits)
  }, [])

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
      {/* Hamburger — mobile seulement */}
      <button
        onClick={onMenuClick}
        className="md:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="relative hidden sm:block flex-1 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full rounded-full bg-[#EDE5F9] py-1.5 pl-8 pr-4 text-[12px] text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#F4511E]/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">

        {/* Compteur crédits email — visible dans toute la section email */}
        {isEmailSection && (
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold mr-1 ${
            credits === null
              ? 'border-gray-100 bg-gray-50 text-gray-400'
              : credits === 0
              ? 'border-red-200 bg-red-50 text-red-600'
              : credits < 10
              ? 'border-orange-200 bg-orange-50 text-orange-600'
              : 'border-[#F4511E]/25 bg-[#FFF7F5] text-[#F4511E]'
          }`}>
            <Zap size={11} />
            {credits === null
              ? 'Crédits...'
              : credits === 0
              ? '0 crédit — recharger'
              : `${credits} crédit${credits !== 1 ? 's' : ''}`
            }
          </div>
        )}

        <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Thème">
          <Sun size={15} />
        </button>

        <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100">
          🇫🇷 <span>FR</span>
        </button>

        <button className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F4511E] text-[8px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Déconnexion"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
