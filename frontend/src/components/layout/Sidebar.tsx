import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Phone, MessageSquare, Mail,
  MessageCircle, ChevronDown, ChevronRight,
  Edit, FileText, Zap, BarChart2, Filter,
  Server, Shield, TrendingUp, User, LogOut, Globe, X,
  Send, Users, List, Calendar, Tag, Star, Settings, Link, Code,
  Activity, CreditCard, Clock, Search, CheckCircle, Wallet,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppSelector } from '../../store/index'
import { selectCurrentUser } from '../../store/slices/authSlice'

// ── Données nav ────────────────────────────────────────────────

type NavItem = { to: string; icon: LucideIcon; label: string }

const smsSubItems: NavItem[] = [
  { to: '/app/sms/unique',             icon: Send,          label: 'SMS Unique' },
  { to: '/app/sms/masse',              icon: MessageSquare, label: 'SMS en Masse' },
  { to: '/app/sms/rapports',           icon: BarChart2,     label: 'Rapports Campagnes' },
  { to: '/app/sms/modeles',            icon: FileText,      label: 'Modèles SMS' },
  { to: '/app/sms/contacts',           icon: Users,         label: 'Gestion Contacts' },
  { to: '/app/sms/listes',             icon: List,          label: 'Gestion des Listes' },
  { to: '/app/sms/programmes',         icon: Calendar,      label: 'Messages Programmés' },
  { to: '/app/sms/analytics',          icon: BarChart2,     label: 'Analytics SMS' },
  { to: '/app/sms/identifiants',       icon: Tag,           label: 'Identifiants Expéditeur' },
  { to: '/app/sms/a2p',                icon: Zap,           label: 'SMS A2P' },
  { to: '/app/sms/rcs',                icon: Star,          label: 'Messages RCS' },
  { to: '/app/sms/configuration-rcs',  icon: Settings,      label: 'Configuration RCS' },
  { to: '/app/sms/reducteur-url',      icon: Link,          label: "Réducteur d'URL" },
  { to: '/app/sms/documentation-api',  icon: Code,          label: 'Documentation API' },
]

const analyticsSubItems: NavItem[] = [
  { to: '/app/sms/analytics-rapports',     icon: BarChart2,   label: 'Rapports SMS' },
  { to: '/app/sms/analytics-historique',   icon: Clock,       label: 'Historique' },
  { to: '/app/sms/analytics-transactions', icon: CreditCard,  label: 'Transactions' },
  { to: '/app/sms/analytics-dlr',          icon: CheckCircle, label: 'Rapport DLR' },
  { to: '/app/sms/trafic-client',          icon: Activity,    label: 'Trafic Client' },
]

const outilsSubItems: NavItem[] = [
  { to: '/app/sms/tarifs-couverture', icon: Globe, label: 'Tarifs & Couverture' },
]

const techniqueSubItems: NavItem[] = [
  { to: '/app/sms/credits',    icon: Wallet, label: 'Crédits Compte' },
  { to: '/app/sms/hlr-lookup', icon: Search, label: 'HLR Lookup' },
]

const emailSubItems: NavItem[] = [
  { to: '/app/email/campagnes',     icon: Mail,       label: 'Campagnes Email' },
  { to: '/app/email/editeur',       icon: Edit,       label: "Éditeur d'Emails" },
  { to: '/app/email/modeles',       icon: FileText,   label: "Modèles d'Emails" },
  { to: '/app/email/flux',          icon: Zap,        label: 'Constructeur de Flux' },
  { to: '/app/email/analytics',     icon: BarChart2,  label: 'Analytics Email' },
  { to: '/app/email/segmentation',  icon: Filter,     label: 'Segmentation' },
  { to: '/app/email/smtp',          icon: Server,     label: 'Configuration SMTP' },
  { to: '/app/email/dns',           icon: Shield,     label: 'Authentification DNS' },
  { to: '/app/email/delivrabilite', icon: TrendingUp, label: 'Délivrabilité' },
]

// ── Composants statiques (hors Sidebar = référence stable) ─────

const WaveIcon = ({ color = 'white' }: { color?: string }) => (
  <div className="flex items-end gap-[2px]">
    {[3, 5, 7, 5, 3].map((h, i) => (
      <div key={i} className="w-[3px] rounded-full" style={{ height: `${h * 2}px`, backgroundColor: color }} />
    ))}
  </div>
)

