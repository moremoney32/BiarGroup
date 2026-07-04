import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock, Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react'
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
  campaign_id: number | null
  campaign_name: string | null
  created_at: string
  delivered_at: string | null
}

interface Meta { page: number; perPage: number; total: number; lastPage: number }

const STATUS_LABEL: Record<string, string> = {
  delivered:   'Délivré',
  sent:        'Envoyé',
  queued:      'En file',
  pending:     'En attente',
  undelivered: 'Non délivré',
  failed:      'Échec',
}

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
  const [showFilters, setShowFilters] = useState(false)
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

  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const mask = (p: string) => p.replace(/(\+?\d{3})\d+(\d{3})/, '$1****$2')

  function exportCsv() {
    if (messages.length === 0) return
    const header = 'Date;Destinataire;Message;Campagne;Statut'
    const rows = messages.map(m =>
      [fmt(m.created_at), m.phone, `"${m.body.replace(/"/g, '""')}"`,
       m.campaign_name ?? '—', STATUS_LABEL[m.status] ?? m.status].join(';')
    ).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historique-sms-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
    <motion.div {...fade} className="space-y-5 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
          <Clock size={22} className="text-[#F4511E]" />
          Historique SMS
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500">Consultez l'historique complet de vos envois SMS</p>
      </div>

      {/* Barre recherche + filtres + export (maquette) */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-[12px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
            />
          </div>
          <button type="button" onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[12px] font-semibold ${showFilters ? 'border-[#F4511E] bg-orange-50 text-[#F4511E]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={13} /> Filtres
          </button>
          <button type="button" onClick={exportCsv} disabled={messages.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
            <Download size={13} /> Exporter
          </button>
        </form>
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
            {[
              { label: 'Tous les statuts', value: '' },
              { label: 'Délivrés',     value: 'delivered' },
              { label: 'Envoyés',      value: 'sent' },
              { label: 'En attente',   value: 'pending' },
              { label: 'Non délivrés', value: 'undelivered' },
              { label: 'Échecs',       value: 'failed' },
            ].map(s => (
              <button key={s.value} type="button"
                onClick={() => { setStatus(s.value); setPage(1) }}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors ${status === s.value ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Clock size={14} className="text-[#F4511E]" />
            {meta.total.toLocaleString()} message{meta.total !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">Page {meta.page} / {meta.lastPage}</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <Clock size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Aucun message trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F5F3FF]/60">
                <tr>
                  {['Date', 'Destinataire', 'Message', 'Campagne', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[12px] font-bold text-[#1F2937]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {messages.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(m.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{mask(m.phone)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[280px]">
                      <span className="block truncate">{m.body}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{m.campaign_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
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
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={12} /> Précédent
            </button>
            <span className="text-xs text-gray-500">{page} / {meta.lastPage}</span>
            <button
              onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
              disabled={page === meta.lastPage || loading}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
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
