import { useState, useEffect, useCallback } from 'react'
import {
  Send, XCircle, CheckCircle2, ChevronDown, Search,
  RefreshCw, Download, Loader2, TrendingUp, TrendingDown,
  Eye, MousePointerClick, DollarSign, BookOpen, Clock,
  BarChart2, FileText, Activity, MoreVertical,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import api from '../../../services/api'
import type { SmsCampaign, SmsAnalyticsOverview } from '../../../types/sms.types'
import { motion } from 'framer-motion'

// ── Utilitaires ───────────────────────────────────────────────

const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  promotional:   { bg: '#F5F3FF', text: '#7C3AED', label: 'Marketing' },
  transactional: { bg: '#F0FDF4', text: '#16A34A', label: 'Transactionnel' },
  otp:           { bg: '#EFF6FF', text: '#2563EB', label: 'OTP' },
  notification:  { bg: '#FFF7ED', text: '#EA580C', label: 'Notification' },
}

const TYPE_PIE_COLORS: Record<string, string> = {
  promotional:   '#8B5CF6',
  transactional: '#10B981',
  otp:           '#3B82F6',
  notification:  '#F59E0B',
}

const PERIOD_OPTIONS = [
  { label: '7 derniers jours',  value: '7' },
  { label: '30 derniers jours', value: '30' },
  { label: '3 derniers mois',   value: '90' },
  { label: 'Tout',              value: '0' },
]

const TYPE_OPTIONS = [
  { label: 'Tous les types',  value: '' },
  { label: 'Marketing',       value: 'promotional' },
  { label: 'Transactionnel',  value: 'transactional' },
  { label: 'OTP',             value: 'otp' },
  { label: 'Notification',    value: 'notification' },
]

const OPERATOR_OPTIONS = [
  { label: 'Tous les opérateurs', value: '' },
  { label: 'Vodacom',  value: 'vodacom' },
  { label: 'Airtel',   value: 'airtel' },
  { label: 'Orange',   value: 'orange' },
  { label: 'Africell', value: 'africell' },
]

interface AnalyticsKpis {
  totalSms: number
  successRate: number
  uniqueRecipients: number
  totalCost: number
  totalClicks?: number
  clickRate?: number
}

interface RapportsData {
  byHour: { hour: string; count: number }[]
  engagementRate: { day: string; ouverture: number; clic: number; conversion: number }[]
}

// Calcule from/to ISO depuis le nombre de jours
function periodRange(days: number): { from?: string; to?: string } {
  if (days === 0) return {}
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from) + ' 00:00:00', to: fmt(to) + ' 23:59:59' }
}

