import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, List, Users, BarChart2, Send, Loader2, Trash2, X, Download } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import { useToast } from '../../../hooks/useToast'
import type { SmsContactList, CrmContact } from '../../../types/sms.types'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// Palette tournante pour les couleurs des cartes
const CARD_PALETTES = [
  { iconBg: '#FFF7ED', iconColor: '#EA580C', badgeBg: '#FFF7ED', badgeColor: '#EA580C' },
  { iconBg: '#F0FDF4', iconColor: '#16A34A', badgeBg: '#F0FDF4', badgeColor: '#16A34A' },
  { iconBg: '#F5F3FF', iconColor: '#7C3AED', badgeBg: '#F5F3FF', badgeColor: '#7C3AED' },
  { iconBg: '#EFF6FF', iconColor: '#2563EB', badgeBg: '#EFF6FF', badgeColor: '#2563EB' },
  { iconBg: '#FEF2F2', iconColor: '#DC2626', badgeBg: '#FEF2F2', badgeColor: '#DC2626' },
  { iconBg: '#F0FDFA', iconColor: '#0D9488', badgeBg: '#F0FDFA', badgeColor: '#0D9488' },
]

function palette(idx: number) {
  return CARD_PALETTES[idx % CARD_PALETTES.length]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface NewListModalProps {
  onClose: () => void
  onCreated: () => void
}

function NewListModal({ onClose, onCreated }: NewListModalProps) {
  const [name, setName]             = useState('')
  const [description, setDesc]      = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Le nom est requis'); return }
    setLoading(true); setError('')
    try {
      await smsService.createContactList({ name: name.trim(), description: description.trim() || undefined })
      onCreated()
    } catch {
      setError('Erreur lors de la création de la liste')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Nouvelle Liste de Diffusion</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Nom de la liste *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex : Clients Premium"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Description (optionnel)</label>
            <textarea rows={3} value={description} onChange={e => setDesc(e.target.value)}
              placeholder="Description de cette liste..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none resize-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Import CRM ─────────────────────────────────────────

interface ImportCrmModalProps { onClose: () => void; onCreated: () => void }

function ImportCrmModal({ onClose, onCreated }: ImportCrmModalProps) {
  const [listName, setListName]       = useState('')
  const [search, setSearch]           = useState('')
  const [contacts, setContacts]       = useState<CrmContact[]>([])
  const [selected, setSelected]       = useState<Set<number>>(new Set())
  const [loadingContacts, setLoadingC] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchContacts = useCallback(async (q: string) => {
    setLoadingC(true)
    try {
      const { contacts: data } = await smsService.getCrmContacts({ search: q, limit: 100 })
      setContacts(data)
    } catch {
      setContacts([])
    } finally {
      setLoadingC(false)
    }
  }, [])

  useEffect(() => { fetchContacts('') }, [fetchContacts])

  function handleSearch(v: string) {
    setSearch(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchContacts(v), 350)
  }

  function toggleContact(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === contacts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(contacts.map(c => c.id)))
    }
  }

  async function handleImport() {
    if (!listName.trim()) { setError('Nom de la liste requis'); return }
    if (selected.size === 0) { setError('Sélectionnez au moins un contact'); return }
    setSaving(true); setError('')
    try {
      const list = await smsService.createContactList({ name: listName.trim() })
      const result = await smsService.importFromCrm(list.id, Array.from(selected))
      if (result.added === 0) {
        setError('Aucun contact importé — les numéros sont peut-être déjà dans la liste')
        setSaving(false)
        return
      }
      onCreated()
    } catch {
      setError('Erreur lors de la création de la liste')
      setSaving(false)
    }
  }

  const allSelected = contacts.length > 0 && selected.size === contacts.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-[#1F2937]">Importer depuis le CRM</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Créez une liste SMS depuis vos contacts existants</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Nom de la liste */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Nom de la nouvelle liste *</label>
            <input
              value={listName} onChange={e => setListName(e.target.value)}
              placeholder="Ex : Clients avec numéros"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>

          {/* Recherche contacts CRM */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
              Contacts CRM ({contacts.length} trouvés)
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 mb-2 focus-within:ring-2 focus-within:ring-[#F4511E]/20">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou téléphone..."
                className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none"
              />
            </div>

            {/* Select all */}
            {contacts.length > 0 && (
              <label className="flex items-center gap-2 px-1 mb-2 cursor-pointer">
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  className="accent-[#F4511E]" />
                <span className="text-[11px] font-semibold text-gray-600">
                  {allSelected ? 'Tout désélectionner' : `Tout sélectionner (${contacts.length})`}
                </span>
              </label>
            )}

            {/* Liste contacts */}
            <div className="space-y-1 max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
              {loadingContacts && (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[11px]">Chargement...</span>
                </div>
              )}
              {!loadingContacts && contacts.length === 0 && (
                <p className="py-6 text-center text-[11px] text-gray-400">
                  {search ? 'Aucun contact trouvé' : 'Aucun contact dans le CRM'}
                </p>
              )}
              {!loadingContacts && contacts.map(c => (
                <label key={c.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-white transition-colors">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleContact(c.id)}
                    className="accent-[#F4511E] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#1F2937] truncate">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{c.phone} {c.email ? `· ${c.email}` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 shrink-0">
          <span className="text-[11px] text-gray-400">
            {selected.size} contact{selected.size !== 1 ? 's' : ''} sélectionné{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleImport} disabled={saving || selected.size === 0 || !listName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Créer la liste ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

export default function SmsGestionListesPage() {
  const toast = useToast()
  const [listes, setListes]       = useState<SmsContactList[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [showModal, setModal]     = useState(false)
  const [showImport, setImport]   = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)

  const fetchListes = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await smsService.getContactLists()
      setListes(data)
    } catch {
      setError('Impossible de charger les listes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchListes() }, [fetchListes])

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette liste ? Les contacts seront retirés.')) return
    setDeleting(id)
    try {
      await smsService.deleteContactList(id)
      setListes(prev => prev.filter(l => l.id !== id))
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = listes.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalContacts = listes.reduce((s, l) => s + l.contact_count, 0)

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <motion.div className="mb-5 flex items-start justify-between" variants={fadeUp} initial="initial" animate="animate">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-2">🗂</span>Gestion des Listes de Diffusion
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Organisez vos contacts en listes ciblées</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setImport(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-[#F4511E] hover:bg-orange-50">
              <Download size={14} /> Importer du CRM
            </button>
            <button onClick={() => setModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={14} /> Nouvelle Liste
            </button>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.div
          className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          variants={stagger} initial="initial" animate="animate"
        >
          {[
            { icon: List,     bg: '#EFF6FF', color: '#3B82F6', label: 'Total Listes',   value: listes.length },
            { icon: Users,    bg: '#F0FDF4', color: '#22C55E', label: 'Total Contacts', value: totalContacts.toLocaleString('fr-FR') },
            { icon: Send,     bg: '#FFF7ED', color: '#F97316', label: 'Listes actives', value: listes.filter(l => !l.deleted_at).length },
            { icon: BarChart2, bg: '#F5F3FF', color: '#8B5CF6', label: 'Contacts moy.', value: listes.length ? Math.round(totalContacts / listes.length).toLocaleString('fr-FR') : '0' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <motion.div key={label} variants={fadeUp} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Recherche */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#F4511E]/20">
          <Search size={14} className="shrink-0 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une liste..."
            className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
          />
        </div>

        {/* État chargement */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Chargement des listes...</span>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600 border border-red-100">
            {error} — <button onClick={fetchListes} className="underline font-semibold">Réessayer</button>
          </div>
        )}

        {/* Vide */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF7ED]">
              <List size={22} className="text-[#F4511E]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1F2937]">
              {search ? 'Aucune liste trouvée' : 'Aucune liste de diffusion'}
            </p>
            <p className="mt-1 text-[12px] text-gray-400">
              {search ? 'Modifiez votre recherche' : 'Créez votre première liste pour organiser vos contacts'}
            </p>
          </div>
        )}

        {/* Grille de cartes */}
        {!loading && !error && filtered.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger} initial="initial" animate="animate"
          >
            {filtered.map((l, idx) => {
              const pal = palette(idx)
              return (
                <motion.div key={l.id} variants={fadeUp} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: pal.iconBg }}>
                        <List size={18} style={{ color: pal.iconColor }} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#1F2937]">{l.name}</p>
                        <p className="text-[11px] text-gray-500">{l.description || 'Aucune description'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(l.id)}
                      disabled={deleting === l.id}
                      className="rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      {deleting === l.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="mb-3 space-y-1.5">
                    {[
                      { label: 'Total contacts', value: l.contact_count.toLocaleString('fr-FR'), color: '' },
                      { label: 'Créée le',       value: formatDate(l.created_at),               color: '' },
                      { label: 'Mise à jour',    value: formatDate(l.updated_at),               color: '' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">{label}</span>
                        <span className="text-[12px] font-semibold" style={{ color: color || '#1F2937' }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <span className="text-[10px] text-gray-400">
                      {l.contact_count} contact{l.contact_count !== 1 ? 's' : ''}
                    </span>
                    <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-semibold text-[#16A34A]">
                      Active
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

      </div>

      {showModal && (
        <NewListModal
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); fetchListes() }}
        />
      )}

      {showImport && (
        <ImportCrmModal
          onClose={() => setImport(false)}
          onCreated={() => { setImport(false); fetchListes() }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
