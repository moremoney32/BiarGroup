import { useState, useEffect, useCallback } from 'react'
import { Link, MousePointer, Globe, TrendingUp, Plus, Copy, CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsShortLink } from '../../../types/sms.types'

const TABS = ['+ Créer un lien', 'Mes liens'] as const
type Tab = typeof TABS[number]

const BASE_DOMAIN = window.location.hostname === 'localhost' ? 'localhost:5000' : 'actr.link'

export default function SmsReducteurUrlPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('+ Créer un lien')
  const [links, setLinks]           = useState<SmsShortLink[]>([])
  const [loadingLinks, setLoadingL] = useState(false)

  // Formulaire
  const [url, setUrl]           = useState('')
  const [titre, setTitre]       = useState('')
  const [expDays, setExpDays]   = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated]   = useState<SmsShortLink | null>(null)
  const [errCreate, setErrC]    = useState('')
  const [copied, setCopied]     = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

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
  const activeLinks = links.filter(l => l.active).length

  async function handleCreate() {
    if (!url.trim()) return
    setCreating(true); setErrC('')
    try {
      const days = expDays ? parseInt(expDays) : undefined
      const link = await smsService.createShortLink({ url: url.trim(), title: titre.trim() || undefined, expiresInDays: days })
      setCreated(link)
      setLinks(prev => [link, ...prev])
      setUrl(''); setTitre(''); setExpDays('')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setErrC(msg ?? 'Erreur lors de la création du lien')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce lien court ?')) return
    setDeleting(id)
    try {
      await smsService.deleteShortLink(id)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  function shortUrl(link: SmsShortLink) {
    return `${BASE_DOMAIN}/s/${link.code}`
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-[#1F2937]">
            <span className="mr-2">🔗</span>Réducteur d'URL
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Créez des liens courts et trackables pour vos campagnes marketing</p>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Link,         bg: '#EFF6FF', color: '#3B82F6', label: 'Liens créés',       value: links.length },
            { icon: MousePointer, bg: '#F0FDF4', color: '#22C55E', label: 'Clics totaux',       value: totalClicks.toLocaleString('fr-FR') },
            { icon: Globe,        bg: '#F5F3FF', color: '#8B5CF6', label: 'Liens actifs',       value: activeLinks },
            { icon: TrendingUp,   bg: '#FFF7ED', color: '#F97316', label: 'Taux de clic moy.', value: links.length ? `${Math.round(totalClicks / links.length)} clics` : '—' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
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
                    <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Titre (optionnel)</label>
                    <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Promotion Mars"
                      className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Expire dans (jours)</label>
                    <input type="number" min="1" max="365" value={expDays} onChange={e => setExpDays(e.target.value)}
                      placeholder="30"
                      className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                    />
                    <p className="mt-1 text-[10px] text-gray-400">Laissez vide = permanent</p>
                  </div>
                </div>

                {errCreate && <p className="text-[11px] text-red-500">{errCreate}</p>}

                <button onClick={handleCreate} disabled={!url || creating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
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
                      <button onClick={() => handleCopy(shortUrl(created))}
                        className="flex items-center gap-1 rounded-lg bg-[#22C55E] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#16a34a]">
                        {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
                        {copied ? 'Copié !' : 'Copier'}
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
                    { icon: '🔗', title: "Raccourcissement d'URL", sub: 'Liens courts et mémorables', color: '#2563EB', bg: '#EFF6FF' },
                    { icon: '📊', title: 'Statistiques de clics',  sub: 'Tracking en temps réel',    color: '#8B5CF6', bg: '#F5F3FF' },
                    { icon: '⏱',  title: "Date d'expiration",      sub: 'Liens temporaires',          color: '#EA580C', bg: '#FFF7ED' },
                    { icon: '🔒', title: 'Sécurité anti-redirect', sub: 'URL validée avant stockage', color: '#16A34A', bg: '#F0FDF4' },
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
                    {['Titre / URL', 'Lien court', 'Clics', 'Créé le', 'Expire le', 'Actif', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLinks && (
                    <tr><td colSpan={7} className="py-10 text-center">
                      <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                    </td></tr>
                  )}
                  {!loadingLinks && links.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-[12px] text-gray-400">
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
                          <button onClick={() => handleCopy(shortUrl(l))} className="text-gray-300 hover:text-gray-600">
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{l.clicks.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{l.expires_at ? new Date(l.expires_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${l.active ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                          {l.active ? 'Actif' : 'Inactif'}
                        </span>
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

      </div>
      <DashboardFooter />
    </div>
  )
}
