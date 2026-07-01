import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface SmsMessage {
  id: number
  phone: string
  sender_id: string
  body: string
  status: string
  operator: string | null
  error_code: string | null
  delivery_time_ms: number | null
  cost: number | null
  created_at: string
  delivered_at: string | null
}

interface Meta { page: number; perPage: number; total: number; lastPage: number }

const STATUS_COLORS: Record<string, string> = {
  delivered:   'bg-green-100 text-green-700',
  sent:        'bg-blue-100 text-blue-700',
  queued:      'bg-yellow-100 text-yellow-700',
  pending:     'bg-yellow-100 text-yellow-700',
  undelivered: 'bg-red-100 text-red-700',
  failed:      'bg-red-100 text-red-700',
}

export default function SmsHistoriquePage() {
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [meta, setMeta] = useState<Meta>({ page: 1, perPage: 20, total: 0, lastPage: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) qs.set('search', search)
      if (status) qs.set('status', status)
      const r = await api.get<{ data: SmsMessage[]; meta: Meta }>(`/sms/analytics/historique?${qs}`)
      setMessages(r.data)
      setMeta(r.meta ?? { page, perPage: 20, total: 0, lastPage: 1 })
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  const mask = (p: string) => p.replace(/(\+?\d{3})\d+(\d{3})/, '$1****$2')

  return (
    <div>
    <motion.div {...fade} className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Historique SMS</h1>
        <p className="text-sm text-gray-500">Tous vos messages individuels avec statuts de livraison</p>
      </div>

      {/* Filtres */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un numéro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-700 focus:border-[#E91E8C] focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="appearance-none rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-700 focus:border-[#E91E8C] focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="delivered">Délivrés</option>
              <option value="sent">Envoyés</option>
              <option value="pending">En attente</option>
              <option value="undelivered">Non délivrés</option>
              <option value="failed">Échecs</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-[#E91E8C] px-4 py-2 text-sm font-medium text-white hover:bg-[#c9186e]">
            Rechercher
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock size={14} className="text-[#E91E8C]" />
            {meta.total.toLocaleString()} message{meta.total !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">Page {meta.page} / {meta.lastPage}</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Aucun message trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Destinataire</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Expéditeur</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 max-w-[200px]">Message</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Statut</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Opérateur</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Délai livr.</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {messages.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-gray-700">{mask(m.phone)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{m.sender_id || '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[200px]">
                      <span className="block truncate">{m.body}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{m.operator ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {m.delivery_time_ms != null ? `${(m.delivery_time_ms / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{fmt(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={12} /> Précédent
            </button>
            <span className="text-xs text-gray-500">{page} / {meta.lastPage}</span>
            <button
              onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage || loading}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Suivant <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
    <DashboardFooter />
    </div>
  )
}