// Rendu des sous-liens (hors Sidebar = référence stable)
function NavSubItems({ items }: { items: NavItem[] }) {
  return (
    <div className="mt-0.5 space-y-px pb-1">
      {items.map(({ to, icon: Icon, label }) => (
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
  )
}

// ── Sidebar ────────────────────────────────────────────────────

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const location = useLocation()
  const onSmsRoute       = location.pathname.startsWith('/app/sms')
  const onEmailRoute     = location.pathname.startsWith('/app/email')
  const onAnalyticsRoute = /\/app\/sms\/(analytics-|trafic-client)/.test(location.pathname)
  const onOutilsRoute    = location.pathname.includes('/app/sms/tarifs-couverture')
  const onTechRoute      = /\/app\/sms\/(credits|hlr-lookup)/.test(location.pathname)

  const [smsOpen,       setSmsOpen]       = useState(onSmsRoute && !onAnalyticsRoute && !onOutilsRoute && !onTechRoute)
  const [emailOpen,     setEmailOpen]     = useState(onEmailRoute || (!onSmsRoute && !onAnalyticsRoute && !onOutilsRoute && !onTechRoute))
  const [analyticsOpen, setAnalyticsOpen] = useState(onAnalyticsRoute)
  const [outilsOpen,    setOutilsOpen]    = useState(onOutilsRoute)
  const [techniqueOpen, setTechniqueOpen] = useState(onTechRoute)

  const { logout } = useAuth()
  const user = useAppSelector(selectCurrentUser)

  // Ferme tout sauf la section cliquée, la toggle elle-même
  const handleToggle = (which: 'sms' | 'email' | 'analytics' | 'outils' | 'technique') => {
    setSmsOpen(which === 'sms' ? s => !s : false)
    setEmailOpen(which === 'email' ? s => !s : false)
    setAnalyticsOpen(which === 'analytics' ? s => !s : false)
    setOutilsOpen(which === 'outils' ? s => !s : false)
    setTechniqueOpen(which === 'technique' ? s => !s : false)
  }

  // Helper inline — pas un composant React, juste du JSX
  const accordionBtn = (
    which: 'sms' | 'email' | 'analytics' | 'outils' | 'technique',
    Icon: LucideIcon,
    label: string,
    isOpen: boolean
  ) => (
    <button
      key={which}
      onClick={() => handleToggle(which)}
      className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-semibold text-[#F4511E] transition-colors hover:bg-orange-50"
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="shrink-0" />
        <span>{label}</span>
      </div>
      <ChevronDown
        size={12}
        className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
      />
    </button>
  )

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-full w-[168px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo */}
      <div className="relative flex h-14 items-center gap-2 border-b border-gray-100 px-3">
        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 md:hidden"
          aria-label="Fermer le menu"
        >
          <X size={12} />
        </button>
        <WaveIcon color="#F4511E" />
        <div className="flex items-baseline gap-1">
          <span className="text-[13px] font-bold text-[#1F2937]">ACTOR</span>
          <span className="rounded bg-[#F4511E] px-1 py-px text-[8px] font-bold text-white">Hub</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-2">
        {/* Sections désactivées haut */}
        {([
          { icon: LayoutDashboard, label: "Tableau de Bord" },
          { icon: Phone,           label: "Centre d'Appels" },
        ] as { icon: LucideIcon; label: string }[]).map(({ icon: Icon, label }) => (
          <div key={label} className="flex cursor-default select-none items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <ChevronRight size={12} className="shrink-0 text-gray-300" />
          </div>
        ))}

        {/* Marketing SMS */}
        <div className="mt-1">
          {accordionBtn('sms', MessageSquare, 'Marketing SMS', smsOpen)}
          {smsOpen && <NavSubItems items={smsSubItems} />}
        </div>

        {/* Analytics SMS */}
        <div className="mt-1">
          {accordionBtn('analytics', BarChart2, 'Analytics SMS', analyticsOpen)}
          {analyticsOpen && <NavSubItems items={analyticsSubItems} />}
        </div>

        {/* Outils SMS */}
        <div className="mt-1">
          {accordionBtn('outils', Settings, 'Outils SMS', outilsOpen)}
          {outilsOpen && <NavSubItems items={outilsSubItems} />}
        </div>

        {/* SMS Technique */}
        <div className="mt-1">
          {accordionBtn('technique', Code, 'SMS Technique', techniqueOpen)}
          {techniqueOpen && <NavSubItems items={techniqueSubItems} />}
        </div>

        {/* Marketing Email */}
        <div className="mt-1">
          {accordionBtn('email', Mail, 'Marketing Email', emailOpen)}
          {emailOpen && <NavSubItems items={emailSubItems} />}
        </div>

        {/* Sections désactivées bas */}
        {([
          { icon: MessageCircle, label: 'WhatsApp Business' },
          { icon: Globe,         label: 'Frontend Sections' },
        ] as { icon: LucideIcon; label: string }[]).map(({ icon: Icon, label }) => (
          <div key={label} className="flex cursor-default select-none items-center justify-between px-3 py-2">
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
              {user?.email ?? 'biargroup@sbs'}
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
