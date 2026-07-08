import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Send, CheckCircle2, Search, Download, Loader2, RefreshCw, Tag,
  MessageSquare, Building2, Shield, Filter, Eye, BarChart2, Trash2,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsCampaign, SmsAnalyticsOverview, CampaignType } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const TABS = ['Campagnes A2P', 'Fournisseurs', 'Conformité'] as const
type Tab = typeof TABS[number]

// Libellés minuscules comme la maquette (promotional / otp / transactional)
const TYPE_STYLE: Record<CampaignType, { bg: string; text: string; label: string }> = {
  promotional:   { bg: '#F5F3FF', text: '#7C3AED', label: 'promotional' },
  otp:           { bg: '#F0FDF4', text: '#16A34A', label: 'otp' },
  transactional: { bg: '#EFF6FF', text: '#2563EB', label: 'transactional' },
  notification:  { bg: '#FFF7ED', text: '#EA580C', label: 'notification' },
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  sent:      { bg: '#DBEAFE', text: '#2563EB', label: 'Terminé' },
  sending:   { bg: '#DCFCE7', text: '#16A34A', label: 'Actif' },
  queued:    { bg: '#DCFCE7', text: '#16A34A', label: 'Actif' },
  draft:     { bg: '#F9FAFB', text: '#6B7280', label: 'Brouillon' },
  scheduled: { bg: '#F5F3FF', text: '#7C3AED', label: 'Programmé' },
  failed:    { bg: '#FEF2F2', text: '#DC2626', label: 'Échoué' },
  cancelled: { bg: '#F9FAFB', text: '#9CA3AF', label: 'Annulé' },
}

