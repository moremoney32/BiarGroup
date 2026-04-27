import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Eye, MousePointer, RotateCcw, CheckCircle2,
  Search, Star, Zap, Users,
  Loader2, Trash2, RefreshCw, Info,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'

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

interface Stats {
  totalSent: number
  totalRecipients: number
  totalFailed: number
  totalCampaigns: number
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubRate: number
  deliverRate: number
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  sent:      { label: 'Envoyé',    color: '#10B981' },
  sending:   { label: 'En cours',  color: '#F4511E' },
  scheduled: { label: 'Planifié',  color: '#6366F1' },
  queued:    { label: 'En attente',color: '#3B82F6' },
  draft:     { label: 'Brouillon', color: '#9CA3AF' },
  failed:    { label: 'Échoué',    color: '#EF4444' },
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR')
}

function pct(num: number, denom: number) {
  if (!denom) return '—'
  return (num / denom * 100).toFixed(1) + '%'
}

export default function CampagnesEmailPage() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats]         = useState<Stats | null>(null)
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting]     = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [cRes, sRes] = await Promise.all([
        apiFetch.get<{ data: Campaign[] }>('/email/campaigns'),
        apiFetch.get<{ data: Stats }>('/email/campaigns/stats'),
      ])
      setCampaigns(cRes.data)
      setStats(sRes.data)
      setLastUpdate(new Date())
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Chargement initial + auto-refresh toutes les 30 secondes
  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
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

  const filtered = campaigns.filter(c =>
    (c.name ?? c.sujet).toLowerCase().includes(search.toLowerCase())
  )

  const s = stats

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  const topStats = [
    { icon: Send,          color: '#3B82F6', bg: '#EFF6FF', label: 'Emails envoyés',        value: s ? fmt(s.totalSent)       : '—', trend: `${s?.totalCampaigns ?? 0} campagnes`, note: null },
    { icon: CheckCircle2,  color: '#10B981', bg: '#ECFDF5', label: 'Taux de délivrabilité', value: s ? `${s.deliverRate}%`    : '—', trend: s ? `${fmt(s.totalRecipients)} dest.` : '', note: null },
    { icon: Eye,           color: '#8B5CF6', bg: '#F5F3FF', label: "Taux d'ouverture",      value: s ? `${s.openRate}%`       : '—', trend: s ? `${fmt(s.opens)} ouvert.` : '', note: isLocalhost ? 'Inactif en local — nécessite HTTPS en production' : null },
    { icon: MousePointer,  color: '#F4511E', bg: '#FFF7F5', label: 'Taux de clic',          value: s ? `${s.clickRate}%`      : '—', trend: s ? `${fmt(s.clicks)} clics` : '', note: null },
    { icon: RotateCcw,     color: '#EF4444', bg: '#FEF2F2', label: 'Échouées',              value: s ? fmt(s.totalFailed)     : '—', trend: s ? `${s.bounceRate}% rebond` : '', note: null },
  ]

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Email Marketing</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="text-[13px] text-gray-500">Gestion complète de vos campagnes email &amp; newsletters</p>
              {lastUpdate && (
                <span className="text-[11px] text-gray-400">
                  · Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Rafraîchir les statistiques"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button
              onClick={() => navigate('/app/email/modeles')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <Star size={13} /> Templates
            </button>
            <button
              onClick={() => navigate('/app/email/flux')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <Zap size={13} /> Automation
            </button>
            <button
              onClick={() => navigate('/app/email/editeur')}
              className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
            >
              + Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-5 gap-3">
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

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#F4511E]/30 bg-[#FFF7F5] py-2 pl-8 pr-4 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20"
            />
          </div>
        </div>

        {/* Table */}
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
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <Loader2 size={20} className="mx-auto animate-spin text-[#F4511E]" />
                    </td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-gray-400">
                      {search ? 'Aucune campagne ne correspond à la recherche.' : 'Aucune campagne pour l\'instant. Créez votre première campagne !'}
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(c => {
                  const { label, color } = STATUS_MAP[c.status] ?? { label: c.status, color: '#9CA3AF' }
                  const openRate = c.total_sent > 0 ? (c.opens / c.total_sent * 100) : 0
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#1F2937]">{c.name ?? c.sujet}</p>
                        {c.name && <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{c.sujet}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
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
                        <p className="text-[11px] text-blue-500">{pct(c.opens, c.total_sent)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-700">{fmt(c.clicks)}</p>
                        <p className="text-[11px] text-green-500">{pct(c.clicks, c.total_sent)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-[#F4511E]" style={{ width: `${Math.min(openRate, 100)}%` }} />
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

        {/* Action cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { icon: Send,  label: 'Créer une campagne',    sub: 'Composez et envoyez un email à vos contacts',    bg: 'from-blue-400 to-indigo-500',   to: '/app/email/editeur' },
            { icon: Users, label: 'Segmentation avancée',  sub: 'Gérez vos groupes et ciblez avec précision',     bg: 'from-purple-400 to-pink-500',   to: '/app/email/segmentation' },
            { icon: Zap,   label: 'Marketing Automation',  sub: 'Workflows automatisés déclenchés par événement', bg: 'from-green-400 to-emerald-500', to: '/app/email/flux' },
          ].map(({ icon: Icon, label, sub, bg, to }) => (
            <div key={label} onClick={() => navigate(to)} className={`cursor-pointer rounded-xl bg-gradient-to-br ${bg} p-5 text-white hover:opacity-90 transition-opacity`}>
              <Icon size={22} className="mb-3 opacity-90" />
              <p className="text-[13px] font-semibold">{label}</p>
              <p className="mt-1 text-[11px] opacity-80">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
