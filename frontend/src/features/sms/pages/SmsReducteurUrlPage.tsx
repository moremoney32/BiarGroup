import { useState, useEffect, useCallback } from 'react'
import { Link, MousePointer, Globe, TrendingUp, Plus, Copy, CheckCircle2, Loader2, Trash2, BarChart2, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import { useToast } from '../../../hooks/useToast'
import type { SmsShortLink } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const TABS = ['+ Créer un lien', 'Mes liens', 'Analytics', 'Domaines'] as const
type Tab = typeof TABS[number]

// Base URL du redirect — DOIT être absolue (https://...) pour être cliquable dans un SMS.
// En prod VITE_API_URL est relatif ("/api/v1" derrière nginx) → on l'absolutise avec le domaine courant.
const REDIRECT_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL as string ?? 'http://localhost:5000/api/v1').replace(/\/+$/, '')
  try {
    return new URL(raw, window.location.origin).toString().replace(/\/+$/, '')
  } catch {
    return raw
  }
})()
const REDIRECT_HOST = (() => {
  try { return new URL(REDIRECT_BASE).host } catch { return REDIRECT_BASE }
})()

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsReducteurUrlPage() {
  const toast = useToast()
  const [activeTab, setActiveTab]   = useState<Tab>('+ Créer un lien')
  const [links, setLinks]           = useState<SmsShortLink[]>([])
  const [loadingLinks, setLoadingL] = useState(false)

  // Formulaire
  const [url, setUrl]           = useState('')
  const [titre, setTitre]       = useState('')
  const [customCode, setCode]   = useState('')
  const [expDate, setExpDate]   = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated]   = useState<SmsShortLink | null>(null)
  const [errCreate, setErrC]    = useState('')
  const [copiedId, setCopiedId] = useState<number | 'new' | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Modal stats
  const [statsLink, setStatsLink]   = useState<SmsShortLink | null>(null)
  const [statsData, setStatsData]   = useState<{ date: string; count: number }[]>([])
  const [statsLoading, setStatsL]   = useState(false)
  const [statsTotal, setStatsTotal] = useState(0)
  const [statsUnique, setStatsUnique] = useState(0)

  const fetchLinks = useCallback(async () => {
    setLoadingL(true)
    try {
      const data = await smsService.getShortLinks()
      setLinks(data)
    } catch {
      setLinks([])
    } finally {
      setLoadingL(false)
    }
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0)
  const isActive = (l: SmsShortLink) => !l.expires_at || new Date(l.expires_at) > new Date()

  async function handleCreate() {
    if (!url.trim()) return
    setCreating(true); setErrC('')
    try {
      // Date d'expiration → nombre de jours pour l'API
      let days: number | undefined
      if (expDate) {
        const diff = Math.ceil((new Date(expDate).getTime() - Date.now()) / 86_400_000)
        if (diff < 1) { setErrC("La date d'expiration doit être dans le futur"); setCreating(false); return }
        days = Math.min(365, diff)
      }
      const link = await smsService.createShortLink({
        url: url.trim(),
        title: titre.trim() || undefined,
        expiresInDays: days,
        customCode: customCode.trim() || undefined,
      })
      setCreated(link)
      setLinks(prev => [link, ...prev])
      setUrl(''); setTitre(''); setExpDate(''); setCode('')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setErrC(msg ?? 'Erreur lors de la création du lien')
    } finally {
      setCreating(false)
    }
  }

  async function handleShowStats(link: SmsShortLink) {
    setStatsLink(link)
    setStatsData([])
    setStatsL(true)
    try {
      const res = await smsService.getShortLinkStats(link.id)
      setStatsTotal(res.total_clicks)
      setStatsUnique(res.unique_clicks)
      setStatsData(res.clicks_by_day)
    } catch {
      setStatsData([])
    } finally {
      setStatsL(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce lien court ?')) return
    setDeleting(id)
    try {
      await smsService.deleteShortLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
      toast.success('Lien supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  function shortUrl(link: SmsShortLink) {
    return `${REDIRECT_BASE}/sms/r/${link.code}`
  }

  function handleCopy(text: string, id: number | 'new') {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[26px] font-bold text-[#F4511E]">Réducteur d'URL</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Créez des liens courts et trackables pour vos campagnes marketing</p>
        </div>

        {/* KPIs — cartes pastel centrées (maquette) */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Link,         bg: '#EFF6FF', color: '#3B82F6', label: 'Liens créés',        value: String(links.length) },
            { icon: MousePointer, bg: '#F0FDF4', color: '#22C55E', label: 'Clics totaux',        value: totalClicks.toLocaleString('fr-FR') },
            { icon: Globe,        bg: '#FDF2F8', color: '#EC4899', label: 'Domaines actifs',     value: '1' },
            { icon: TrendingUp,   bg: '#FFF7ED', color: '#F97316', label: 'Taux de clic moyen', value: '—' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-2xl border p-5 text-center shadow-sm" style={{ backgroundColor: bg, borderColor: `${color}25` }}>
              <Icon size={22} className="mx-auto mb-2" style={{ color }} />
              <p className="text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[12px]" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-0 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[12px] font-semibold transition-colors whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Onglet Créer */}
        {activeTab === '+ Créer un lien' && (
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-[15px] font-bold text-[#1F2937]">Créer un lien court</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">URL à raccourcir *</label>
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="https://exemple.com/votre-page"
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40 placeholder-orange-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Domaine</label>
                    <select
                      className="w-full appearance-none rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200">
                      <option>{REDIRECT_HOST}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Code personnalisé (optionnel)</label>
                    <input value={customCode}
                      onChange={e => setCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      maxLength={30}
                      placeholder="promo-mars"
                      className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Laissez vide pour générer automatiquement</p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Titre (optionnel)</label>
                  <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Promotion Mars 2026"
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Date d'expiration (optionnel)</label>
                  <input type="date" value={expDate}
                    min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Laissez vide = lien permanent</p>
                </div>

                {errCreate && <p className="text-[11px] text-red-500">{errCreate}</p>}

                <button onClick={handleCreate} disabled={!url || creating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F4511E] to-[#FB923C] py-3 text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-50">
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Créer le lien court
                </button>

                {created && (
                  <div className="rounded-xl bg-[#F0FDF4] p-4">
                    <p className="mb-2 text-[11px] font-semibold text-[#16A34A]">✅ Lien créé avec succès</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#1F2937]">
                        {shortUrl(created)}
                      </span>
                      <button onClick={() => handleCopy(shortUrl(created), 'new')}
                        className="flex items-center gap-1 rounded-lg bg-[#22C55E] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#16a34a]">
                        {copiedId === 'new' ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                        {copiedId === 'new' ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">→ {created.original_url}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fonctionnalités */}
            <div className="w-full lg:w-[260px] space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="mb-3 text-[13px] font-bold text-[#1F2937]">Fonctionnalités</p>
                <div className="space-y-3">
                  {[
                    { icon: '🔗', title: "Raccourcissement d'URL",  sub: 'Liens courts personnalisables', color: '#2563EB', bg: '#EFF6FF' },
                    { icon: '🌐', title: 'Domaines personnalisés',   sub: 'Utilisez votre propre domaine', color: '#8B5CF6', bg: '#F5F3FF' },
                    { icon: '📊', title: 'Statistiques de clics',    sub: 'Tracking en temps réel',        color: '#16A34A', bg: '#F0FDF4' },
                    { icon: '🔳', title: 'QR codes automatiques',    sub: 'Génération instantanée',        color: '#EA580C', bg: '#FFF7ED' },
                  ].map(({ icon, title, sub, color, bg }) => (
                    <div key={title} className="flex items-start gap-2.5 rounded-xl p-3" style={{ backgroundColor: bg }}>
                      <span className="text-[16px] shrink-0">{icon}</span>
                      <div>
                        <p className="text-[11px] font-bold" style={{ color }}>{title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Mes liens */}
        {activeTab === 'Mes liens' && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Titre / URL', 'Lien court', 'Clics', 'Créé le', 'Expire le', 'Actif', 'Statistiques', 'Supprimer'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLinks && (
                    <tr><td colSpan={8} className="py-10 text-center">
                      <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                    </td></tr>
                  )}
                  {!loadingLinks && links.length === 0 && (
                    <tr><td colSpan={8} className="py-10 text-center text-[12px] text-gray-400">
                      Aucun lien créé — utilisez l'onglet "+ Créer un lien"
                    </td></tr>
                  )}
                  {!loadingLinks && links.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[180px]">
                        {l.title && <p className="text-[12px] font-semibold text-[#1F2937]">{l.title}</p>}
                        <p className="text-[10px] text-gray-400 truncate">{l.original_url}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-mono text-[#F4511E]">{shortUrl(l)}</span>
                          <button onClick={() => handleCopy(shortUrl(l), l.id)}
                            className={`transition-colors ${copiedId === l.id ? 'text-[#22C55E]' : 'text-gray-300 hover:text-gray-600'}`}
                            title={copiedId === l.id ? 'Copié !' : 'Copier le lien'}>
                            {copiedId === l.id ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{l.clicks.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{l.expires_at ? new Date(l.expires_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive(l) ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                          {isActive(l) ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleShowStats(l)}
                          className="flex items-center gap-1 rounded-lg bg-[#EFF6FF] px-2.5 py-1.5 text-[10px] font-semibold text-[#3B82F6] hover:bg-blue-100 transition-colors">
                          <BarChart2 size={11} /> Voir stats
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id}
                          className="rounded p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors">
                          {deleting === l.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet Analytics — vue globale des clics */}
        {activeTab === 'Analytics' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-[15px] font-bold text-[#1F2937]">Analytics des liens</h2>
            {links.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-gray-400">
                Aucun lien créé — les statistiques apparaîtront ici
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...links].sort((a, b) => b.clicks - a.clicks).slice(0, 8).map(l => ({
                    name: l.title || l.code, clics: l.clicks,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="clics" name="Clics" fill="#F4511E" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-3 text-center text-[11px] text-gray-400">Top liens par nombre de clics — cliquez sur "Voir stats" dans Mes liens pour le détail journalier</p>
              </>
            )}
          </div>
        )}

        {/* Onglet Domaines */}
        {activeTab === 'Domaines' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[#1F2937]">Domaines de raccourcissement</h2>
              <button disabled title="Domaines personnalisés — bientôt disponible"
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white opacity-60 cursor-not-allowed">
                <Plus size={12} /> Ajouter un domaine
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Domaine', 'Statut', 'Liens', 'Par défaut'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-3 text-[12px] font-mono font-semibold text-[#1F2937]">{REDIRECT_HOST}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#F0FDF4] px-2.5 py-0.5 text-[10px] font-semibold text-[#16A34A]">Actif</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-600">{links.length}</td>
                  <td className="px-4 py-3 text-[12px] text-[#F4511E] font-semibold">✓</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-[11px] text-gray-400">
              Les domaines personnalisés (ex : lien.votremarque.cd) seront disponibles prochainement.
            </p>
          </div>
        )}

      </motion.div>
      <DashboardFooter />

      {/* ── Modale statistiques par lien ── */}
      {statsLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={e => { if (e.target === e.currentTarget) setStatsLink(null) }}>
          <div className="relative w-full max-w-[600px] rounded-2xl bg-white p-6 shadow-xl">
            {/* Fermer */}
            <button onClick={() => setStatsLink(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100">
              <X size={16} className="text-gray-500" />
            </button>

            <div className="mb-1 flex items-center gap-2">
              <BarChart2 size={17} className="text-[#3B82F6]" />
              <h3 className="text-[15px] font-bold text-[#1F2937]">Statistiques du lien</h3>
            </div>
            <p className="mb-4 truncate text-[11px] text-gray-400">{shortUrl(statsLink)}</p>

            {/* KPIs */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Clics totaux',      value: statsLoading ? '…' : statsTotal.toLocaleString('fr-FR'),  color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Visiteurs uniques', value: statsLoading ? '…' : statsUnique.toLocaleString('fr-FR'), color: '#16A34A', bg: '#F0FDF4' },
                { label: 'Moy. / jour',       value: statsLoading ? '…' : statsData.length ? Math.round(statsTotal / statsData.length).toString() : '0', color: '#F97316', bg: '#FFF7ED' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                  <p className="text-[18px] font-bold" style={{ color }}>{value}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            {statsLoading && (
              <div className="flex h-[180px] items-center justify-center">
                <Loader2 size={22} className="animate-spin text-gray-300" />
              </div>
            )}
            {!statsLoading && statsData.length === 0 && (
              <div className="flex h-[140px] items-center justify-center rounded-xl bg-gray-50">
                <p className="text-[12px] text-gray-400">Aucun clic enregistré pour ce lien</p>
              </div>
            )}
            {!statsLoading && statsData.length > 0 && (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-3 text-[11px] font-semibold text-gray-500">Clics par jour (30 derniers jours)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={statsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date"
                      tick={{ fontSize: 9, fill: '#9CA3AF' }}
                      tickFormatter={d => {
                        const parts = d.split('-')
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
                      labelFormatter={d => {
                        const parts = String(d).split('-')
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
                      }}
                      formatter={(val: number | string) => [val, 'Clics']}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Infos lien */}
            <div className="mt-4 rounded-xl bg-gray-50 p-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-gray-400">URL originale : </span><span className="font-medium text-[#1F2937] break-all">{statsLink.original_url}</span></div>
                <div><span className="text-gray-400">Créé le : </span><span className="font-medium text-[#1F2937]">{new Date(statsLink.created_at).toLocaleDateString('fr-FR')}</span></div>
                <div><span className="text-gray-400">Expire : </span><span className="font-medium text-[#1F2937]">{statsLink.expires_at ? new Date(statsLink.expires_at).toLocaleDateString('fr-FR') : 'Permanent'}</span></div>
                <div><span className="text-gray-400">Statut : </span>
                  <span className={`font-semibold ${isActive(statsLink) ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {isActive(statsLink) ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
