import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Search, Upload, Download,
  ChevronDown, X, List,
  Send, AlertTriangle, Users, Loader2, PhoneOff, Phone,
  Database, CheckSquare, Square, CheckCircle2,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsContactList, SmsListContact, CrmContact } from '../../../types/sms.types'
import type { PaginationMeta } from '../../../services/sms.service'

// ── Modal : Ajouter un contact ────────────────────────────────

interface AddContactModalProps {
  listId: number
  listName: string
  onClose: () => void
  onAdded: () => void
}

function AddContactModal({ listId, listName, onClose, onAdded }: AddContactModalProps) {
  const [phone, setPhone]     = useState('+243')
  const [firstName, setFN]    = useState('')
  const [lastName, setLN]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleAdd() {
    if (!phone.trim() || phone.trim().length < 7) { setError('Numéro invalide'); return }
    setLoading(true); setError('')
    try {
      await smsService.addContactsToList(listId, [{ phone: phone.trim(), firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined }])
      onAdded()
    } catch {
      setError('Erreur lors de l\'ajout du contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Ajouter un contact</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-gray-500">Dans la liste : <span className="font-semibold text-[#1F2937]">{listName}</span></p>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Téléphone *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+243 9XX XXX XXX"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Prénom</label>
              <input type="text" value={firstName} onChange={e => setFN(e.target.value)}
                placeholder="Jean"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Nom</label>
              <input type="text" value={lastName} onChange={e => setLN(e.target.value)}
                placeholder="Kabongo"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
              />
            </div>
          </div>
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleAdd} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4511E] py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal : Importer depuis le CRM ───────────────────────────

interface ImportCrmModalProps {
  listId: number
  listName: string
  onClose: () => void
  onImported: (added: number) => void
}

function ImportCrmModal({ listId, listName, onClose, onImported }: ImportCrmModalProps) {
  const [contacts, setContacts]   = useState<CrmContact[]>([])
  const [meta, setMeta]           = useState<PaginationMeta | null>(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [importing, setImporting] = useState(false)
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [result, setResult]       = useState<{ added: number; skipped: number } | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCrm = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const res = await smsService.getCrmContacts({ search: q || undefined, page: p, limit: 50 })
      setContacts(res.contacts)
      setMeta(res.meta)
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCrm('', 1) }, [fetchCrm])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchCrm(search, 1)
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, fetchCrm])

  useEffect(() => { fetchCrm(search, page) }, [page]) // eslint-disable-line

  function toggle(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (contacts.every(c => selected.has(c.id))) {
      setSelected(prev => { const next = new Set(prev); contacts.forEach(c => next.delete(c.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); contacts.forEach(c => next.add(c.id)); return next })
    }
  }

  async function handleImport() {
    if (selected.size === 0) return
    setImporting(true)
    try {
      const res = await smsService.importFromCrm(listId, Array.from(selected))
      setResult(res)
      onImported(res.added)
    } catch {
      setResult({ added: 0, skipped: selected.size })
    } finally {
      setImporting(false)
    }
  }

  function displayName(c: CrmContact) {
    const n = [c.first_name, c.last_name].filter(Boolean).join(' ')
    return n || c.phone
  }

  const allPageSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-[#1F2937]">Importer depuis le CRM</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Vers la liste : <span className="font-semibold text-[#F4511E]">{listName}</span>
              {selected.size > 0 && <span className="ml-2 text-[#16A34A] font-semibold">{selected.size} sélectionné(s)</span>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        {/* Résultat import */}
        {result && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3 shrink-0">
            <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
            <p className="text-[12px] font-semibold text-[#15803D]">
              {result.added} contact(s) importé(s) avec succès
              {result.skipped > 0 && ` — ${result.skipped} ignoré(s) (déjà présents ou sans téléphone)`}
            </p>
          </div>
        )}

        {/* Recherche */}
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 shrink-0">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1 mx-6 my-4 rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2.5 text-left w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-[#F4511E]">
                    {allPageSelected
                      ? <CheckSquare size={14} className="text-[#F4511E]" />
                      : <Square size={14} />}
                  </button>
                </th>
                {['Nom', 'Téléphone', 'Email'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="py-10 text-center">
                  <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                </td></tr>
              )}
              {!loading && contacts.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-[12px] text-gray-400">
                  {search ? 'Aucun contact trouvé' : 'Aucun contact CRM avec numéro de téléphone'}
                </td></tr>
              )}
              {!loading && contacts.map(c => (
                <tr key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`border-b border-gray-50 cursor-pointer transition-colors ${selected.has(c.id) ? 'bg-orange-50/70' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    {selected.has(c.id)
                      ? <CheckSquare size={14} className="text-[#F4511E]" />
                      : <Square size={14} className="text-gray-300" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">
                        {(c.first_name?.[0] ?? c.phone.slice(-1)).toUpperCase()}
                      </div>
                      <span className="text-[12px] font-semibold text-[#1F2937]">{displayName(c)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 font-mono">{c.phone}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-400">{c.email ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-2 shrink-0">
            <span className="text-[11px] text-gray-400">Page {meta.page} / {meta.lastPage} — {meta.total} contacts avec téléphone</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Préc.</button>
              <button onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Suiv.</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 shrink-0">
          <span className="text-[12px] text-gray-500">
            {selected.size === 0 ? 'Sélectionnez des contacts à importer' : `${selected.size} contact(s) prêt(s) à importer`}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-[12px] text-gray-600 hover:bg-gray-50">
              {result ? 'Fermer' : 'Annuler'}
            </button>
            {!result && (
              <button onClick={handleImport} disabled={selected.size === 0 || importing}
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
                {importing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                Importer {selected.size > 0 ? `(${selected.size})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

export default function SmsGestionContactsPage() {
  const [listes, setListes]         = useState<SmsContactList[]>([])
  const [contacts, setContacts]     = useState<SmsListContact[]>([])
  const [meta, setMeta]             = useState<PaginationMeta | null>(null)
  const [selectedList, setSelList]  = useState<SmsContactList | null>(null)
  const [listOpen, setListOpen]     = useState(false)
  const [statutFilter, setStatut]   = useState<'all' | 'active' | 'optout'>('all')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)
  const [loadingLists, setLoadingL] = useState(true)
  const [loadingCtx, setLoadingCtx] = useState(false)
  const [selected, setSelected]     = useState<number[]>([])
  const [showModal, setModal]       = useState(false)
  const [showCrmModal, setCrmModal] = useState(false)

  // Charger les listes au montage
  useEffect(() => {
    smsService.getContactLists().then(data => {
      setListes(data)
      if (data.length > 0) setSelList(data[0])
    }).catch(() => {}).finally(() => setLoadingL(false))
  }, [])

  // Charger les contacts quand la liste sélectionnée change
  const fetchContacts = useCallback(async (listId: number, p: number) => {
    setLoadingCtx(true)
    try {
      const { contacts: data, meta: m } = await smsService.getContactsInList(listId, { page: p, limit: 20 })
      setContacts(data)
      setMeta(m)
    } catch {
      setContacts([])
    } finally {
      setLoadingCtx(false)
    }
  }, [])

  useEffect(() => {
    if (selectedList) { fetchContacts(selectedList.id, page) }
  }, [selectedList, page, fetchContacts])

  // Filtres locaux
  const filtered = contacts.filter(c => {
    const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase()
    const matchSearch = search
      ? c.phone.includes(search) || name.includes(search.toLowerCase())
      : true
    const matchStatut = statutFilter === 'all' ? true
      : statutFilter === 'optout' ? c.opted_out
      : !c.opted_out
    return matchSearch && matchStatut
  })

  const totalContacts = listes.reduce((s, l) => s + l.contact_count, 0)
  const totalOptout   = contacts.filter(c => c.opted_out).length

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () =>
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id))

  function displayName(c: SmsListContact) {
    const n = [c.first_name, c.last_name].filter(Boolean).join(' ')
    return n || c.phone
  }

  function initials(c: SmsListContact) {
    if (c.first_name || c.last_name) {
      return `${(c.first_name ?? '')[0] ?? ''}${(c.last_name ?? '')[0] ?? ''}`.toUpperCase() || '?'
    }
    return c.phone.slice(-2)
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-2">🎯</span>Contacts SMS
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Contacts de vos listes de diffusion</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              <Upload size={13} /> Importer CSV
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-[#F4511E] px-3 py-2 text-[12px] font-semibold text-[#F4511E] hover:bg-orange-50">
              <Download size={13} /> Exporter
            </button>
            {selectedList && (
              <button onClick={() => setCrmModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#3B82F6] px-3 py-2 text-[12px] font-semibold text-[#2563EB] hover:bg-blue-50">
                <Database size={13} /> Depuis CRM
              </button>
            )}
            {selectedList && (
              <button onClick={() => setModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                <Plus size={13} /> Ajouter contact
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Contacts', value: totalContacts.toLocaleString('fr-FR'), sub: `${listes.length} liste(s)`,         color: '#3B82F6', bg: '#EFF6FF', icon: Users },
            { label: 'Contacts Actifs', value: selectedList ? (selectedList.contact_count - totalOptout).toLocaleString('fr-FR') : '-', sub: selectedList?.name ?? 'Sélectionnez une liste', color: '#22C55E', bg: '#F0FDF4', icon: Phone },
            { label: 'Listes',          value: listes.length, sub: 'Listes de diffusion', color: '#F97316', bg: '#FFF7ED', icon: List },
            { label: 'Désabonnés',      value: totalOptout, sub: 'Liste sélectionnée',      color: '#EF4444', bg: '#FEF2F2', icon: AlertTriangle },
          ].map(({ label, value, sub, color, bg, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
              <p className="mt-0.5 text-[10px]" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap items-center gap-2">

          {/* Sélecteur de liste */}
          <div className="relative">
            <button onClick={() => setListOpen(o => !o)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 min-w-[160px]">
              <List size={12} className="text-[#F4511E]" />
              <span className="flex-1 text-left">{selectedList?.name ?? 'Sélectionner une liste'}</span>
              <ChevronDown size={12} className={`transition-transform ${listOpen ? 'rotate-180' : ''}`} />
            </button>
            {listOpen && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-52 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                {loadingLists && (
                  <div className="flex items-center justify-center py-4"><Loader2 size={14} className="animate-spin text-gray-300" /></div>
                )}
                {!loadingLists && listes.length === 0 && (
                  <div className="px-4 py-3 text-[12px] text-gray-400">Aucune liste trouvée</div>
                )}
                {listes.map(l => (
                  <button key={l.id} onClick={() => { setSelList(l); setListOpen(false); setPage(1); setSelected([]) }}
                    className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${l.id === selectedList?.id ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
                    {l.name}
                    <span className="ml-1.5 text-[10px] text-gray-400">({l.contact_count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recherche */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <Search size={13} className="shrink-0 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Téléphone ou nom..."
              className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
            />
          </div>

          {/* Statut */}
          {(['all','active','optout'] as const).map(s => (
            <button key={s} onClick={() => setStatut(s)}
              className={`rounded-xl px-3 py-2 text-[12px] font-medium transition-colors ${statutFilter === s ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : 'Désabonnés'}
            </button>
          ))}
        </div>

        {/* Message "pas de liste sélectionnée" */}
        {!selectedList && !loadingLists && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF7ED]">
              <List size={22} className="text-[#F4511E]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1F2937]">Sélectionnez une liste</p>
            <p className="mt-1 text-[12px] text-gray-400">Choisissez une liste de diffusion pour voir ses contacts</p>
          </div>
        )}

        {/* Table des contacts */}
        {selectedList && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <p className="text-[12px] font-semibold text-[#1F2937]">
                {selectedList.name}
                <span className="ml-2 text-gray-400 font-normal">— {selectedList.contact_count} contact(s)</span>
              </p>
              {selected.length > 0 && (
                <span className="text-[11px] font-semibold text-[#F4511E]">{selected.length} sélectionné(s)</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    <th className="px-4 py-2.5 text-left">
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                        onChange={toggleAll} className="rounded" />
                    </th>
                    {['Contact', 'Téléphone', 'Statut', 'Ajouté le', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingCtx && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                      </td>
                    </tr>
                  )}
                  {!loadingCtx && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[12px] text-gray-400">
                        Aucun contact trouvé
                      </td>
                    </tr>
                  )}
                  {!loadingCtx && filtered.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[11px] font-bold text-white">
                            {initials(c)}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-[#1F2937]">{displayName(c)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Téléphone */}
                      <td className="px-4 py-3 text-[12px] text-gray-700 whitespace-nowrap">{c.phone}</td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        {c.opted_out ? (
                          <span className="flex w-fit items-center gap-1.5 rounded-full bg-[#FEF2F2] px-2.5 py-1 text-[10px] font-semibold text-[#DC2626]">
                            <PhoneOff size={9} /> Désabonné
                          </span>
                        ) : (
                          <span className="flex w-fit items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-semibold text-[#16A34A]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Actif
                          </span>
                        )}
                      </td>

                      {/* Date ajout */}
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button className="rounded p-1.5 text-[#3B82F6] hover:bg-blue-50 transition-colors" title="Envoyer SMS">
                          <Send size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.lastPage > 1 && (
              <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
                <span className="text-[11px] text-gray-400">
                  Page {meta.page} / {meta.lastPage} — {meta.total} contacts
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(5, meta.lastPage) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold ${page === n ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {showModal && selectedList && (
        <AddContactModal
          listId={selectedList.id}
          listName={selectedList.name}
          onClose={() => setModal(false)}
          onAdded={() => {
            setModal(false)
            fetchContacts(selectedList.id, page)
            setListes(prev => prev.map(l => l.id === selectedList.id ? { ...l, contact_count: l.contact_count + 1 } : l))
          }}
        />
      )}

      {showCrmModal && selectedList && (
        <ImportCrmModal
          listId={selectedList.id}
          listName={selectedList.name}
          onClose={() => setCrmModal(false)}
          onImported={(added) => {
            fetchContacts(selectedList.id, page)
            setListes(prev => prev.map(l => l.id === selectedList.id ? { ...l, contact_count: l.contact_count + added } : l))
          }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