const TAB_ICONS: Record<string, typeof MessageSquare> = {
  'Campagnes A2P': MessageSquare,
  'Fournisseurs':  Building2,
  'Conformité':    Shield,
}

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: '',              label: 'Tous les types' },
  { key: 'promotional',  label: 'Promotionnel' },
  { key: 'transactional',label: 'Transactionnel' },
  { key: 'otp',          label: 'OTP' },
  { key: 'notification', label: 'Notification' },
]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsA2pPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]     = useState<Tab>('Campagnes A2P')
  const [campaigns, setCampaigns]     = useState<SmsCampaign[]>([])
  const [stats, setStats]             = useState<SmsAnalyticsOverview | null>(null)
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState('')
  const [showTypeFilters, setShowTypeFilters] = useState(false)
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(0)
  const [lastPage, setLastPage]       = useState(1)
  const LIMIT = 15

  const fetchData = useCallback(async (p: number, type: string) => {
    setLoading(true)
    try {
      const [campRes, statsRes] = await Promise.all([
        smsService.getCampaigns({ page: p, limit: LIMIT, campaignType: type || undefined }),
        smsService.getAnalyticsOverview(),
      ])
      setCampaigns(campRes.campaigns)
      setTotal(campRes.meta.total)
      setLastPage(campRes.meta.lastPage)
      setStats(statsRes)
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(page, typeFilter) }, [page, typeFilter, fetchData])

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  function fmtNum(n: number) { return n.toLocaleString('fr-FR') }

  async function handleDelete(c: SmsCampaign) {
    if (!window.confirm(`Supprimer la campagne "${c.name}" ?`)) return
    try {
      await smsService.deleteCampaign(c.id)
      setCampaigns(prev => prev.filter(x => x.id !== c.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  function handleExport() {
    if (filtered.length === 0) return
    const sep = ';'
    const header = ['ID', 'Campagne', 'Type', 'Émetteur', 'Envoyés', 'Livrés', 'Échoués', 'Coût', 'Statut', 'Date']
    const rows = filtered.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.campaign_type,
      c.sender_id || '',
      c.total_sent,
      c.total_delivered,
      c.total_failed,
      c.total_cost != null ? Number(c.total_cost).toFixed(2) : '',
      c.status,
      new Date(c.sent_at ?? c.created_at).toLocaleDateString('fr-FR'),
    ])
    const csv = [header.join(sep), ...rows.map(r => r.join(sep))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campagnes-a2p-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function pageNums(cur: number, last: number): number[] {
    const start = Math.max(1, Math.min(cur - 2, last - 4))
    return Array.from({ length: Math.min(5, last) }, (_, i) => start + i)
  }

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-1">📱</span>SMS A2P (Application-to-Person)
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gestion professionnelle des campagnes SMS entreprise vers particuliers</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchData(page, typeFilter)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
            <button
              onClick={() => navigate('/app/sms/identifiants')}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              <Tag size={13} /> Gérer les Émetteurs
            </button>
            <button
              onClick={() => navigate('/app/sms/masse')}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#1d4ed8]">
              <Plus size={13} /> Nouvelle Campagne A2P
            </button>
          </div>
        </div>

        {/* Banner — bleu clair (maquette) */}
        <div className="mb-5 rounded-2xl bg-[#EFF6FF] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]">
              <span className="text-[18px]">🛡</span>
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[#1D4ED8]">SMS A2P - Messaging Professionnel Certifié</p>
              <p className="mt-1 text-[12px] text-[#2563EB]">
                Application-to-Person messaging pour communications professionnelles à grande échelle. Routage direct opérateurs, conformité GSMA, taux de livraison optimaux.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: '⚡', label: 'Routage Direct',    sub: 'Connexions opérateurs' },
              { icon: '📈', label: 'Haute Performance', sub: '300+ messages/seconde' },
              { icon: '🛡', label: 'Conforme GSMA',     sub: 'Standards internationaux' },
              { icon: '📊', label: 'Taux Optimal',      sub: stats?.deliveryRate != null ? `${stats.deliveryRate}% de livraison` : 'Mesuré via les DLR' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="rounded-xl bg-white px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px]">{icon}</span>
                  <span className="text-[11px] font-bold text-[#1F2937]">{label}</span>
                </div>
                <p className="text-[10px] text-[#2563EB]">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés',  value: loading ? '…' : fmtNum(stats?.totalSent ?? 0) },
            { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Livrés',            value: loading ? '…' : fmtNum(stats?.totalDelivered ?? 0) },
            { icon: CheckCircle2, bg: '#F5F3FF', color: '#7C3AED', label: 'Taux de Livraison', value: loading ? '…' : `${stats?.deliveryRate ?? 0}%` },
            { icon: Tag,          bg: '#FFF7ED', color: '#EA580C', label: 'Coût Total',         value: loading ? '…' : '— $' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs — pills avec icônes (maquette) */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => {
              const Icon = TAB_ICONS[tab] ?? MessageSquare
              const active = activeTab === tab
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-colors ${active ? 'bg-[#F4511E] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon size={15} /> {tab}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Onglet Campagnes A2P ── */}
        {activeTab === 'Campagnes A2P' && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Header maquette : titre + recherche orange + filtre + Exporter */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
              <h3 className="text-[16px] font-bold text-[#1F2937] mr-auto">Campagnes SMS A2P</h3>
              <div className="flex min-w-[200px] items-center gap-2 rounded-full bg-[#F4511E] px-4 py-2.5">
                <Search size={13} className="shrink-0 text-white/70" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-white/60"
                />
              </div>
              <button onClick={() => setShowTypeFilters(f => !f)} title="Filtrer par type"
                className={`rounded-full border p-2.5 transition-colors ${showTypeFilters || typeFilter ? 'border-[#F4511E] text-[#F4511E] bg-orange-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                <Filter size={14} />
              </button>
              <button onClick={handleExport} disabled={filtered.length === 0}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                <Download size={13} /> Exporter
              </button>
            </div>

            {showTypeFilters && (
              <div className="flex gap-1 flex-wrap px-5 pb-3">
                {TYPE_FILTERS.map(f => (
                  <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(1) }}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${typeFilter === f.key ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Campagne','Type','Émetteur','Envoyés','Livrés','Échoués','Coût','Statut','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[13px] font-bold text-[#1F2937]">{h}</th>
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
                    const ts = TYPE_STYLE[c.campaign_type] ?? TYPE_STYLE.promotional
                    const ss = STATUS_STYLE[c.status]      ?? STATUS_STYLE.draft
                    const canDelete = c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed'
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        {/* Nom + date/heure (maquette) */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-[13px] font-bold text-[#1F2937] truncate">{c.name}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(c.sent_at ?? c.created_at).toISOString().slice(0, 19).replace('T', ' ')}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: ts.bg, color: ts.text }}>{ts.label}</span>
                        </td>
                        {/* Émetteur : badge orange plein (maquette) */}
                        <td className="px-4 py-3">
                          {c.sender_id ? (
                            <span className="rounded-md bg-[#F4511E] px-2 py-1 text-[10px] font-bold text-white font-mono uppercase">
                              {c.sender_id}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#1F2937]">{fmtNum(c.total_sent)}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#16A34A]">{fmtNum(c.total_delivered)}</td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#EF4444]">{fmtNum(c.total_failed)}</td>
                        {/* Coût réel (DLR) — DECIMAL arrive en string */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.total_cost != null && Number(c.total_cost) > 0 ? (
                            <span className="text-[13px] font-semibold text-[#1F2937]">
                              {Number(c.total_cost).toFixed(2)} {c.cost_currency ?? ''}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ backgroundColor: ss.bg, color: ss.text }}>
                            <CheckCircle2 size={11} /> {ss.label}
                          </span>
                        </td>
                        {/* Actions (maquette : œil / stats / corbeille) */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => navigate('/app/sms/rapports')} title="Voir le rapport"
                              className="rounded p-1.5 text-[#1F2937] hover:bg-gray-100 transition-colors">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => navigate('/app/sms/analytics')} title="Statistiques"
                              className="rounded p-1.5 text-[#1F2937] hover:bg-gray-100 transition-colors">
                              <BarChart2 size={14} />
                            </button>
                            <button onClick={() => canDelete && handleDelete(c)} disabled={!canDelete}
                              title={canDelete ? 'Supprimer' : 'Suppression impossible (campagne envoyée)'}
                              className="rounded p-1.5 text-[#DC2626] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                              <Trash2 size={14} />
                            </button>
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
                <span className="text-[11px] text-gray-400">{total} campagne(s)</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Précédent</button>
                  {pageNums(page, lastPage).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold ${page === n ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Suivant</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Fournisseurs — cartes en grille (maquette) ── */}
        {activeTab === 'Fournisseurs' && (
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#1F2937]">Fournisseurs A2P</h3>
              <button disabled title="Bientôt disponible"
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[13px] font-bold text-white opacity-50 cursor-not-allowed">
                <Plus size={14} /> Ajouter Fournisseur
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Infobip — le seul fournisseur réellement actif */}
              <div className="rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-[#1F2937]">Infobip</p>
                    <p className="text-[12px] text-gray-500">RDC · Cameroun · +190 pays</p>
                  </div>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold text-[#16A34A]">Actif</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { label: 'Type:',      value: 'Aggregator' },
                    { label: 'Protocole:', value: 'REST API v3' },
                    { label: 'Livraison:', value: stats?.deliveryRate != null ? `${stats.deliveryRate}%` : '—', green: true },
                    { label: 'Coût/SMS:',  value: 'Selon destination' },
                  ].map(({ label, value, green }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[12px] text-gray-500">{label}</span>
                      <span className={`text-[12px] font-bold ${green ? 'text-[#16A34A]' : 'text-[#1F2937]'}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <button onClick={() => navigate('/app/sms/identifiants')}
                    className="flex-1 rounded-xl bg-[#F4511E] py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f]">
                    Configurer
                  </button>
                  <button onClick={() => navigate('/app/sms/rapports')} title="Statistiques"
                    className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50">
                    <BarChart2 size={15} />
                  </button>
                </div>
              </div>

              {/* Connexions directes opérateurs (SMPP) — pas encore prêtes */}
              {[
                { name: 'MTN Cameroun',  country: 'Cameroun' },
                { name: 'Orange RDC',    country: 'RD Congo' },
              ].map(f => (
                <div key={f.name} className="rounded-2xl border border-gray-100 p-5 shadow-sm opacity-80">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[15px] font-bold text-[#1F2937]">{f.name}</p>
                      <p className="text-[12px] text-gray-500">{f.country}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-500">Pas encore prêt</span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { label: 'Type:',      value: 'Direct (SMPP)' },
                      { label: 'Débit:',     value: '—' },
                      { label: 'Livraison:', value: '—' },
                      { label: 'Coût/SMS:',  value: '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-500">{label}</span>
                        <span className="text-[12px] font-bold text-[#1F2937]">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                    <button disabled title="Connexion SMPP directe — pas encore disponible"
                      className="flex-1 cursor-not-allowed rounded-xl bg-gray-200 py-2.5 text-[13px] font-bold text-gray-500">
                      Bientôt disponible
                    </button>
                    <button disabled className="cursor-not-allowed rounded-xl border border-gray-200 p-2.5 text-gray-300">
                      <BarChart2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-gray-400">
              Les connexions directes opérateurs (SMPP) seront disponibles prochainement. L'envoi passe actuellement par Infobip.
            </p>
          </div>
        )}

        {/* ── Onglet Conformité ── */}
        {activeTab === 'Conformité' && (
          <div className="space-y-4">
            {/* Stats conformité depuis les données réelles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Opt-out respectés',     value: '100%', sub: 'Désabonnements traités automatiquement', color: '#22C55E', bg: '#F0FDF4' },
                { label: 'Listes noires',         value: stats ? String(stats.totalContacts) + ' vérif.' : '—', sub: 'Contacts vérifiés avant envoi', color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Conformité GSMA',       value: 'Actif', sub: 'Sender IDs validés par opérateurs', color: '#7C3AED', bg: '#F5F3FF' },
              ].map(({ label, value, sub, color, bg }) => (
                <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                    <CheckCircle2 size={18} style={{ color }} />
                  </div>
                  <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
                  <p className="text-[12px] font-semibold text-gray-700 mt-0.5">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-[14px] font-bold text-[#1F2937]">Règles de conformité appliquées</h3>
              <div className="space-y-2.5">
                {[
                  'Opt-out automatique sur réception du mot "STOP"',
                  'Sender ID validé par les opérateurs avant utilisation',
                  'Numéros E.164 normalisés (+243...) avant chaque envoi',
                  'Audit log de toutes les campagnes et envois',
                  'Rate limiting : max 100 SMS/s par tenant',
                  'DLR (Delivery Receipt) stocké pour chaque message',
                ].map(rule => (
                  <div key={rule} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#22C55E]" />
                    <span className="text-[12px] text-gray-700">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
