import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Phone, MessageSquare, Mail,
  MessageCircle, ChevronDown, ChevronRight,
  Edit, FileText, Zap, BarChart2, Filter,
  Server, Shield, TrendingUp, User, LogOut, Globe,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppSelector } from '../../store/index'
import { selectCurrentUser } from '../../store/slices/authSlice'

const emailSubItems = [
  { to: '/app/email/campagnes', icon: Mail, label: 'Campagnes Email' },
  { to: '/app/email/editeur', icon: Edit, label: 'Éditeur d\'Emails' },
  { to: '/app/email/modeles', icon: FileText, label: 'Modèles d\'Emails' },
  { to: '/app/email/flux', icon: Zap, label: 'Constructeur de Flux - Automatisation' },
  { to: '/app/email/analytics', icon: BarChart2, label: 'Analytics Email' },
  { to: '/app/email/segmentation', icon: Filter, label: 'Segmentation' },
  { to: '/app/email/smtp', icon: Server, label: 'Configuration SMTP' },
  { to: '/app/email/dns', icon: Shield, label: 'Authentification DNS' },
  { to: '/app/email/delivrabilite', icon: TrendingUp, label: 'Délivrabilité' },
]

const topSections = [
  { icon: LayoutDashboard, label: 'Tableau de Bord' },
  { icon: Phone, label: 'Centre d\'Appels' },
  { icon: MessageSquare, label: 'Marketing SMS' },
]

const bottomSections = [
  { icon: MessageCircle, label: 'WhatsApp Business' },
  { icon: Globe, label: 'Frontend Sections' },
]

const WaveIcon = ({ color = 'white' }: { color?: string }) => (
  <div className="flex items-end gap-[2px]">
    {[3, 5, 7, 5, 3].map((h, i) => (
      <div key={i} className="w-[3px] rounded-full" style={{ height: `${h * 2}px`, backgroundColor: color }} />
    ))}
  </div>
)

export default function Sidebar() {
  const [emailOpen, setEmailOpen] = useState(true)
  const { logout } = useAuth()
  const user = useAppSelector(selectCurrentUser)

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[168px] flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-gray-100 px-3">
        <WaveIcon color="#F4511E" />
        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-bold text-[#1F2937]">ACTOR</span>
          <span className="rounded bg-[#F4511E] px-1 py-px text-[8px] font-bold text-white">Hub</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-2">
        {/* Top disabled sections */}
        {topSections.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex cursor-default select-none items-center justify-between px-3 py-2"
          >
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <ChevronRight size={12} className="shrink-0 text-gray-300" />
          </div>
        ))}

        {/* Marketing Email — expandable */}
        <div className="mt-1">
          <button
            onClick={() => setEmailOpen(o => !o)}
            className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-semibold text-[#F4511E] transition-colors hover:bg-orange-50"
          >
            <div className="flex items-center gap-2">
              <Mail size={14} className="shrink-0" />
              <span>Marketing Email</span>
            </div>
            <ChevronDown
              size={12}
              className={`shrink-0 transition-transform duration-200 ${emailOpen ? 'rotate-0' : '-rotate-90'}`}
            />
          </button>

          {emailOpen && (
            <div className="mt-0.5 space-y-px pb-1">
              {emailSubItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] leading-tight transition-colors ${
                      isActive
                        ? 'bg-[#F4511E] font-semibold text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    }`
                  }
                >
                  <Icon size={12} className="shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Bottom disabled sections */}
        {bottomSections.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex cursor-default select-none items-center justify-between px-3 py-2"
          >
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <ChevronRight size={12} className="shrink-0 text-gray-300" />
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="space-y-0.5 border-t border-gray-100 px-2 py-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">
            BS
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[#1F2937]">
              {user?.firstName ?? 'Biar Group'}
            </p>
            <p className="truncate text-[10px] text-gray-400">
              {user?.email ?? 'cccsc@dvdd'}
            </p>
          </div>
        </div>

        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-gray-600 hover:bg-gray-100">
          <User size={12} />
          <span>Mon profil</span>
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-red-500 hover:bg-red-50"
        >
          <LogOut size={12} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
