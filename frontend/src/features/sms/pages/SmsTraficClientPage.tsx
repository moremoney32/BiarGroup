import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import {
  Users, TrendingUp, UserCheck, UserPlus, Download, Activity,
  Clock, Target, UserX, Radio, MessageSquare,
} from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface TraficData {
  kpis: { activeClients: number; newClients: number; engagementRate: number; retentionRate: number }
  trends: { date: string; actifs: number; nouveaux: number; inactifs: number; engagement: number }[]
  segmentation: { segment: string; clients: number; engagement: number }[]
  byHour: { hour: number; count: number }[]
}

export default function SmsTraficClientPage() {
  const [data, setData] = useState<TraficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30j')

  useEffect(() => {
    setLoading(true)
    api.get<{ data: TraficData }>(`/sms/analytics/trafic-client?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [period])

  const kpiCards = [
    {
      label: 'Clients Actifs', icon: Users,
      gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      value: (data?.kpis.activeClients ?? 0).toLocaleString('fr-FR'),
      sub: 'sur la période',
    },
    {
      label: 'Nouveaux Clients', icon: UserPlus,
      gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
      value: `+${(data?.kpis.newClients ?? 0).toLocaleString('fr-FR')}`,
      sub: 'Ce mois',
    },
    {
      label: "Taux d'Engagement", icon: Activity,
      gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
      value: `${data?.kpis.engagementRate ?? 0}%`,
      sub: 'moyenne période',
    },
    {
      label: 'Taux de Rétention', icon: UserCheck,
      gradient: 'linear-gradient(135deg, #F97316, #F4511E)',
      value: `${data?.kpis.retentionRate ?? 0}%`,
      sub: (data?.kpis.retentionRate ?? 0) >= 85 ? 'Excellent niveau' : 'sur la période',
    },
  ]

  // Radar Comportement Client — alimenté par l'engagement réel, le reste arrive avec le tracking RCS/liens
  const radarData = data ? [
    { axis: "Taux d'Ouverture", value: data.kpis.engagementRate },
    { axis: 'Taux de Clic',     value: 0 },
    { axis: 'Réponses',         value: 0 },
    { axis: 'Partages',         value: 0 },
    { axis: 'Conversions',      value: 0 },
    { axis: 'Fidélité',         value: data.kpis.retentionRate },
  ] : []

  const inactifs = data?.segmentation.find(s => s.segment === 'Inactif')?.clients ?? 0
  const vipEngagement = data?.segmentation.find(s => s.segment === 'VIP')?.engagement ?? null

  function exportCsv() {
    if (!data) return
    const header = 'Segment;Clients;Engagement %'
    const rows = data.segmentation.map(s => [s.segment, s.clients, s.engagement].join(';')).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trafic-client-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function PlaceholderChart({ note }: { note: string }) {
    return (
      <div className="flex h-[230px] items-center justify-center rounded-xl bg-gray-50 px-6 text-center text-[12px] text-gray-400">
        {note}
      </div>
    )
  }

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
            <TrendingUp size={22} className="text-[#F4511E]" />
            Analyse du Trafic Client
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Analyses détaillées du comportement et de l'engagement client</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-medium text-gray-700 focus:border-[#F4511E] focus:outline-none"
          >
            <option value="30j">Ce mois</option>
            <option value="7j">Cette semaine</option>
            <option value="90j">3 derniers mois</option>
          </select>
          <button onClick={exportCsv} disabled={!data}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI — cartes pleines couleurs (maquette) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map(({ label, icon: Icon, gradient, value, sub }) => (
          <div key={label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: gradient }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-white/85">{label}</p>
                <p className="mt-1 text-[24px] font-bold">{loading ? '…' : value}</p>
              </div>
              <Icon size={30} className="text-white/40" />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-white/85">
              <TrendingUp size={10} /> {sub}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>
        </div>
      ) : (
        <>
          {/* Tendances du Trafic Client */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <Activity size={14} className="text-[#F4511E]" />
              Tendances du Trafic Client
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area yAxisId="left" type="monotone" dataKey="actifs" name="actifs" fill="#93C5FD" stroke="#3B82F6" fillOpacity={0.5} />
                <Bar  yAxisId="left" dataKey="nouveaux" name="nouveaux" fill="#10B981" radius={[4, 4, 0, 0]} barSize={10} />
                <Bar  yAxisId="left" dataKey="inactifs" name="inactifs" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={10} />
                <Line yAxisId="right" type="monotone" dataKey="engagement" name="engagement" stroke="#F4511E" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Segmentation + Comportement */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Users size={14} className="text-[#F4511E]" />
                Segmentation Client
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.segmentation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="clients"    name="clients"    fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagement" name="engagement" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Target size={14} className="text-[#F4511E]" />
                Comportement Client
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Comportement" dataKey="value" stroke="#F4511E" fill="#F4511E" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="mt-1 text-center text-[10px] text-gray-400">
                Clics, réponses, partages et conversions seront alimentés par le tracking RCS et liens courts
              </p>
            </div>
          </div>

          {/* Cycle de Vie + Fréquence d'Engagement */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <TrendingUp size={14} className="text-[#F4511E]" />
                Cycle de Vie Client
              </h2>
              <PlaceholderChart note="Le parcours Nouveau → Activé → Engagé → Fidèle → VIP sera disponible avec l'historique d'engagement par contact" />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Clock size={14} className="text-[#F4511E]" />
                Fréquence d'Engagement
              </h2>
              <PlaceholderChart note="Répartition Quotidien / Hebdo / Mensuel / Trimestriel / Rare disponible avec le tracking d'engagement par contact" />
            </div>
          </div>

          {/* Analyse de Rétention (Cohorte) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <UserCheck size={14} className="text-[#F4511E]" />
              Analyse de Rétention (Cohorte)
            </h2>
            <PlaceholderChart note="L'analyse par cohortes d'inscription sera disponible avec l'historique de rétention par contact" />
          </div>

          {/* Corrélation Messages vs Engagement */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <MessageSquare size={14} className="text-[#F4511E]" />
              Corrélation Messages vs Engagement
            </h2>
            <PlaceholderChart note="Le nuage de points (nombre de messages vs taux d'engagement) sera disponible avec le tracking par contact" />
            <p className="mt-2 text-center text-[11px] text-gray-400">
              La taille des bulles représente le nombre de clients dans chaque catégorie
            </p>
          </div>

          {/* Cartes insights (maquette) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#F0FDF4] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#22C55E]">
                <TrendingUp size={18} className="text-white" />
              </div>
              <p className="text-[15px] font-bold text-[#1F2937]">Tendance Positive</p>
              <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">
                L'engagement client est de <span className="font-bold">{data.kpis.engagementRate}%</span> ce mois.
                Continuez vos campagnes personnalisées !
              </p>
            </div>
            <div className="rounded-2xl bg-[#FFF7ED] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]">
                <UserX size={18} className="text-white" />
              </div>
              <p className="text-[15px] font-bold text-[#1F2937]">Attention</p>
              <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">
                <span className="font-bold">{inactifs.toLocaleString('fr-FR')}</span> clients inactifs détectés.
                Lancez une campagne de réactivation ciblée.
              </p>
            </div>
            <div className="rounded-2xl bg-[#EFF6FF] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#3B82F6]">
                <Radio size={18} className="text-white" />
              </div>
              <p className="text-[15px] font-bold text-[#1F2937]">Opportunité</p>
              <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">
                {vipEngagement !== null
                  ? <>Les clients VIP ont un taux d'engagement de <span className="font-bold">{vipEngagement}%</span>. Créez un programme de fidélité exclusif !</>
                  : <>Identifiez vos clients VIP pour créer un programme de fidélité exclusif !</>}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}
