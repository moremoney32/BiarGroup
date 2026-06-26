import { useState, useEffect, useCallback } from 'react'
import {
  Send, XCircle, CheckCircle2, ChevronDown,
  RefreshCw, Download, Loader2, TrendingUp,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsCampaign, SmsAnalyticsOverview, CampaignStatus } from '../../../types/sms.types'
import { motion } from 'framer-motion'

// ── Utilitaires ───────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#F9FAFB', text: '#6B7280', label: 'Brouillon' },
  queued:    { bg: '#EFF6FF', text: '#2563EB', label: 'En file' },
  sending:   { bg: '#FFF7ED', text: '#EA580C', label: 'En cours' },
  sent:      { bg: '#F0FDF4', text: '#16A34A', label: 'Envoyée' },
  scheduled: { bg: '#F5F3FF', text: '#7C3AED', label: 'Planifiée' },
  failed:    { bg: '#FEF2F2', text: '#DC2626', label: 'Échouée' },
  cancelled: { bg: '#F9FAFB', text: '#9CA3AF', label: 'Annulée' },
}

const PERIOD_OPTIONS = [
  { label: '7 derniers jours',  days: 7 },
  { label: '30 derniers jours', days: 30 },
  { label: '3 derniers mois',   days: 90 },
  { label: 'Tout',              days: 0 },
]

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Envoyées',   value: 'sent' },
  { label: 'En cours',   value: 'sending' },
  { label: 'En file',    value: 'queued' },
  { label: 'Brouillons', value: 'draft' },
  { label: 'Échouées',   value: 'failed' },
  { label: 'Planifiées', value: 'scheduled' },
]

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
    'ID', 'Nom', 'Statut', 'Type', 'Sender ID',
    'Destinataires', 'Envoyés', 'Délivrés', 'Échoués', 'Non livrés',
    'Taux livraison %', 'Créée le', 'Envoyée le',
  ]
  const rows = campaigns.map(c => [
    c.id,
    `"${c.name.replace(/"/g, '""')}"`,
    STATUS_STYLE[c.status]?.label ?? c.status,
    c.campaign_type,
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

// ── Composant dropdown filtre ─────────────────────────────────

function FilterDropdown<T extends string>({
  options, value, onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value) ?? options[0]
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-max min-w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${opt.value === value ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Graphique : Répartition des statuts ──────────────────────

const STATUS_PIE_COLORS: Partial<Record<CampaignStatus, string>> = {
  sent:      '#22C55E',
  sending:   '#3B82F6',
  queued:    '#F97316',
  draft:     '#9CA3AF',
  failed:    '#EF4444',
  cancelled: '#D1D5DB',
  scheduled: '#8B5CF6',
}

// ── Page principale ───────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsRapportsCampagnesPage() {
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [stats, setStats]         = useState<SmsAnalyticsOverview | null>(null)
  const [loading, setLoading]     = useState(true)
  const [periodDays, setPeriod]   = useState(30)
  const [statusFilter, setStatus] = useState('')
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [lastPage, setLastPage]   = useState(1)
  const [total, setTotal]         = useState(0)
  const LIMIT = 10

  const fetchAll = useCallback(async (p: number, status: string, days: number) => {
    setLoading(true)
    try {
      const range = periodRange(days)
      const [campaignRes, statsRes] = await Promise.all([
        smsService.getCampaigns({ page: p, limit: LIMIT, status: status || undefined, ...range }),
        smsService.getAnalyticsOverview(),
      ])
      setCampaigns(campaignRes.campaigns)
      setLastPage(campaignRes.meta.lastPage)
      setTotal(campaignRes.meta.total)
      setStats(statsRes)
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll(page, statusFilter, periodDays) }, [page, statusFilter, periodDays, fetchAll])

  // Filtre texte côté client (sur la page courante)
  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Données pour les graphiques ───────────────────────────────

  // Chart 1 — performance timeline (7 dernières campagnes avec données)
  const timelineData = [...filtered]
    .filter(c => c.total_sent > 0)
    .slice(0, 7)
    .map(c => ({
      date:     new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      envoyes:  c.total_sent,
      delivres: c.total_delivered,
      echecs:   c.total_failed,
    }))
    .reverse()

  // Chart 2 — taux de délivrance par campagne (top 7 avec envois)
  const delivRateData = [...filtered]
    .filter(c => c.total_sent > 0)
    .slice(0, 7)
    .map(c => ({
      name:  c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
      taux:  Math.round((c.total_delivered / c.total_sent) * 100),
    }))
    .reverse()

  // Chart 3 — répartition des statuts (donut)
  const statusCounts: Partial<Record<CampaignStatus, number>> = {}
  for (const c of filtered) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1
  }
  const statusPieData = (Object.entries(statusCounts) as [CampaignStatus, number][])
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({
      name:  STATUS_STYLE[status]?.label ?? status,
      value: count,
      color: STATUS_PIE_COLORS[status] ?? '#9CA3AF',
    }))

  const totalSent      = stats?.totalSent      ?? 0
  const totalDelivered = stats?.totalDelivered ?? 0
  const totalFailed    = stats?.totalFailed    ?? 0
  const deliveryRate   = stats?.deliveryRate   ?? 0

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Rapports Campagnes</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Analyses détaillées et statistiques de performance SMS</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchAll(page, statusFilter, periodDays)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Actualiser
            </button>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
              <Download size={13} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterDropdown
            options={PERIOD_OPTIONS.map(p => ({ label: p.label, value: String(p.days) }))}
            value={String(periodDays)}
            onChange={v => { setPeriod(Number(v)); setPage(1) }}
          />
          <FilterDropdown
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={v => { setStatus(v); setPage(1) }}
          />
          <div className="flex-1 min-w-[160px]">
            <input type="text" placeholder="Rechercher une campagne..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] placeholder-orange-300 outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
            />
          </div>
        </div>

        {/* KPI — 4 métriques clés */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages envoyés',   value: loading ? '…' : totalSent.toLocaleString('fr-FR') },
            { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Taux de délivrance', value: loading ? '…' : `${deliveryRate}%`, sub: loading ? '' : totalDelivered.toLocaleString('fr-FR') + ' délivrés' },
            { icon: TrendingUp,   bg: '#F5F3FF', color: '#8B5CF6', label: 'Campagnes actives',  value: loading ? '…' : String(stats?.activeCampaigns ?? 0), sub: loading ? '' : `${total} au total` },
            { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Messages échoués',   value: loading ? '…' : totalFailed.toLocaleString('fr-FR') },
          ].map(({ icon: Icon, bg, color, label, value, sub }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
              {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
            </div>
          ))}
        </div>

        {/* Charts ligne 1 : Performance timeline + Taux par campagne */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Chart 1 : Performance campagnes */}
          <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Performance Campagnes</h3>
            <p className="mb-4 text-[11px] text-gray-400">Envoyés / Délivrés / Échecs par campagne</p>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {([['gE','#3B82F6'],['gD','#22C55E'],['gC','#EF4444']] as const).map(([id, c]) => (
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
                  <Area type="monotone" dataKey="echecs"   stroke="#EF4444" fill="url(#gC)" strokeWidth={2} name="Échecs" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne avec envois dans cette période'}
              </div>
            )}
            <div className="mt-3 flex justify-center gap-5">
              {[['#3B82F6','Envoyés'],['#22C55E','Délivrés'],['#EF4444','Échecs']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                  <span className="text-[10px] text-gray-500">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2 : Taux de délivrance par campagne */}
          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Taux de Délivrance</h3>
            <p className="mb-4 text-[11px] text-gray-400">Par campagne (DLR Infobip)</p>
            {delivRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={delivRateData} layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} width={70} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Taux']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="taux" fill="#22C55E" radius={[0, 3, 3, 0]} name="Taux" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-center text-[12px] text-gray-300 px-4">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Données disponibles après les premiers envois'}
              </div>
            )}
          </div>
        </div>

        {/* Charts ligne 2 : Répartition statuts + Info opérateurs */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Chart 3 : Répartition des statuts */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Répartition des Statuts</h3>
            <p className="mb-3 text-[11px] text-gray-400">Campagnes de la période sélectionnée</p>
            {statusPieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                      dataKey="value" stroke="none">
                      {statusPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, 'Campagnes']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusPieData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[11px] text-gray-600">{name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-[#1F2937]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne dans cette période'}
              </div>
            )}
          </div>

          {/* Info : Distribution opérateur — données non disponibles */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Distribution par Opérateur</h3>
            <p className="mb-3 text-[11px] text-gray-400">Répartition par réseau télécom RDC</p>
            <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 text-center">
              <div className="flex items-center gap-4">
                {[
                  { name: 'Vodacom', color: '#2563EB' },
                  { name: 'Airtel',  color: '#EF4444' },
                  { name: 'Orange',  color: '#F97316' },
                  { name: 'Africell',color: '#22C55E' },
                ].map(op => (
                  <div key={op.name} className="flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} />
                    <span className="text-[9px] text-gray-500">{op.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-gray-400">Disponible prochainement</p>
              <p className="text-[10px] text-gray-400 max-w-[220px]">
                Nécessite l'analyse des préfixes téléphoniques depuis les DLR Infobip
              </p>
            </div>
          </div>
        </div>

        {/* Tableau : Campagnes */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
            <div>
              <h3 className="text-[14px] font-bold text-[#1F2937]">Historique des Campagnes</h3>
              <p className="text-[11px] text-gray-400">{total > 0 ? `${total} campagne(s) au total` : 'Aucune campagne'}</p>
            </div>
            <button onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-[#F4511E] hover:bg-orange-50 disabled:opacity-40">
              <Download size={12} /> Exporter CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne','Statut','Date','Envoyés','Délivrés','Échecs','Taux','Destinataires'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="py-10 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-[12px] text-gray-400">
                    Aucune campagne trouvée
                  </td></tr>
                )}
                {!loading && filtered.map(c => {
                  const ss = STATUS_STYLE[c.status] ?? { bg: '#F9FAFB', text: '#6B7280', label: c.status }
                  const delivPct = c.total_sent > 0
                    ? Math.round((c.total_delivered / c.total_sent) * 100)
                    : null
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-[12px] font-semibold text-[#1F2937] truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.sender_id || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.text }}>
                          {ss.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{c.total_sent.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[12px] text-[#22C55E] font-semibold">{c.total_delivered.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[12px] text-[#EF4444]">{c.total_failed.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        {delivPct !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${delivPct}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold ${delivPct >= 80 ? 'text-[#22C55E]' : delivPct >= 50 ? 'text-orange-500' : 'text-[#EF4444]'}`}>
                              {delivPct}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{c.total_recipients.toLocaleString('fr-FR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
              <span className="text-[11px] text-gray-400">Page {page} / {lastPage}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                  Précédent
                </button>
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  const n = Math.max(1, Math.min(page - 2, lastPage - 4)) + i
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold ${page === n ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
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
