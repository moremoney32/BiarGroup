import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  CheckCircle, Clock, XCircle, Zap, ChevronLeft, ChevronRight,
  RefreshCw, Settings, Download, FileText, BarChart2, Activity,
  Phone, AlertCircle, Plus, Search, Eye, Trash2, Bell, Mail,
} from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

interface DlrData {
  kpis: { delivered: number; pending: number; failed: number; avgTimeMs: number }
  statusDistribution: { name: string; value: number; pct: number }[]
  byHour: { hour: string; count: number }[]
  deliveryTimeDistrib: { range: string; count: number }[]
  byOperator: { operator: string; delivered: number; failed: number }[]
  errorCodes: { code: string; label: string; count: number }[]
  messages: { messageId: number; phone: string; status: string; sentAt: string; deliveryTime: number | null; operator: string | null; errorCode: string | null }[]
  total: number
}

const STATUS_BADGE: Record<string, { cls: string; label: string; icon: typeof CheckCircle }> = {
  delivered:   { cls: 'bg-green-100 text-green-700',   label: 'Délivré',    icon: CheckCircle },
  sent:        { cls: 'bg-blue-100 text-blue-700',     label: 'Envoyé',     icon: CheckCircle },
  pending:     { cls: 'bg-yellow-100 text-yellow-700', label: 'En attente', icon: Clock },
  queued:      { cls: 'bg-yellow-100 text-yellow-700', label: 'En attente', icon: Clock },
  undelivered: { cls: 'bg-red-100 text-red-700',       label: 'Échec',      icon: XCircle },
  failed:      { cls: 'bg-red-100 text-red-700',       label: 'Échec',      icon: XCircle },
}

const ERROR_CODE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#6B7280', '#EC4899']

// Règles d'alerte DLR — configuration locale en attendant le backend
const DEFAULT_RULES = [
  {
    id: 1, name: "Taux d'échec élevé", severity: 'high' as const, channel: 'Email',
    condition: 'failure_rate > 5%', target: 'admin@biargroup.com', enabled: true,
  },
  {
    id: 2, name: 'Messages en attente', severity: 'medium' as const, channel: 'Notification',
    condition: 'pending_count > 100', target: null, enabled: true,
  },
]