// Export CSV côté client
function exportCsv(campaigns: SmsCampaign[]) {
  const sep = ';'
  const header = [
    'ID', 'Nom', 'Type', 'Sender ID',
    'Destinataires', 'Envoyés', 'Délivrés', 'Échoués', 'Non livrés',
    'Taux livraison %', 'Créée le', 'Envoyée le',
  ]
  const rows = campaigns.map(c => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    TYPE_STYLE[c.campaign_type]?.label ?? c.campaign_type,
    c.sender_id || '—',
    c.total_recipients,
    c.total_sent,
    c.total_delivered,
    c.total_failed,
    c.total_undelivered,
    c.total_sent > 0 ? Math.round((c.total_delivered / c.total_sent) * 100) : 0,
    new Date(c.created_at).toLocaleDateString('fr-FR'),
    c.sent_at ? new Date(c.sent_at).toLocaleDateString('fr-FR') : '',
  ])
  const csv = [header.join(sep), ...rows.map(r => r.join(sep))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `campagnes-sms-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Dropdown filtre orange (maquette) ─────────────────────────

function OrangeDropdown({
  label, options, value, onChange,
}: {
  label: string
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value) ?? options[0]
  return (
    <div className="min-w-[170px] flex-1">
      <p className="mb-1.5 text-[12px] font-semibold text-gray-700">{label}</p>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="flex w-full items-center justify-between rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
          <span>{current.label}</span>
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            {options.map(opt => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${opt.value === value ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Badge de tendance KPI ─────────────────────────────────────

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null
  const up = value >= 0
  return (
    <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${up ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {up ? '+' : ''}{value}%
    </span>
  )
}

// ── Page principale ───────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsRapportsCampagnesPage() {
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [stats, setStats]         = useState<SmsAnalyticsOverview | null>(null)
  const [kpis, setKpis]           = useState<AnalyticsKpis | null>(null)
  const [rapports, setRapports]   = useState<RapportsData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [periodDays, setPeriod]   = useState('7')
  const [typeFilter, setType]     = useState('')
  const [opFilter, setOp]         = useState('')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [lastPage, setLastPage]   = useState(1)
  const [total, setTotal]         = useState(0)
  const [menuOpen, setMenuOpen]   = useState<number | null>(null)
  const LIMIT = 10

  const fetchAll = useCallback(async (p: number, days: string) => {
    setLoading(true)
    try {
      const range = periodRange(Number(days))
      const periodParam = days === '7' ? '7j' : days === '90' ? '90j' : '30j'
      const [campaignRes, statsRes, kpisRes, rapportsRes] = await Promise.all([
        smsService.getCampaigns({ page: p, limit: LIMIT, ...range }),
        smsService.getAnalyticsOverview(),
        api.get<{ data: AnalyticsKpis }>('/sms/analytics/kpis').catch(() => null),
        api.get<{ data: RapportsData }>(`/sms/analytics/rapports?period=${periodParam}`).catch(() => null),
      ])
      setCampaigns(campaignRes.campaigns)
      setLastPage(campaignRes.meta.lastPage)
      setTotal(campaignRes.meta.total)
      setStats(statsRes)
      if (kpisRes) setKpis(kpisRes.data)
      if (rapportsRes) setRapports(rapportsRes.data)
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(page, periodDays) }, [page, periodDays, fetchAll])

  // Filtres client (page courante) : recherche + type — opérateur dispo après DLR
  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === '' || c.campaign_type === typeFilter)
  )

  const totalSent      = stats?.totalSent      ?? 0
  const totalDelivered = stats?.totalDelivered ?? 0
  const totalFailed    = stats?.totalFailed    ?? 0
  const deliveryRate   = stats?.deliveryRate   ?? 0

  // Engagement (endpoint rapports) — null tant qu'aucun tracking réel (liens courts / RCS)
  const engagement = rapports?.engagementRate ?? []
  const hasEngagement = engagement.some(e => e.ouverture > 0 || e.clic > 0)
  const avgOuverture = hasEngagement
    ? Math.round(engagement.reduce((s, e) => s + e.ouverture, 0) / engagement.length * 10) / 10
    : null
  const messagesLus = avgOuverture !== null ? Math.round(totalSent * avgOuverture / 100) : null

  // ── Données graphiques ──────────────────────────────────────

  const timelineData = [...filtered]
    .filter(c => c.total_sent > 0)
    .slice(0, 7)
    .map(c => ({
      date:     new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      envoyes:  c.total_sent,
      delivres: c.total_delivered,
      clics:    c.total_clicks ?? 0,
    }))
    .reverse()

  const byHourData = (rapports?.byHour ?? []).map(h => ({
    h: h.hour, count: h.count,
  }))

  // Donut Types de Campagne — distribution réelle de la période
  const typeCounts: Record<string, number> = {}
  for (const c of filtered) typeCounts[c.campaign_type] = (typeCounts[c.campaign_type] ?? 0) + 1
  const typePieData = Object.entries(typeCounts).map(([type, count]) => ({
    name:  TYPE_STYLE[type]?.label ?? type,
    value: count,
    color: TYPE_PIE_COLORS[type] ?? '#9CA3AF',
  }))
  const typeTotal = typePieData.reduce((s, d) => s + d.value, 0)

  const kpiCards = [
    { icon: Send,              bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés',   value: loading ? '…' : (kpis?.totalSms ?? totalSent).toLocaleString('fr-FR'), trend: null },
    { icon: CheckCircle2,      bg: '#F0FDF4', color: '#22C55E', label: 'Taux de Délivrance', value: loading ? '…' : `${deliveryRate}%`,   trend: null },
    { icon: Eye,               bg: '#F5F3FF', color: '#8B5CF6', label: 'Taux de Lecture',    value: avgOuverture !== null ? `${avgOuverture}%` : '—', trend: null },
    { icon: MousePointerClick, bg: '#FDF2F8', color: '#EC4899', label: 'Taux de Clic',       value: kpis?.clickRate != null ? `${kpis.clickRate}%` : '—', trend: null },
    { icon: BookOpen,          bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Lus',       value: messagesLus !== null ? messagesLus.toLocaleString('fr-FR') : '—', trend: null },
    { icon: MousePointerClick, bg: '#FDF2F8', color: '#EC4899', label: 'Clics Totaux',       value: kpis?.totalClicks != null ? kpis.totalClicks.toLocaleString('fr-FR') : '—', trend: null },
    { icon: XCircle,           bg: '#FEF2F2', color: '#EF4444', label: 'Échecs',             value: loading ? '…' : totalFailed.toLocaleString('fr-FR'), trend: null },
    { icon: DollarSign,        bg: '#F0FDF4', color: '#16A34A', label: 'Coût Total',         value: kpis ? `$${kpis.totalCost.toFixed(2)}` : '—', trend: null },
  ]

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Campaign Reports</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Analyses détaillées et statistiques de performance SMS</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchAll(page, periodDays)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Actualiser
            </button>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
              <Download size={13} /> Exporter Rapport
            </button>
          </div>
        </div>

        {/* Filtres — champs oranges (maquette) */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <OrangeDropdown label="Période" options={PERIOD_OPTIONS} value={periodDays}
              onChange={v => { setPeriod(v); setPage(1) }} />
            <OrangeDropdown label="Type de Campagne" options={TYPE_OPTIONS} value={typeFilter}
              onChange={setType} />
            <OrangeDropdown label="Opérateur" options={OPERATOR_OPTIONS} value={opFilter}
              onChange={setOp} />
            <div className="min-w-[200px] flex-1">
              <p className="mb-1.5 text-[12px] font-semibold text-gray-700">Rechercher</p>
              <div className="flex items-center gap-2 rounded-xl bg-[#F4511E] px-4 py-2.5">
                <Search size={13} className="shrink-0 text-white/70" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nom de campagne..."
                  className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-white/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI — 8 cartes (maquette) */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map(({ icon: Icon, bg, color, label, value, trend }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <TrendBadge value={trend} />
              </div>
              <p className="text-[13px] text-gray-500">{label}</p>
              <p className="mt-0.5 text-[22px] font-bold text-[#1F2937]">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts ligne 1 : Performance Timeline + Taux de Délivrance par Heure */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Performance Timeline</h3>
                <p className="mb-4 text-[11px] text-gray-400">Évolution des métriques clés</p>
              </div>
              <Activity size={15} className="text-[#F4511E]" />
            </div>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {([['gE', '#3B82F6'], ['gD', '#22C55E'], ['gC', '#F59E0B']] as const).map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F4F6' }} />
                  <Area type="monotone" dataKey="envoyes"  stroke="#3B82F6" fill="url(#gE)" strokeWidth={2} name="Envoyés" />
                  <Area type="monotone" dataKey="delivres" stroke="#22C55E" fill="url(#gD)" strokeWidth={2} name="Délivrés" />
                  <Area type="monotone" dataKey="clics"    stroke="#F59E0B" fill="url(#gC)" strokeWidth={2} name="Clics" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne avec envois dans cette période'}
              </div>
            )}
            <div className="mt-3 flex justify-center gap-5">
              {[['#3B82F6', 'Envoyés'], ['#22C55E', 'Délivrés'], ['#F59E0B', 'Clics']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                  <span className="text-[10px] text-gray-500">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Taux de Délivrance par Heure</h3>
                <p className="mb-4 text-[11px] text-gray-400">Performance horaire moyenne</p>
              </div>
              <Clock size={15} className="text-[#F4511E]" />
            </div>
            {/* Le taux horaire nécessite les DLR — affiché dès réception */}
            <div className="flex h-[200px] items-center justify-center rounded-xl bg-gray-50 text-center text-[12px] text-gray-400 px-6">
              Disponible dès la réception des accusés de livraison (DLR)
            </div>
          </div>
        </div>

        {/* Charts ligne 2 : Volume par Heure + Distribution par Opérateur */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Volume par Heure</h3>
                <p className="mb-4 text-[11px] text-gray-400">Distribution horaire des envois</p>
              </div>
              <BarChart2 size={15} className="text-[#F4511E]" />
            </div>
            {byHourData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byHourData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={1} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Envois" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucun envoi sur la période'}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Distribution par Opérateur</h3>
                <p className="mb-3 text-[11px] text-gray-400">Répartition des envois</p>
              </div>
            </div>
            <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 text-center">
              <div className="flex items-center gap-4">
                {[
                  { name: 'Vodacom',  color: '#EF4444' },
                  { name: 'Airtel',   color: '#F59E0B' },
                  { name: 'Orange',   color: '#F97316' },
                  { name: 'Africell', color: '#3B82F6' },
                ].map(op => (
                  <div key={op.name} className="flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} />
                    <span className="text-[9px] text-gray-500">{op.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-gray-400">Disponible prochainement</p>
              <p className="text-[10px] text-gray-400 max-w-[240px]">
                Nécessite l'analyse des préfixes téléphoniques depuis les DLR Infobip
              </p>
            </div>
          </div>
        </div>

        {/* Ligne 3 : Types de Campagne + Statistiques de Performance */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Types de Campagne</h3>
                <p className="mb-3 text-[11px] text-gray-400">Distribution par type</p>
              </div>
              <FileText size={15} className="text-[#F4511E]" />
            </div>
            {typePieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={typePieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                      dataKey="value" stroke="none" paddingAngle={2}>
                      {typePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Campagnes']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {typePieData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[11px] text-gray-600">{name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-[#1F2937]">
                        {typeTotal > 0 ? Math.round((value / typeTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[190px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne dans cette période'}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#1F2937]">Statistiques de Performance</h3>
                <p className="mb-4 text-[11px] text-gray-400">Indicateurs clés de succès</p>
              </div>
              <TrendingUp size={15} className="text-[#F4511E]" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  icon: CheckCircle2, bg: '#F0FDF4', color: '#16A34A',
                  label: 'Messages Délivrés',
                  value: totalDelivered.toLocaleString('fr-FR'),
                  sub: `${deliveryRate}% de taux de réussite`,
                },
                {
                  icon: MousePointerClick, bg: '#FFF7ED', color: '#EA580C',
                  label: 'Clics Totaux',
                  value: kpis?.totalClicks != null ? kpis.totalClicks.toLocaleString('fr-FR') : '—',
                  sub: kpis?.clickRate != null ? `${kpis.clickRate}% de taux de clic` : 'Tracking via liens courts',
                },
                {
                  icon: Eye, bg: '#F5F3FF', color: '#8B5CF6',
                  label: 'Messages Lus',
                  value: messagesLus !== null ? messagesLus.toLocaleString('fr-FR') : '—',
                  sub: avgOuverture !== null ? `${avgOuverture}% de taux d'ouverture` : 'Disponible avec RCS',
                },
                {
                  icon: XCircle, bg: '#FEF2F2', color: '#DC2626',
                  label: 'Échecs',
                  value: totalFailed.toLocaleString('fr-FR'),
                  sub: totalSent > 0 ? `${Math.round((totalFailed / totalSent) * 1000) / 10}% de taux d'échec` : '—',
                },
              ].map(({ icon: Icon, bg, color, label, value, sub }) => (
                <div key={label} className="rounded-xl p-4" style={{ backgroundColor: bg }}>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={14} style={{ color }} />
                    <span className="text-[12px] font-semibold text-[#1F2937]">{label}</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau : Campagnes Récentes */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#1F2937]">Campagnes Récentes</h3>
              <p className="text-[11px] text-gray-400">
                {total > 0 ? `Historique détaillé des campagnes SMS` : 'Aucune campagne'}
              </p>
            </div>
            <button onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
              <Download size={12} /> Exporter CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#F4511E]">
                  {['Campagne', 'Type', 'Date', 'Envoyés', 'Délivrés', 'Taux', 'Clics', 'Coût', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-white whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="py-10 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-[12px] text-gray-400">
                    Aucune campagne trouvée
                  </td></tr>
                )}
                {!loading && filtered.map(c => {
                  const ts = TYPE_STYLE[c.campaign_type] ?? { bg: '#F9FAFB', text: '#6B7280', label: c.campaign_type }
                  const delivPct = c.total_sent > 0
                    ? Math.round((c.total_delivered / c.total_sent) * 1000) / 10
                    : null
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFEEE6]">
                            <Send size={14} className="text-[#F4511E]" />
                          </div>
                          <div className="max-w-[170px]">
                            <p className="text-[12px] font-semibold text-[#1F2937] truncate">{c.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: ts.bg, color: ts.text }}>
                          {ts.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600 whitespace-nowrap">
                        {new Date(c.sent_at ?? c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{c.total_sent.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#16A34A]">{c.total_delivered.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        {delivPct !== null ? (
                          <span className={`text-[12px] font-bold ${delivPct >= 80 ? 'text-[#16A34A]' : delivPct >= 50 ? 'text-orange-500' : 'text-[#EF4444]'}`}>
                            {delivPct}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      {/* Clics réels des liens courts liés à la campagne — CTR calculé sur les clics UNIQUES */}
                      <td className="px-4 py-3">
                        {c.total_clicks != null && c.total_clicks > 0 ? (
                          <div>
                            <p className="text-[12px] font-semibold text-[#1F2937]">{c.total_clicks.toLocaleString('fr-FR')}</p>
                            {c.total_delivered > 0 && c.total_unique_clicks != null && (
                              <p className="text-[10px] text-gray-400">
                                {Math.round((c.total_unique_clicks / c.total_delivered) * 1000) / 10}% CTR
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">0</span>
                        )}
                      </td>
                      {/* Coût — agrégat par campagne dès activation des DLR */}
                      <td className="px-4 py-3 text-[11px] text-gray-400">—</td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                            aria-label="Actions"
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 transition-colors">
                            <MoreVertical size={14} />
                          </button>
                          {menuOpen === c.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                              <button
                                onClick={() => { setMenuOpen(null); exportCsv([c]) }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] text-gray-700 hover:bg-orange-50">
                                <Download size={12} /> Exporter la ligne
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
              <span className="text-[11px] text-gray-400">
                Affichage de {filtered.length} sur {total} campagnes
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Précédent
                </button>
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  const n = Math.max(1, Math.min(page - 2, lastPage - 4)) + i
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${page === n ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
