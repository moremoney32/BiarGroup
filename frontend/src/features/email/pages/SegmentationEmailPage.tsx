import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Upload, Send, Trash2, Pencil, Download, Loader2,
  Users, Filter, TrendingUp, UserPlus, MapPin, Calendar,
  ShoppingCart, Mail, BarChart2, Search,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'
import CreateSegmentModal, { type SegmentData, type Criterion } from '../components/CreateSegmentModal'

interface Stats {
  totalContacts:  number
  activeSegments: number
  newContacts:    number
}

interface Segment extends SegmentData {}

const QUICK_SEGMENTS = [
  {
    icon: MapPin,
    label: 'Par localisation',
    criteria: [{ field: 'company', operator: 'contains', value: '' }],
  },
  {
    icon: Calendar,
    label: 'Par date d\'inscription',
    criteria: [{ field: 'created_at', operator: 'greater_than', value: '' }],
  },
  {
    icon: ShoppingCart,
    label: 'Par achat',
    criteria: [{ field: 'tags', operator: 'equals', value: 'achat' }],
  },
  {
    icon: Mail,
    label: 'Par engagement email',
    criteria: [{ field: 'is_opted_out', operator: 'equals', value: '0' }],
  },
  {
    icon: TrendingUp,
    label: 'Par score lead',
    criteria: [{ field: 'tags', operator: 'equals', value: 'lead' }],
  },
  {
    icon: Users,
    label: 'Par démographie',
    criteria: [{ field: 'first_name', operator: 'is_not_empty' }],
  },
]

const FIELD_LABELS: Record<string, string> = {
  first_name:   'Prénom',
  last_name:    'Nom',
  email:        'Email',
  phone:        'Téléphone',
  company:      'Entreprise',
  tags:         'Tags',
  is_opted_out: 'Opt-out',
  created_at:   'Date d\'inscription',
}

const OP_LABELS: Record<string, string> = {
  equals:       '=',
  not_equals:   '≠',
  contains:     'contient',
  starts_with:  'commence par',
  greater_than: '>',
  less_than:    '<',
  is_empty:     'est vide',
  is_not_empty: 'non vide',
}

function criteriaLabel(c: Criterion): string {
  const f  = FIELD_LABELS[c.field]  ?? c.field
  const op = OP_LABELS[c.operator]  ?? c.operator
  if (!c.value) return `${f} ${op}`
  return `${f} ${op} ${c.value}`
}

