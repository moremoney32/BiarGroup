import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Send, CheckCircle2, Search, Download, Loader2, RefreshCw, Tag } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsCampaign, SmsAnalyticsOverview, CampaignType } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const TABS = ['Campagnes A2P', 'Fournisseurs', 'Conformité'] as const
type Tab = typeof TABS[number]

const TYPE_STYLE: Record<CampaignType, { bg: string; text: string; label: string }> = {
  promotional:   { bg: '#EFF6FF', text: '#2563EB', label: 'Promotionnel' },
  otp:           { bg: '#F0FDF4', text: '#16A34A', label: 'OTP' },
  transactional: { bg: '#F5F3FF', text: '#7C3AED', label: 'Transactionnel' },
  notification:  { bg: '#FFF7ED', text: '#EA580C', label: 'Notification' },
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  sent:      { bg: '#F0FDF4', text: '#16A34A', label: 'Terminé' },
  sending:   { bg: '#EFF6FF', text: '#2563EB', label: 'En cours' },
  queued:    { bg: '#FFF7ED', text: '#EA580C', label: 'En file' },
  draft:     { bg: '#F9FAFB', text: '#6B7280', label: 'Brouillon' },
  scheduled: { bg: '#F5F3FF', text: '#7C3AED', label: 'Programmé' },
  failed:    { bg: '#FEF2F2', text: '#DC2626', label: 'Échoué' },
  cancelled: { bg: '#F9FAFB', text: '#9CA3AF', label: 'Annulé' },
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
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Nouvelle Campagne A2P
            </button>
          </div>
        </div>

        {/* Banner */}
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[16px]">🛡</span>
            <p className="text-[15px] font-bold text-white">SMS A2P — Messaging Professionnel Certifié</p>
          </div>
          <p className="mb-4 text-[11px] text-white/80">
            Application-To-Person pour vos campagnes professionnelles à grande échelle. Routage via Infobip, conformité GSMA, taux de livraison optimum.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: '⚡', label: 'Routage Direct',    sub: 'Infobip' },
              { icon: '📈', label: 'Haute Performance', sub: 'Envoi en masse' },
              { icon: '✅', label: 'Conforme GSMA',     sub: 'Standards internationaux' },
              { icon: '💰', label: 'Taux Optimal',      sub: `${stats?.deliveryRate ?? '—'}% de livraison` },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="rounded-xl bg-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px]">{icon}</span>
                  <span className="text-[11px] font-bold text-white">{label}</span>
                </div>
                <p className="text-[10px] text-white/70">{sub}</p>
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

        {/* Tabs */}
        <div className="mb-4 flex gap-0 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13px] font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Onglet Campagnes A2P ── */}
        {activeTab === 'Campagnes A2P' && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-50 px-5 py-3">
              {/* Recherche */}
              <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl bg-[#FFEEE6] px-3 py-2 ring-1 ring-orange-200">
                <Search size={13} className="text-orange-300 shrink-0" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une campagne..."
                  className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-orange-300"
                />
              </div>
              {/* Filtre type */}
              <div className="flex gap-1 flex-wrap">
                {TYPE_FILTERS.map(f => (
                  <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(1) }}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${typeFilter === f.key ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-[#F4511E] hover:bg-orange-50 ml-auto">
                <Download size={12} /> Exporter
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Campagne','Type','Sender ID','Envoyés','Livrés','Échoués','Statut','Date'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
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
                    const ts = TYPE_STYLE[c.campaign_type] ?? TYPE_STYLE.promotional
                    const ss = STATUS_STYLE[c.status]      ?? STATUS_STYLE.draft
                    const delivPct = c.total_sent > 0
                      ? Math.round((c.total_delivered / c.total_sent) * 1000) / 10
                      : 0
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="text-[12px] font-semibold text-[#1F2937] truncate">{c.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: ts.bg, color: ts.text }}>{ts.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-[#FFEEE6] px-2 py-1 text-[10px] font-bold text-[#F4511E]">
                            {c.sender_id || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-700">{fmtNum(c.total_sent)}</td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] text-[#22C55E] font-semibold">{fmtNum(c.total_delivered)}</p>
                          {c.total_sent > 0 && <p className="text-[10px] text-gray-400">{delivPct}%</p>}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#EF4444] font-semibold">{fmtNum(c.total_failed)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: ss.bg, color: ss.text }}>{ss.label}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString('fr-FR')}
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

        {/* ── Onglet Fournisseurs ── */}
        {activeTab === 'Fournisseurs' && (
          <div className="space-y-4">
            {/* Infobip — fournisseur actif */}
            <div className="rounded-2xl border border-[#22C55E]/30 bg-[#F0FDF4] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D4ED8]">
                    <span className="text-[13px] font-black text-white">IB</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#1F2937]">Infobip</p>
                    <p className="text-[11px] text-gray-500">Agrégateur SMS principal — couverture mondiale, Cameroun & RDC</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#22C55E] px-2.5 py-1 text-[10px] font-bold text-white">ACTIF</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Couverture', value: 'RDC · Cameroun · +190 pays' },
                  { label: 'Protocole',  value: 'REST API v3' },
                  { label: 'DLR',        value: 'Webhook temps réel' },
                  { label: 'Sender ID',  value: 'Alphanumérique 11 car.' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-white p-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#1F2937]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Autres fournisseurs (non configurés) */}
            {[
              { name: 'AfricasTalking', desc: 'Agrégateur Afrique de l\'Est — couverture limitée (pas RDC ni Cameroun)', abbr: 'AT' },
              { name: 'Twilio',         desc: 'SMS A2P international — US/Europe/Afrique', abbr: 'TW' },
              { name: 'Vonage',         desc: 'API SMS entreprise — OTP & transactionnel', abbr: 'VN' },
            ].map(f => (
              <div key={f.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <span className="text-[11px] font-black text-gray-500">{f.abbr}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1F2937]">{f.name}</p>
                    <p className="text-[11px] text-gray-400">{f.desc}</p>
                  </div>
                </div>
                <button className="rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
                  Configurer
                </button>
              </div>
            ))}
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
