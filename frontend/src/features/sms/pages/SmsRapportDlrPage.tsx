import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { CheckCircle, Clock, XCircle, Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280']

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

const STATUS_COLORS: Record<string, string> = {
  delivered:   'bg-green-100 text-green-700',
  sent:        'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-700',
  undelivered: 'bg-red-100 text-red-700',
  failed:      'bg-red-100 text-red-700',
}

export default function SmsRapportDlrPage() {
  const [data, setData] = useState<DlrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

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
  const fmt  = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rapport DLR</h1>
        <p className="text-sm text-gray-500">Delivery Level Reports — statuts de livraison détaillés</p>
      </div>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Délivrés',    value: data?.kpis.delivered ?? 0,  icon: CheckCircle, color: '#10B981' },
              { label: 'En attente',  value: data?.kpis.pending ?? 0,    icon: Clock,       color: '#F59E0B' },
              { label: 'Échecs',      value: data?.kpis.failed ?? 0,     icon: XCircle,     color: '#EF4444' },
              { label: 'Délai moyen', value: data?.kpis.avgTimeMs ?? 0,  icon: Activity,    color: '#3B2F8F', suffix: 'ms' },
            ].map(({ label, value, icon: Icon, color, suffix }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{label}</p>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {value.toLocaleString()}{suffix ?? ''}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribution statuts */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Distribution des statuts DLR</h2>
              {(data?.statusDistribution ?? []).filter(d => d.value > 0).length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={(data?.statusDistribution ?? []).filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" paddingAngle={3}
                      >
                        {(data?.statusDistribution ?? []).filter(d => d.value > 0).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString()} (${n})`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3">
                    {(data?.statusDistribution ?? []).filter(d => d.value > 0).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-xs text-gray-600">{d.name} {d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">Aucune donnée</p>
              )}
            </div>

            {/* Temps de livraison */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Distribution du temps de livraison</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.deliveryTimeDistrib ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Messages" fill="#E91E8C" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Par opérateur */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Par opérateur</h2>
              {(data?.byOperator ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(data?.byOperator ?? []).map(op => {
                    const total = op.delivered + op.failed
                    const pct = total > 0 ? Math.round((op.delivered / total) * 100) : 0
                    return (
                      <div key={op.operator} className="flex items-center gap-3">
                        <span className="w-24 truncate text-xs font-medium text-gray-700">{op.operator}</span>
                        <div className="flex-1 rounded-full bg-gray-100" style={{ height: 6 }}>
                          <div className="h-full rounded-full bg-[#E91E8C]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right text-xs text-gray-500">{pct}%</span>
                        <span className="w-16 text-right text-xs text-gray-400">{total.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Aucune donnée opérateur (colonnes DLR à remplir)</p>
              )}
            </div>

            {/* Codes d'erreur */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Codes d'erreur fréquents</h2>
              {(data?.errorCodes ?? []).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left font-medium text-gray-500">Code</th>
                        <th className="pb-2 text-left font-medium text-gray-500">Libellé</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Occurrences</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(data?.errorCodes ?? []).map(e => (
                        <tr key={e.code}>
                          <td className="py-1.5 font-mono text-gray-600">{e.code}</td>
                          <td className="py-1.5 text-gray-600">{e.label}</td>
                          <td className="py-1.5 text-right font-semibold text-red-600">{e.count.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">Aucun code d'erreur enregistré</p>
              )}
            </div>
          </div>

          {/* Table messages DLR */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-700">Messages — détail DLR</h2>
              <div className="flex items-center gap-2">
                <Filter size={12} className="text-gray-400" />
                <select
                  value={status}
                  onChange={e => { setStatus(e.target.value); setPage(1) }}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 focus:outline-none"
                >
                  <option value="">Tous</option>
                  <option value="delivered">Délivrés</option>
                  <option value="undelivered">Non délivrés</option>
                  <option value="failed">Échecs</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Destinataire</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Statut</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Opérateur</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Délai</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Code err.</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date envoi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.messages ?? []).map(m => (
                    <tr key={m.messageId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono">{mask(m.phone)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{m.operator ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.deliveryTime != null ? `${(m.deliveryTime / 1000).toFixed(1)}s` : '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-500">{m.errorCode ?? '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400">{fmt(m.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={12} /> Précédent
                </button>
                <span className="text-xs text-gray-500">{page} / {lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage || loading}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Suivant <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}