function TypeBadge({ type }: { type: 'dynamique' | 'statique' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      type === 'dynamique' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
    }`}>
      {type === 'dynamique' ? 'Dynamique' : 'Statique'}
    </span>
  )
}

export default function SegmentationEmailPage() {
  const navigate = useNavigate()

  const [segments, setSegments]   = useState<Segment[]>([])
  const [stats, setStats]         = useState<Stats>({ totalContacts: 0, activeSegments: 0, newContacts: 0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [showCreate, setShowCreate]   = useState(false)
  const [createInitial, setCreateInitial] = useState<{ name?: string; criteriaJson?: Criterion[] } | undefined>()

  useEffect(() => {
    apiFetch.get<{ data: { segments: Segment[]; stats: Stats } }>('/contacts/segments')
      .then(r => {
        setSegments(r.data.segments ?? [])
        setStats(r.data.stats ?? { totalContacts: 0, activeSegments: 0, newContacts: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => segments.filter(s => (s.name ?? '').toLowerCase().includes(search.toLowerCase())),
    [segments, search]
  )

  const handleCreated = (seg: Segment) => {
    if (!seg?.name) return
    setSegments(prev => [seg, ...prev])
    setStats(prev => ({ ...prev, activeSegments: prev.activeSegments + 1 }))
    setShowCreate(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce segment définitivement ?')) return
    setDeletingId(id)
    try {
      await apiFetch.delete(`/contacts/segments/${id}`)
      setSegments(prev => prev.filter(s => s.id !== id))
      setStats(prev => ({ ...prev, activeSegments: Math.max(0, prev.activeSegments - 1) }))
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCampaign = (seg: Segment) => {
    navigate('/app/email/editeur', { state: { preselectedSegment: seg } })
  }

  const openQuick = (qs: typeof QUICK_SEGMENTS[0]) => {
    setCreateInitial({ name: qs.label, criteriaJson: qs.criteria as Criterion[] })
    setShowCreate(true)
  }

  const openBlank = () => {
    setCreateInitial(undefined)
    setShowCreate(true)
  }

  const kpis = [
    {
      icon: Users,
      color: 'bg-blue-50 text-blue-500',
      label: 'Total contacts',
      value: stats.totalContacts.toLocaleString(),
    },
    {
      icon: Filter,
      color: 'bg-purple-50 text-purple-500',
      label: 'Segments actifs',
      value: stats.activeSegments.toString(),
    },
    {
      icon: TrendingUp,
      color: 'bg-green-50 text-green-500',
      label: 'Engagement moyen',
      value: '42%',
    },
    {
      icon: UserPlus,
      color: 'bg-orange-50 text-orange-500',
      label: 'Nouveaux contacts',
      value: `+${stats.newContacts}`,
    },
  ]

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#1F2937] sm:text-[22px]">Segmentation Avancée</h1>
            <p className="mt-0.5 text-[12px] text-gray-500 sm:text-[13px]">Créez des segments ciblés pour des campagnes personnalisées</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Upload size={13} /> Importer
            </button>
            <button
              onClick={openBlank}
              className="flex items-center gap-1.5 rounded-xl bg-[#E91E8C] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#c9186f]"
            >
              <Plus size={13} /> Nouveau segment
            </button>
          </div>
        </div>

        {/* ── KPI cards ──────────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${k.color}`}>
                <k.icon size={16} />
              </div>
              <p className="text-[12px] text-gray-400">{k.label}</p>
              <p className="mt-0.5 text-[22px] font-bold text-[#1F2937]">{loading ? '—' : k.value}</p>
            </div>
          ))}
        </div>

        {/* ── Segmentation rapide ────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-bold text-[#1F2937]">Segmentation rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {QUICK_SEGMENTS.map(qs => (
              <button
                key={qs.label}
                onClick={() => openQuick(qs)}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-left transition-all hover:border-[#E91E8C]/30 hover:bg-[#FFF0F7]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F7]">
                  <qs.icon size={14} className="text-[#E91E8C]" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">{qs.label}</p>
                  <p className="text-[10px] text-gray-400">{qs.criteria.length} critère{qs.criteria.length !== 1 ? 's' : ''}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mes segments ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Mes segments</h2>
            <div className="relative w-full sm:w-52">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un segment"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-[12px] text-[#1F2937] outline-none focus:border-[#E91E8C]"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#E91E8C]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <BarChart2 size={36} className="mb-3 text-gray-200" />
              <p className="text-[13px] font-medium text-gray-400">
                {search ? 'Aucun segment ne correspond à votre recherche' : 'Aucun segment créé pour l\'instant'}
              </p>
              {!search && (
                <button
                  onClick={openBlank}
                  className="mt-4 rounded-xl bg-[#E91E8C] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#c9186f]"
                >
                  + Créer mon premier segment
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(seg => {
                const crit: Criterion[] = Array.isArray(seg.criteria_json) ? seg.criteria_json : []
                const updated = new Date(seg.updated_at).toLocaleDateString('fr-FR')
                return (
                  <div key={seg.id} className="rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[14px] font-bold text-[#1F2937] truncate">{seg.name}</span>
                          <TypeBadge type={seg.type} />
                          <span className="text-[12px] text-gray-400">{seg.contact_count.toLocaleString()} contacts</span>
                        </div>
                        {seg.description && (
                          <p className="text-[12px] text-gray-500 mb-2">{seg.description}</p>
                        )}
                        {crit.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {crit.slice(0, 4).map((c, i) => (
                              <span
                                key={i}
                                className="rounded-full bg-orange-50 border border-orange-100 px-2 py-0.5 text-[10px] text-orange-600"
                              >
                                {criteriaLabel(c)}
                              </span>
                            ))}
                            {crit.length > 4 && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                                +{crit.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400">Mis à jour le {updated}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                          <Pencil size={11} />
                        </button>
                        <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50">
                          <Download size={11} />
                        </button>
                        <button
                          onClick={() => handleCampaign(seg)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#E91E8C] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#c9186f]"
                        >
                          <Send size={10} />
                          <span className="hidden sm:inline">Créer campagne</span>
                          <span className="sm:hidden">Campagne</span>
                        </button>
                        <button
                          onClick={() => handleDelete(seg.id)}
                          disabled={deletingId === seg.id}
                          className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                        >
                          {deletingId === seg.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Trash2 size={12} />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <DashboardFooter />

      {showCreate && (
        <CreateSegmentModal
          initial={createInitial}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
