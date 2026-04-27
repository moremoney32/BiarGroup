import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Loader2, FileText } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'

const CATEGORIES = ['Tous', 'Newsletter', 'Marketing', 'Événement', 'Transactionnel', 'Relationnel', 'Général']

const CATEGORY_GRADIENTS: Record<string, string> = {
  Newsletter:    'from-blue-400 to-indigo-600',
  Marketing:     'from-orange-400 to-red-500',
  Événement:     'from-purple-400 to-pink-500',
  Transactionnel:'from-green-400 to-emerald-500',
  Relationnel:   'from-pink-400 to-rose-500',
  Général:       'from-gray-400 to-slate-500',
}

interface Template {
  id: number
  name: string
  category: string
  sujet: string | null
  blocs_json: object[]
  created_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ModelesEmailPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeTab, setActiveTab] = useState('Tous')
  const [deleting, setDeleting]   = useState<number | null>(null)

  useEffect(() => {
    apiFetch.get<{ data: Template[] }>('/email/templates')
      .then(r => setTemplates(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = templates.filter(t => {
    const matchCat = activeTab === 'Tous' || t.category === activeTab
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce template ?')) return
    setDeleting(id)
    try {
      await apiFetch.delete(`/email/templates/${id}`)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleUse = (t: Template) => {
    // Charge le template dans l'éditeur via location.state
    navigate('/app/email/editeur', { state: { template: t } })
  }

  const stats = [
    { label: 'Total templates',     value: templates.length },
    { label: 'Catégories',          value: new Set(templates.map(t => t.category)).size },
    { label: 'Ce mois',             value: templates.filter(t => new Date(t.created_at).getMonth() === new Date().getMonth()).length },
    { label: 'Prêts à l\'emploi',   value: templates.length },
  ]

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Templates Email</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Vos compositions sauvegardées, réutilisables pour de nouvelles campagnes</p>
          </div>
          <button
            onClick={() => navigate('/app/email/editeur')}
            className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
          >
            <Plus size={14} /> Créer un template
          </button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
              {loading
                ? <div className="mx-auto h-7 w-10 animate-pulse rounded bg-gray-100 mb-1" />
                : <p className="text-[24px] font-bold text-[#1F2937]">{value}</p>
              }
              <p className="mt-0.5 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filtres */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === cat ? 'bg-[#F4511E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grille */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#F4511E]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} className="mb-3 text-gray-200" />
            <p className="text-[13px] font-medium text-gray-400">
              {search || activeTab !== 'Tous'
                ? 'Aucun template ne correspond à ce filtre.'
                : 'Vous n\'avez pas encore de templates. Créez votre premier email et sauvegardez-le comme template !'}
            </p>
            {!search && activeTab === 'Tous' && (
              <button
                onClick={() => navigate('/app/email/editeur')}
                className="mt-4 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
              >
                + Créer mon premier template
              </button>
            )}
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-3 gap-4">
            {filtered.map(t => {
              const gradient = CATEGORY_GRADIENTS[t.category] ?? 'from-gray-400 to-slate-500'
              return (
                <div key={t.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Preview */}
                  <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <FileText size={32} className="text-white/40" />
                    <span className="absolute right-2 top-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                      {t.category}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1F2937] truncate">{t.name}</p>
                        {t.sujet && <p className="text-[11px] text-gray-400 truncate">{t.sujet}</p>}
                        <p className="text-[10px] text-gray-300 mt-0.5">Créé le {fmtDate(t.created_at)}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleting === t.id}
                        className="ml-2 shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deleting === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleUse(t)}
                      className="mt-3 w-full rounded-lg bg-[#F4511E] py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f] transition-colors"
                    >
                      Utiliser ce template
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DashboardFooter />
    </div>
  )
}
