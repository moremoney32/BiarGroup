import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Eye, MousePointer, RotateCcw, CheckCircle2,
  Search, Star, Zap, Users, Loader2, Trash2, RefreshCw, Info,
  ChevronRight, Monitor, Shield, Reply, Mail, GitBranch,
  UserMinus, Flag, AlertCircle, BarChart2, Filter, FlaskConical, Trophy, X,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'
import AbTestModal from '../components/AbTestModal'
import SmtpWarningBanner from '../components/SmtpWarningBanner'

interface Campaign {
  id: number
  name: string | null
  category: string
  sujet: string
  expediteur: string
  status: 'draft' | 'queued' | 'sending' | 'sent' | 'failed' | 'scheduled'
  total_recipients: number
  total_sent: number
  total_failed: number
  opens: number
  clicks: number
  unsubscribes: number
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

interface AbTest {
  id: number
  name: string
  subject_a: string
  subject_b: string
  split_percent: number
  winner_metric: 'open_rate' | 'click_rate'
  wait_hours: number
  status: 'running' | 'completed' | 'cancelled'
  winner_id: number | null
  winner_subject: string | null
  rate_a: number | null
  rate_b: number | null
  sent_a: number
  sent_b: number
  scheduled_at: string
  completed_at: string | null
  created_at: string
}

interface Stats {
  totalSent: number
  totalRecipients: number
  totalFailed: number
  totalCampaigns: number
  opens: number
  clicks: number
  bounces: number
  hardBounces: number
  softBounces: number
  unsubscribes: number
  spamComplaints: number
  pendingRelances: number
  completedRelances: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubRate: number
  spamRate: number
  deliverRate: number
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  sent:      { label: 'Envoyé',     color: '#10B981' },
  sending:   { label: 'En cours',   color: '#F4511E' },
  scheduled: { label: 'Planifié',   color: '#6366F1' },
  queued:    { label: 'En attente', color: '#3B82F6' },
  draft:     { label: 'Brouillon',  color: '#9CA3AF' },
  failed:    { label: 'Échoué',     color: '#EF4444' },
}

const TYPE_COLORS: Record<string, { text: string; bg: string }> = {
  'Bulk':           { text: '#F4511E', bg: '#FFF1EE' },
  'Newsletter':     { text: '#8B5CF6', bg: '#F5F3FF' },
  'Marketing':      { text: '#3B82F6', bg: '#EFF6FF' },
  'Transactionnel': { text: '#10B981', bg: '#ECFDF5' },
}
const defaultTypeColor = { text: '#6B7280', bg: '#F9FAFB' }

function fmt(n: number) { return n.toLocaleString('fr-FR') }

function pct(num: number, denom: number) {
  if (!denom) return '—'
  return (num / denom * 100).toFixed(1) + '%'
}

export default function CampagnesEmailPage() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [stats, setStats]           = useState<Stats | null>(null)
  const [abTests, setAbTests]       = useState<AbTest[]>([])
  const [showAbTestModal, setShowAbTestModal] = useState(false)
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting]     = useState<number | null>(null)
  const [cancellingAb, setCancellingAb] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [cRes, sRes, abRes] = await Promise.all([
        apiFetch.get<{ data: Campaign[] }>('/email/campaigns'),
        apiFetch.get<{ data: Stats }>('/email/campaigns/stats'),
        apiFetch.get<{ data: AbTest[] }>('/email/ab-tests'),
      ])
      setCampaigns(cRes.data)
      setStats(sRes.data)
      setAbTests(abRes.data ?? [])
      setLastUpdate(new Date())
    } catch {
      // empty state shown on error
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette campagne ?')) return
    setDeleting(id)
    try {
      await apiFetch.delete(`/email/campaigns/${id}`)
      setCampaigns(prev => prev.filter(c => c.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const campaignTypes = Array.from(new Set(campaigns.map(c => c.category))).filter(Boolean)

  const filtered = campaigns.filter(c => {
    const matchSearch = (c.name ?? c.sujet).toLowerCase().includes(search.toLowerCase())
    const matchType   = typeFilter === 'all' || c.category === typeFilter
    return matchSearch && matchType
  })

  const s = stats
  const ctorStr = s && s.opens > 0
    ? `${((s.clicks / s.opens) * 100).toFixed(1)}%`
    : '—'

  const topStats = [
    { icon: Send,         color: '#3B82F6', bg: '#EFF6FF', label: 'Emails envoyés',        value: s ? fmt(s.totalSent)    : '—', trend: `${s?.totalCampaigns ?? 0} campagnes`, note: null },
    { icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5', label: 'Taux de délivrabilité', value: s ? `${s.deliverRate}%` : '—', trend: s ? `${fmt(s.totalRecipients)} dest.` : '', note: null },
    { icon: Eye,          color: '#8B5CF6', bg: '#F5F3FF', label: "Taux d'ouverture",      value: s ? `${s.openRate}%`    : '—', trend: s ? `${fmt(s.opens)} ouvert.` : '', note: isLocalhost ? 'Inactif en local — nécessite HTTPS en production' : null },
    { icon: MousePointer, color: '#F4511E', bg: '#FFF7F5', label: 'Taux de clic',          value: s ? `${s.clickRate}%`   : '—', trend: s ? `${fmt(s.clicks)} clics` : '', note: null },
    { icon: RotateCcw,    color: '#EF4444', bg: '#FEF2F2', label: 'Échouées',              value: s ? fmt(s.totalFailed)  : '—', trend: s ? `${s.bounceRate}% rebond` : '', note: null },
  ]

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-4 sm:px-6 sm:py-5">

        <SmtpWarningBanner />

        {/* ── Header ── */}
        <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Email Marketing</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="text-[13px] text-gray-500">Gestion complète de vos campagnes email &amp; newsletters</p>
              {lastUpdate && (
                <span className="text-[11px] text-gray-400">
                  · Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button onClick={() => navigate('/app/email/modeles')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
              <Star size={13} /> Templates
            </button>
            <button onClick={() => navigate('/app/email/flux')} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
              <Zap size={13} /> Automation
            </button>
            <button onClick={() => navigate('/app/email/editeur')} className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
              + Nouvelle campagne
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {topStats.map(({ icon: Icon, color, bg, label, value, trend, note }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-[11px] text-gray-400">{trend}</span>
              </div>
              {loading
                ? <div className="h-6 w-16 animate-pulse rounded bg-gray-100 mb-1" />
                : <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              }
              <div className="mt-0.5 flex items-center gap-1">
                <p className="text-[11px] text-gray-500">{label}</p>
                {note && (
                  <div className="group relative">
                    <Info size={11} className="text-amber-400 cursor-help" />
                    <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-52 rounded-lg bg-gray-900 px-3 py-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      {note}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Recherche + Filtre type ── */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 w-full sm:flex-1 sm:w-auto">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#F4511E]/30 bg-[#FFF7F5] py-2 pl-8 pr-4 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20 cursor-pointer"
          >
            <option value="all">Tous les types</option>
            {campaignTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
            <Filter size={13} /> Filtrer
          </button>
        </div>

        {/* ── Table campagnes ── */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1F2937]">Campagnes récentes</h2>
            <span className="text-[11px] text-gray-400">{filtered.length} campagne{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne', 'Type', 'Statut', 'Envoyés', 'Ouvertures', 'Clics', 'Taux ouvert.', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {h === 'Ouvertures' && isLocalhost
                        ? <span className="flex items-center gap-1">{h}<span className="normal-case font-normal text-[10px] text-amber-400">(HTTPS requis)</span></span>
                        : h
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <Loader2 size={20} className="mx-auto animate-spin text-[#F4511E]" />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-[12px] text-gray-400">
                      {search || typeFilter !== 'all'
                        ? 'Aucune campagne ne correspond aux filtres.'
                        : "Aucune campagne pour l'instant. Créez votre première campagne !"}
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(c => {
                  const { label, color } = STATUS_MAP[c.status] ?? { label: c.status, color: '#9CA3AF' }
                  const typeStyle = TYPE_COLORS[c.category] ?? defaultTypeColor
                  const openRate  = c.total_recipients > 0 ? (c.opens / c.total_recipients * 100) : 0
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#1F2937]">{c.name ?? c.sujet}</p>
                        {c.name && <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{c.sujet}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ color: typeStyle.text, backgroundColor: typeStyle.bg }}
                        >
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: color }}>
                          ● {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{fmt(c.total_sent)}</td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-700">{fmt(c.opens)}</p>
                        <p className="text-[11px] text-blue-500">{pct(c.opens, c.total_recipients)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-700">{fmt(c.clicks)}</p>
                        <p className="text-[11px] text-green-500">{pct(c.clicks, c.total_recipients)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(openRate, 100)}%`,
                                backgroundColor: openRate > 30 ? '#10B981' : openRate > 10 ? '#F4511E' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-gray-600">{openRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {deleting === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Actions rapides ── */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Send,  label: 'Créer une campagne',   sub: 'Éditeur drag & drop avec templates professionnels',    bg: 'from-blue-400 to-indigo-500',   to: '/app/email/editeur' },
            { icon: Users, label: 'Segmentation avancée', sub: 'Ciblage précis basé sur le comportement et données',   bg: 'from-purple-400 to-pink-500',   to: '/app/email/segmentation' },
            { icon: Zap,   label: 'Marketing Automation', sub: 'Workflows automatisés, triggers et scénarios',         bg: 'from-green-400 to-emerald-500', to: '/app/email/flux' },
          ].map(({ icon: Icon, label, sub, bg, to }) => (
            <div
              key={label}
              onClick={() => navigate(to)}
              className={`cursor-pointer rounded-xl bg-gradient-to-br ${bg} p-5 text-white hover:opacity-90 transition-opacity`}
            >
              <Icon size={22} className="mb-3 opacity-90" />
              <p className="text-[13px] font-semibold">{label}</p>
              <p className="mt-1 text-[11px] opacity-80">{sub}</p>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-medium opacity-80">
                Accéder <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Outils & Automation ── */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Optimisation & Tests */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-[#1F2937]">Optimisation & Tests</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Maximisez vos performances</p>
            </div>
            <div className="space-y-2">
              {([
                { icon: BarChart2, label: 'A/B Testing',     sub: 'Testez sujets, contenus et horaires',             to: '/app/email/analytics',     badge: null },
                { icon: Monitor,   label: 'Tests de Rendu',  sub: 'Prévisualisation 50+ clients email',              to: '/app/email/delivrabilite', badge: 'Pro' },
                { icon: Shield,    label: 'Spam Checker',    sub: 'Analyse anti-spam & score délivrabilité',         to: '/app/email/delivrabilite', badge: null },
              ] as const).map(({ icon: Icon, label, sub, to, badge }) => (
                <div
                  key={label}
                  onClick={() => {
                    if (label === 'A/B Testing') setShowAbTestModal(true)
                    else navigate(to)
                  }}
                  className="flex items-center justify-between rounded-lg bg-[#F4511E] p-3 cursor-pointer hover:bg-[#d9400f] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-white shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-white/70">{sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {badge && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white">{badge}</span>}
                    <ChevronRight size={14} className="text-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automation Intelligente */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-[#1F2937]">Automation Intelligente</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Campagnes automatisées 24/7</p>
            </div>
            <div className="space-y-2">
              <div
                onClick={() => navigate('/app/email/flux')}
                className="flex items-center justify-between rounded-lg bg-[#F4511E] p-3 cursor-pointer hover:bg-[#d9400f] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Reply size={16} className="text-white shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-white">Auto-répondeurs</p>
                    <p className="text-[10px] text-white/70">Réponses automatiques personnalisées</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/70 shrink-0" />
              </div>
              <div
                onClick={() => navigate('/app/email/flux')}
                className="flex items-center justify-between rounded-lg bg-[#F4511E] p-3 cursor-pointer hover:bg-[#d9400f] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-white shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-white">Emails de Bienvenue</p>
                    <p className="text-[10px] text-white/70">Séquences d&apos;onboarding automatiques</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-white/70 shrink-0" />
              </div>
              {/* Drip = relances — compteur réel depuis email_relances */}
              <div
                onClick={() => navigate('/app/email/flux')}
                className="flex items-center justify-between rounded-lg bg-[#F4511E] p-3 cursor-pointer hover:bg-[#d9400f] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GitBranch size={16} className="text-white shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-white">Drip Campaigns</p>
                    <p className="text-[10px] text-white/70">Séquences multi-emails programmées</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s && s.pendingRelances > 0 && (
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">
                      {s.pendingRelances} actif{s.pendingRelances > 1 ? 's' : ''}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-white/70" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Métriques Détaillées ── */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1F2937]">Métriques Détaillées</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Analyse complète de vos performances</p>
            </div>
            <button
              onClick={() => navigate('/app/email/analytics')}
              className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#d9400f]"
            >
              <BarChart2 size={12} /> Voir tout
            </button>
          </div>

          {/* 6 blocs métriques */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {[
              { label: "Taux d'ouverture", value: s ? `${s.openRate}%`   : '—' },
              { label: 'Taux de clic',      value: s ? `${s.clickRate}%` : '—' },
              { label: 'CTOR',              value: ctorStr },
              { label: 'Conversions',       value: '—' },
              { label: 'Désabonnements',    value: s ? `${s.unsubRate}%`                                           : '—' },
              { label: 'Plaintes',          value: s ? (s.spamComplaints > 0 ? `${s.spamRate}%` : '0%')           : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center justify-center rounded-xl bg-[#F4511E] px-3 py-4 text-center">
                {loading
                  ? <div className="h-5 w-12 animate-pulse rounded bg-white/30 mb-1" />
                  : <p className="text-[17px] font-bold text-white leading-tight">{value}</p>
                }
                <p className="text-[10px] text-white/75 mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* 3 cartes détail */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Bounces — hard/soft split */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 shrink-0">
                  <AlertCircle size={15} className="text-red-400" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">Gestion des Bounces</p>
                  <p className="text-[10px] text-gray-400">
                    {s ? `${fmt(s.bounces)} total · ${s.bounceRate}%` : 'Aucune donnée'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Hard Bounces</span>
                  <span className="text-[12px] font-bold text-white">
                    {s ? (s.hardBounces > 0 ? fmt(s.hardBounces) : '0') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Soft Bounces</span>
                  <span className="text-[12px] font-bold text-white">
                    {s ? (s.softBounces > 0 ? fmt(s.softBounces) : '0') : '—'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/email/delivrabilite')}
                className="flex items-center gap-1 text-[11px] text-[#F4511E] font-medium hover:underline"
              >
                <Shield size={11} /> Gérer les bounces →
              </button>
            </div>

            {/* Désabonnements */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 shrink-0">
                  <UserMinus size={15} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">Désabonnements</p>
                  <p className="text-[10px] text-gray-400">
                    {s ? `${fmt(s.unsubscribes)} total` : 'Aucune donnée'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Taux de désabo</span>
                  <span className="text-[12px] font-bold text-white">{s ? `${s.unsubRate}%` : '—'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Total désabonnés</span>
                  <span className="text-[12px] font-bold text-white">{s ? fmt(s.unsubscribes) : '—'}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/email/segmentation')}
                className="flex items-center gap-1 text-[11px] text-[#F4511E] font-medium hover:underline"
              >
                <Users size={11} /> Gérer les désabonnements →
              </button>
            </div>

            {/* Plaintes Spam — données réelles Brevo */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 shrink-0">
                  <Flag size={15} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">Plaintes Spam</p>
                  <p className="text-[10px] text-gray-400">
                    {s ? (s.spamComplaints > 0 ? `${fmt(s.spamComplaints)} signalement(s)` : 'Aucune plainte') : 'Surveillance active'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Taux de plainte</span>
                  <span className="text-[12px] font-bold text-white">
                    {s ? (s.spamComplaints > 0 ? `${s.spamRate}%` : '0%') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[11px] text-white">Total plaintes</span>
                  <span className="text-[12px] font-bold text-white">
                    {s ? fmt(s.spamComplaints) : '—'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/email/delivrabilite')}
                className="flex items-center gap-1 text-[11px] text-[#F4511E] font-medium hover:underline"
              >
                <Shield size={11} /> Gérer les plaintes →
              </button>
            </div>

          </div>
        </div>

        {/* ── Tests A/B ── */}
        {abTests.length > 0 && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-[#F4511E]" />
                <h2 className="text-[14px] font-semibold text-[#1F2937]">Tests A/B</h2>
              </div>
              <button
                onClick={() => setShowAbTestModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f]"
              >
                + Nouveau test
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {abTests.map(test => {
                const isRunning   = test.status === 'running'
                const isCompleted = test.status === 'completed'
                const winnerIsA   = test.winner_id !== null && test.winner_subject === test.subject_a
                const timeLeft    = isRunning ? Math.max(0, Math.ceil((new Date(test.scheduled_at).getTime() - Date.now()) / 3_600_000)) : 0

                return (
                  <div key={test.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[12px] font-semibold text-[#1F2937] truncate">{test.name}</p>
                          {isRunning && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-600">
                              En cours · résultat dans {timeLeft}h
                            </span>
                          )}
                          {isCompleted && (
                            <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-600">
                              <Trophy size={9} /> Terminé
                            </span>
                          )}
                          {test.status === 'cancelled' && (
                            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500">Annulé</span>
                          )}
                        </div>

                        {/* Comparaison A vs B */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className={`flex-1 rounded-lg border px-3 py-2 ${isCompleted && winnerIsA ? 'border-green-300 bg-green-50' : 'border-blue-100 bg-blue-50/50'}`}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-bold text-blue-600">A</span>
                              {isCompleted && winnerIsA && <Trophy size={10} className="text-green-500" />}
                              {test.rate_a !== null && <span className="text-[10px] font-semibold text-gray-700">{test.rate_a}%</span>}
                            </div>
                            <p className="text-[11px] text-gray-700 truncate">{test.subject_a}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{fmt(test.sent_a ?? 0)} envoyés</p>
                          </div>
                          <span className="text-[11px] font-bold text-gray-300">vs</span>
                          <div className={`flex-1 rounded-lg border px-3 py-2 ${isCompleted && !winnerIsA && test.winner_id !== null ? 'border-green-300 bg-green-50' : 'border-orange-100 bg-orange-50/50'}`}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] font-bold text-[#F4511E]">B</span>
                              {isCompleted && !winnerIsA && test.winner_id !== null && <Trophy size={10} className="text-green-500" />}
                              {test.rate_b !== null && <span className="text-[10px] font-semibold text-gray-700">{test.rate_b}%</span>}
                            </div>
                            <p className="text-[11px] text-gray-700 truncate">{test.subject_b}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{fmt(test.sent_b ?? 0)} envoyés</p>
                          </div>
                        </div>

                        {isCompleted && test.winner_subject && (
                          <p className="mt-2 text-[11px] text-green-600 font-medium">
                            ✅ Gagnant envoyé au reste de la liste : &quot;{test.winner_subject}&quot;
                          </p>
                        )}
                      </div>

                      {isRunning && (
                        <button
                          onClick={async () => {
                            if (!confirm('Annuler ce test A/B ?')) return
                            setCancellingAb(test.id)
                            try {
                              await apiFetch.delete(`/email/ab-tests/${test.id}`)
                              setAbTests(prev => prev.map(t => t.id === test.id ? { ...t, status: 'cancelled' } : t))
                            } finally { setCancellingAb(null) }
                          }}
                          disabled={cancellingAb === test.id}
                          className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors shrink-0"
                        >
                          {cancellingAb === test.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* Modal A/B Test */}
      {showAbTestModal && (
        <AbTestModal
          onClose={() => setShowAbTestModal(false)}
          onSuccess={() => load(true)}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
