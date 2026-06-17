import { useNavigate } from 'react-router-dom'
import {
  Send, Phone, MessageSquare, CheckCircle2, Users,
  ChevronRight, Zap, BarChart2,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const kpiCards = [
  {
    icon: Send,
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    label: 'Messages Envoyés',
    value: '89.2K',
    trend: '+1.3%',
    trendUp: true,
  },
  {
    icon: Zap,
    iconBg: '#FFF7ED',
    iconColor: '#F97316',
    label: 'Campagnes Actives',
    value: '24',
    trend: '+0.9%',
    trendUp: true,
  },
  {
    icon: CheckCircle2,
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
    label: 'Taux Délivrabilité',
    value: '98.4%',
    trend: '+0.4%',
    trendUp: true,
  },
  {
    icon: Users,
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    label: 'Utilisateurs Actifs',
    value: '2,350',
    trend: '+0.5%',
    trendUp: true,
  },
]

export default function SmsDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1F2937]">Tableau de Bord</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Vue d'ensemble de votre plateforme ACTOR Hub</p>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpiCards.map(({ icon: Icon, iconBg, iconColor, label, value, trend, trendUp }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon size={18} style={{ color: iconColor }} />
                </div>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: trendUp ? '#22C55E' : '#EF4444' }}
                >
                  {trend} ↑
                </span>
              </div>
              <p className="text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Banner Prototypage Intelligent */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F4511E] to-[#3B2F8F] p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Zap size={20} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-white">Prototypage Intelligent</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    NOUVEAU
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/75">
                  Explorez les 150+ modules de la plateforme • Catalogue complet • Statistiques • Démo automatique
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5">
                <BarChart2 size={13} className="text-white" />
                <span className="text-[11px] font-semibold text-white">150+ Modules</span>
              </div>
              <button className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]">
                U Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Call Center */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
                  <Phone size={18} className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1F2937]">Call Center</p>
                  <p className="text-[11px] text-gray-500">Centre d'appels en direct</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/call-center')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] hover:underline"
              >
                Voir détails <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex items-center gap-6">
              {[
                { label: 'Appels entrants', value: '89' },
                { label: 'Agents actifs', value: '89' },
                { label: 'En attente', value: '12' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Bulk */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED]">
                  <MessageSquare size={18} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1F2937]">SMS Bulk</p>
                  <p className="text-[11px] text-gray-500">Campagnes SMS en masse</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/sms/masse')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#F97316] hover:underline"
              >
                Voir détails <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex items-center gap-6">
              {[
                { label: 'SMS envoyés', value: '124K' },
                { label: 'Délivrabilité', value: '98.9%' },
                { label: 'Campagnes actives', value: '8' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      <DashboardFooter />
    </div>
  )
}