export default function SmsRapportDlrPage() {
  const [data, setData] = useState<DlrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rules, setRules] = useState(DEFAULT_RULES)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) qs.set('status', status)
      const r = await api.get<{ data: DlrData }>(`/sms/analytics/dlr?${qs}`)
      setData(r.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { load() }, [load])

  const lastPage = data ? Math.ceil(data.total / 20) : 1
  const mask = (p: string) => p.replace(/(\+?\d{3})\d+(\d{3})/, '$1****$2')
  const fmt  = (d: string) => new Date(d).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const totalMsgs   = (data?.kpis.delivered ?? 0) + (data?.kpis.pending ?? 0) + (data?.kpis.failed ?? 0)
  const successPct  = totalMsgs > 0 ? Math.round((data!.kpis.delivered / totalMsgs) * 1000) / 10 : 0
  const pendingPct  = totalMsgs > 0 ? Math.round((data!.kpis.pending  / totalMsgs) * 1000) / 10 : 0
  const failedPct   = totalMsgs > 0 ? Math.round((data!.kpis.failed   / totalMsgs) * 1000) / 10 : 0
  const avgSec      = data ? Math.round(data.kpis.avgTimeMs / 100) / 10 : 0

  const maxErrCount = Math.max(1, ...(data?.errorCodes ?? []).map(e => e.count))

  // Filtre client sur les messages chargés
  const visibleMessages = (data?.messages ?? []).filter(m =>
    !search || m.phone.includes(search) || String(m.messageId).includes(search) || (m.operator ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function exportCsv() {
    if (!data?.messages.length) return
    const header = 'ID Message;Destinataire;Statut;Horodatage;Temps;Opérateur;Code erreur'
    const rows = data.messages.map(m =>
      [m.messageId, m.phone, STATUS_BADGE[m.status]?.label ?? m.status, fmt(m.sentAt),
       m.deliveryTime != null ? `${(m.deliveryTime / 1000).toFixed(1)}s` : '—',
       m.operator ?? '—', m.errorCode ?? '—'].join(';')
    ).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapport-dlr-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
            <FileText size={22} className="text-[#F4511E]" />
            Rapport DLR (Delivery Report)
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Analyse détaillée et interactive des rapports de livraison SMS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button title="Configuration DLR — bientôt disponible"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
            <Settings size={13} /> Config
          </button>
          <button onClick={exportCsv} disabled={!data?.messages.length}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI — cartes pleines couleurs (maquette) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: CheckCircle, gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
            label: 'Délivrés', value: loading ? '…' : (data?.kpis.delivered ?? 0).toLocaleString('fr-FR'),
            sub: `${successPct}% taux de succès`,
          },
          {
            icon: Clock, gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
            label: 'En attente', value: loading ? '…' : (data?.kpis.pending ?? 0).toLocaleString('fr-FR'),
            sub: `${pendingPct}% du total`,
          },
          {
            icon: XCircle, gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
            label: 'Échecs', value: loading ? '…' : (data?.kpis.failed ?? 0).toLocaleString('fr-FR'),
            sub: `${failedPct}% échec`,
          },
          {
            icon: Zap, gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            label: 'Temps Moyen', value: loading ? '…' : `${avgSec}s`,
            sub: `${totalMsgs.toLocaleString('fr-FR')} tentatives`,
          },
        ].map(({ icon: Icon, gradient, label, value, sub }) => (
          <div key={label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: gradient }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-white/85">{label}</p>
                <p className="mt-1 text-[24px] font-bold">{value}</p>
              </div>
              <Icon size={30} className="text-white/40" />
            </div>
            <p className="mt-2 text-[11px] text-white/85">{sub}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucune donnée DLR disponible.</p>
        </div>
      ) : (
        <>
          {/* Distribution par Statut + Évolution DLR */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <BarChart2 size={14} className="text-[#F4511E]" />
                Distribution par Statut
              </h2>
              {data.statusDistribution.filter(d => d.value > 0).length > 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data.statusDistribution.filter(d => d.value > 0)}
                        cx="50%" cy="50%" outerRadius={95} dataKey="value" stroke="none">
                        {data.statusDistribution.filter(d => d.value > 0).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3">
                    {data.statusDistribution.filter(d => d.value > 0).map((d, i) => (
                      <span key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}: {d.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-gray-400">Aucun message</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                  <Activity size={14} className="text-[#F4511E]" />
                  Évolution DLR
                </h2>
                <span className="rounded-xl border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-600">
                  Aujourd'hui
                </span>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={data.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Délivrés" fill="#10B981" stroke="#10B981" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temps de livraison + Performance par opérateur */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Clock size={14} className="text-[#F4511E]" />
                Distribution Temps de Livraison
              </h2>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={data.deliveryTimeDistrib}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Messages" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Phone size={14} className="text-[#F4511E]" />
                Performance par Opérateur
              </h2>
              {data.byOperator.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={data.byOperator} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="operator" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="delivered" name="delivered" fill="#10B981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="failed"    name="failed"    fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-400">Données opérateur disponibles après réception des DLR</p>
              )}
            </div>
          </div>

          {/* Codes d'Erreur DLR — cartes (maquette) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <AlertCircle size={14} className="text-[#F4511E]" />
              Codes d'Erreur DLR
            </h2>
            {data.errorCodes.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.errorCodes.map((e, i) => {
                  const color = ERROR_CODE_COLORS[i % ERROR_CODE_COLORS.length]
                  return (
                    <div key={e.code} className="rounded-xl border border-gray-100 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-2 font-mono text-[13px] font-bold text-[#1F2937]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          Code {e.code}
                        </span>
                        <span className="text-[13px] font-bold text-[#1F2937]">{e.count.toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="mb-2 text-[12px] text-gray-500">{e.label}</p>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((e.count / maxErrCount) * 100)}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Aucun code d'erreur enregistré</p>
            )}
          </div>

          {/* Règles et Alertes DLR (maquette) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Settings size={14} className="text-[#F4511E]" />
                Règles et Alertes DLR
              </h2>
              <button title="Bientôt disponible"
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                <Plus size={12} /> Nouvelle Règle
              </button>
            </div>
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-bold text-[#1F2937]">{rule.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rule.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                          {rule.severity}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          {rule.channel === 'Email' ? <Mail size={11} /> : <Bell size={11} />}
                          {rule.channel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] text-gray-500">Condition: {rule.condition}</p>
                      {rule.target && <p className="text-[12px] text-gray-500">Destinataires: {rule.target}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                        aria-label={rule.enabled ? 'Désactiver la règle' : 'Activer la règle'}
                        className={`relative h-6 w-11 rounded-full transition-colors ${rule.enabled ? 'bg-[#F4511E]' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rule.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                      </button>
                      <button
                        onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                        aria-label="Supprimer la règle"
                        className="rounded p-1.5 text-red-400 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {rules.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-400">Aucune règle — créez-en une avec "Nouvelle Règle"</p>
              )}
            </div>
          </div>

          {/* Recherche + filtre statuts */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par destinataire, ID message, opérateur..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-[12px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                />
              </div>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1) }}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-medium text-gray-700 focus:border-[#F4511E] focus:outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="delivered">Délivrés</option>
                <option value="pending">En attente</option>
                <option value="failed">Échecs</option>
              </select>
            </div>
          </div>

          {/* Table des messages */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F5F3FF]/60">
                  <tr>
                    {['ID Message', 'Destinataire', 'Statut', 'Horodatage', 'Temps', 'Opérateur', 'Tentatives', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[12px] font-bold text-[#1F2937] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visibleMessages.length === 0 && (
                    <tr><td colSpan={8} className="py-10 text-center text-gray-400">Aucun message trouvé</td></tr>
                  )}
                  {visibleMessages.map(m => {
                    const sb = STATUS_BADGE[m.status] ?? { cls: 'bg-gray-100 text-gray-600', label: m.status, icon: Clock }
                    const SbIcon = sb.icon
                    return (
                      <tr key={m.messageId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">MSG-{String(m.messageId).padStart(6, '0')}</td>
                        <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{mask(m.phone)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sb.cls}`}>
                            <SbIcon size={10} /> {sb.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(m.sentAt)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {m.deliveryTime != null ? `${(m.deliveryTime / 1000).toFixed(1)}s` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.operator ?? '—'}</td>
                        {/* Tentatives — non tracké côté Infobip pour l'instant */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${m.status === 'delivered' ? 'bg-green-100 text-green-700' : m.status === 'failed' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {m.status === 'delivered' ? 0 : 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button className="rounded p-1.5 text-[#3B82F6] hover:bg-blue-50" title="Détails — bientôt disponible">
                              <Eye size={13} />
                            </button>
                            <button className="rounded p-1.5 text-gray-300 cursor-not-allowed" title="Supprimer — bientôt disponible" disabled>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={12} /> Précédent
                </button>
                <span className="text-xs text-gray-500">{page} / {lastPage}</span>
                <button
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage || loading}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Suivant <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}
