import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Send, Phone, MessageSquare, CheckCircle2, Users,
  ChevronRight, Zap, BarChart2, Loader2, Eye,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsAnalyticsOverview } from '../../../types/sms.types'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
}

export default function SmsDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState<SmsAnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    smsService.getAnalyticsOverview()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const kpiCards = [
    {
      icon: Send,         iconBg: '#EFF6FF', iconColor: '#3B82F6',
      label: 'Messages Envoyés',
      value: loading ? '…' : (stats?.totalSent ?? 0).toLocaleString('fr-FR'),
    },
    {
      icon: Zap,          iconBg: '#FFF7ED', iconColor: '#F97316',
      label: 'Campagnes Actives',
      value: loading ? '…' : String(stats?.activeCampaigns ?? 0),
    },
    {
      icon: CheckCircle2, iconBg: '#F0FDF4', iconColor: '#22C55E',
      label: 'Taux Délivrabilité',
      value: loading ? '…' : `${stats?.deliveryRate ?? 0}%`,
    },
    {
      icon: Users,        iconBg: '#F5F3FF', iconColor: '#8B5CF6',
      label: 'Utilisateurs Actifs',
      value: loading ? '…' : (stats?.totalContacts ?? 0).toLocaleString('fr-FR'),
    },
  ]

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 py-5">

        {/* Header */}
        <motion.div className="mb-6" variants={fadeUp} initial="initial" animate="animate">
          <h1 className="text-[22px] font-bold text-[#1F2937]">Tableau de Bord</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Vue d'ensemble de votre plateforme ACTOR Hub</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={stagger} initial="initial" animate="animate"
        >
          {kpiCards.map(({ icon: Icon, iconBg, iconColor, label, value }) => (
            <motion.div key={label} variants={fadeUp} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-gray-500">{label}</p>
                  <p className="mt-1 text-[22px] font-bold text-[#1F2937]">{value}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
                  {loading
                    ? <Loader2 size={15} className="animate-spin text-gray-300" />
                    : <Icon size={18} style={{ color: iconColor }} />}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Banner Prototypage Intelligent */}
        <motion.div
          className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#0D9488] p-5"
          variants={fadeUp} initial="initial" animate="animate"
          transition={{ delay: 0.25 }}
        >
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
              <button
                onClick={() => navigate('/app/sms/analytics')}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/25"
              >
                Analytics
              </button>
              <button
                onClick={() => navigate('/app/sms/analytics')}
                aria-label="Voir les détails"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
              >
                <Eye size={13} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Module Cards */}
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          variants={stagger} initial="initial" animate="animate"
        >

          {/* Call Center */}
          <motion.div variants={fadeUp} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
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
                { label: 'Appels entrants', value: '—' },
                { label: 'Appels sortants', value: '—' },
                { label: 'Agents actifs', value: '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SMS Bulk */}
          <motion.div variants={fadeUp} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
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
                { label: 'SMS envoyés',       value: loading ? '…' : (stats?.totalSent ?? 0).toLocaleString('fr-FR') },
                { label: 'Délivrabilité',     value: loading ? '…' : `${stats?.deliveryRate ?? 0}%` },
                { label: 'Campagnes actives', value: loading ? '…' : String(stats?.activeCampaigns ?? 0) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>

      </div>
      <DashboardFooter />
    </div>
  )
}
