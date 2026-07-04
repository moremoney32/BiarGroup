import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Upload, Download,
  ChevronDown, X, List, Trash2,
  Send, AlertTriangle, Users, Loader2, PhoneOff, Phone,
  Database, CheckSquare, Square, CheckCircle2,
  Filter, Pencil, Clock,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsContactList, SmsListContact, CrmContact } from '../../../types/sms.types'
import type { PaginationMeta } from '../../../services/sms.service'
import { motion } from 'framer-motion'

// ── Modal : Créer une liste ───────────────────────────────────

interface CreateListModalProps {
  onClose: () => void
  onCreated: (list: SmsContactList) => void
}

function CreateListModal({ onClose, onCreated }: CreateListModalProps) {
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
  const [loading, setLoad] = useState(false)
  const [error, setError]  = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('Le nom est requis'); return }
    setLoad(true); setError('')
    try {
      const list = await smsService.createContactList({ name: name.trim(), description: desc.trim() || undefined })
      onCreated(list)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoad(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Nouvelle liste de diffusion</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Nom de la liste *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Clients VIP, Newsletter abonnés..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
              Description <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Description de cette liste..."
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4511E] py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}

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

// ── Modal : Importer CSV ──────────────────────────────────────

interface CsvImportModalProps {
  listId: number
  listName: string
  onClose: () => void
  onImported: (added: number) => void
}

function CsvImportModal({ listId, listName, onClose, onImported }: CsvImportModalProps) {
  const [file, setFile]       = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [result, setResult]   = useState<{ added: number; skipped: number } | null>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  async function handleImport() {
    if (!file) return
    setLoading(true); setError('')
    try {
      const res = await smsService.importContactsCsv(listId, file)
      setResult({ added: res.added, skipped: res.skipped })
      onImported(res.added)
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(msg ?? 'Erreur lors de l\'import')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Importer un fichier CSV</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-gray-500">
            Liste cible : <span className="font-semibold text-[#F4511E]">{listName}</span>
          </p>
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
            <Upload size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-[12px] font-semibold text-gray-600">
              {file ? file.name : 'Sélectionnez un fichier CSV'}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">Format : téléphone, prénom, nom (1 par ligne)</p>
            <button onClick={() => inputRef.current?.click()}
              className="mt-3 rounded-xl border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-white">
              Choisir un fichier
            </button>
            <input ref={inputRef} type="file" accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(''); setResult(null) } }}
            />
          </div>
          <div className="rounded-xl bg-[#FFF7ED] p-3 text-[11px] text-[#92400E]">
            <p className="font-semibold mb-1">Format attendu :</p>
            <p className="font-mono">+243815001234,Jean,Kabongo</p>
            <p className="font-mono">+243995554321,Marie,Lumumba</p>
            <p className="mt-1 text-[10px] text-gray-400">Séparateur virgule ou point-virgule. La 1ère ligne peut être un en-tête.</p>
          </div>
          {result && (
            <div className="rounded-xl bg-[#F0FDF4] px-4 py-3">
              <p className="text-[12px] font-semibold text-[#15803D]">
                ✅ {result.added} contact(s) importé(s) avec succès
                {result.skipped > 0 && ` — ${result.skipped} ignoré(s)`}
              </p>
            </div>
          )}
          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
            {result ? 'Fermer' : 'Annuler'}
          </button>
          {!result && (
            <button onClick={handleImport} disabled={!file || loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4511E] py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Importer
            </button>
          )}
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

        {result && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3 shrink-0">
            <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
            <p className="text-[12px] font-semibold text-[#15803D]">
              {result.added} contact(s) importé(s) avec succès
              {result.skipped > 0 && ` — ${result.skipped} ignoré(s) (déjà présents ou sans téléphone)`}
            </p>
          </div>
        )}

        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 shrink-0">
          <Search size={13} className="text-gray-400 shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
          />
        </div>

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

// ── Helpers ───────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

function pageNums(current: number, last: number): number[] {
  const s = Math.max(1, Math.min(current - 2, last - 4))
  const e = Math.min(last, s + 4)
  return Array.from({ length: e - s + 1 }, (_, i) => s + i)
}

// ── Page principale ───────────────────────────────────────────

export default function SmsGestionContactsPage() {
  const navigate = useNavigate()
  const [listes, setListes]             = useState<SmsContactList[]>([])
  const [deliveryRate, setDelivRate]    = useState<number | null>(null)
  const [contacts, setContacts]         = useState<SmsListContact[]>([])
  const [meta, setMeta]                 = useState<PaginationMeta | null>(null)
  const [selectedList, setSelList]      = useState<SmsContactList | null>(null)
  const [listOpen, setListOpen]         = useState(false)
  const [statutFilter, setStatut]       = useState<'all' | 'active' | 'optout'>('all')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [loadingLists, setLoadingL]     = useState(true)
  const [loadingCtx, setLoadingCtx]     = useState(false)
  const [selected, setSelected]         = useState<number[]>([])
  const [showModal, setModal]           = useState(false)
  const [showCrmModal, setCrmModal]     = useState(false)
  const [showCsvModal, setCsvModal]     = useState(false)
  const [showCreateList, setCreateList] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchContacts = useCallback(async (
    listId: number, p: number, q = '', status: 'all' | 'active' | 'optout' = 'all'
  ) => {
    setLoadingCtx(true)
    try {
      const optedOut = status === 'optout' ? true : status === 'active' ? false : undefined
      const { contacts: data, meta: m } = await smsService.getContactsInList(listId, {
        page: p, limit: 20, search: q || undefined, optedOut,
      })
      setContacts(data)
      setMeta(m)
    } catch {
      setContacts([])
      setMeta(null)
    } finally {
      setLoadingCtx(false)
    }
  }, [])

  // Chargement initial des listes
  useEffect(() => {
    smsService.getContactLists().then(data => {
      setListes(data)
      if (data.length > 0) {
        setSelList(data[0])
        fetchContacts(data[0].id, 1, '', 'all')
      }
    }).catch(() => {}).finally(() => setLoadingL(false))
    smsService.getAnalyticsOverview()
      .then(ov => setDelivRate(ov.deliveryRate))
      .catch(() => setDelivRate(null))
  }, [fetchContacts])

  // Rechargement quand la page change (garde search + status courants)
  useEffect(() => {
    if (selectedList && page > 1) fetchContacts(selectedList.id, page, search, statutFilter)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleListChange(l: SmsContactList) {
    setSelList(l)
    setListOpen(false)
    setPage(1)
    setSearch('')
    setStatut('all')
    setSelected([])
    fetchContacts(l.id, 1, '', 'all')
  }

  function handleSearchChange(q: string) {
    setSearch(q)
    if (!selectedList) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchContacts(selectedList.id, 1, q, statutFilter)
    }, 300)
  }

  function handleStatusChange(s: 'all' | 'active' | 'optout') {
    setStatut(s)
    if (!selectedList) return
    setPage(1)
    fetchContacts(selectedList.id, 1, search, s)
  }

  async function handleDeleteList(l: SmsContactList) {
    if (!window.confirm(`Supprimer la liste "${l.name}" (${l.contact_count} contacts) ? Cette action est irréversible.`)) return
    try {
      await smsService.deleteContactList(l.id)
      const remaining = listes.filter(x => x.id !== l.id)
      setListes(remaining)
      if (selectedList?.id === l.id) {
        const next = remaining[0] ?? null
        setSelList(next)
        if (next) fetchContacts(next.id, 1, '', 'all')
        else { setContacts([]); setMeta(null) }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  function handleExport() {
    if (!selectedList || contacts.length === 0) return
    const BOM = '﻿'
    const header = 'Téléphone,Prénom,Nom,Statut,Date ajout'
    const rows = contacts.map(c =>
      [c.phone, c.first_name ?? '', c.last_name ?? '',
       c.opted_out ? 'Désabonné' : 'Actif',
       new Date(c.created_at).toLocaleDateString('fr-FR'),
      ].join(',')
    ).join('\n')
    const blob = new Blob([BOM + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedList.name.replace(/\s+/g, '_')}_contacts.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalContacts = listes.reduce((s, l) => s + l.contact_count, 0)

  const toggleSelect = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  const toggleAll = () =>
    setSelected(prev => prev.length === contacts.length ? [] : contacts.map(c => c.id))

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
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
              <Users size={22} className="text-[#F4511E]" />
              Gestion des Contacts SMS
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gérez tous vos contacts SMS en un seul endroit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => selectedList && setCrmModal(true)}
              disabled={!selectedList}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#1d4ed8] disabled:opacity-40">
              <Database size={13} /> Sync CRM
            </button>
            <button onClick={() => selectedList && setCsvModal(true)}
              disabled={!selectedList}
              className="flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#15803d] disabled:opacity-40">
              <Upload size={13} /> Importer
            </button>
            <button onClick={() => selectedList && setModal(true)}
              disabled={!selectedList}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-40">
              <Plus size={13} /> Nouveau Contact
            </button>
          </div>
        </div>

        {/* KPI Cards — pleines couleurs (maquette) */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Total Contacts', icon: Users,
              gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              value: totalContacts.toLocaleString('fr-FR'),
              sub: `${listes.length} liste(s) de diffusion`,
            },
            {
              label: 'Contacts Actifs', icon: Phone,
              gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
              value: totalContacts.toLocaleString('fr-FR'),
              sub: 'Non désabonnés',
            },
            {
              label: 'Listes de Diffusion', icon: List,
              gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              value: String(listes.length),
              sub: `${listes.filter(l => l.contact_count > 0).length} segments actifs`,
            },
            {
              label: 'Taux de Délivrabilité', icon: AlertTriangle,
              gradient: 'linear-gradient(135deg, #F97316, #F4511E)',
              value: deliveryRate !== null ? `${deliveryRate}%` : '—',
              sub: 'Basé sur les DLR',
            },
          ].map(({ label, value, sub, gradient, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: gradient }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-white/85">{label}</p>
                  <p className="mt-1 text-[24px] font-bold">{value}</p>
                </div>
                <Icon size={30} className="text-white/40" />
              </div>
              <p className="mt-2 text-[11px] text-white/80">{sub}</p>
            </div>
          ))}
        </div>

        {/* Barre de filtres */}
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {/* Recherche */}
            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <Search size={13} className="shrink-0 text-gray-400" />
              <input type="text" value={search} onChange={e => handleSearchChange(e.target.value)}
                placeholder="Rechercher par nom, téléphone, email..."
                className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
              />
              {search && (
                <button onClick={() => handleSearchChange('')} className="text-gray-300 hover:text-gray-500">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Sélecteur de liste */}
            <div className="relative">
              <button onClick={() => setListOpen(o => !o)}
                className="flex min-w-[170px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
                <span className="flex-1 text-left">{selectedList?.name ?? 'Toutes les listes'}</span>
                <ChevronDown size={12} className={`transition-transform ${listOpen ? 'rotate-180' : ''}`} />
              </button>
              {listOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-56 w-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                  {loadingLists && (
                    <div className="flex items-center justify-center py-4"><Loader2 size={14} className="animate-spin text-gray-300" /></div>
                  )}
                  {!loadingLists && listes.length === 0 && (
                    <div className="px-4 py-3 text-[12px] text-gray-400">Aucune liste — créez-en une</div>
                  )}
                  {listes.map(l => (
                    <div key={l.id}
                      className={`flex items-center justify-between px-3 py-2.5 ${l.id === selectedList?.id ? 'bg-orange-50/50' : 'hover:bg-orange-50/30'}`}>
                      <button
                        onClick={() => handleListChange(l)}
                        className={`flex-1 text-left text-[12px] ${l.id === selectedList?.id ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
                        {l.name}
                        <span className="ml-1.5 text-[10px] text-gray-400">({l.contact_count})</span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteList(l) }}
                        className="ml-2 shrink-0 rounded p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer cette liste">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Statut */}
            <div className="relative">
              <select
                value={statutFilter}
                onChange={e => handleStatusChange(e.target.value as 'all' | 'active' | 'optout')}
                className="appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-[12px] font-medium text-gray-700 outline-none hover:bg-gray-50">
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="optout">Désabonnés</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Filtres (avancés — à venir) */}
            <button title="Filtres avancés"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
              <Filter size={13} /> Filtres
            </button>

            {/* Export */}
            <button onClick={handleExport}
              disabled={!selectedList || contacts.length === 0}
              title="Exporter la page courante en CSV"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
              <Download size={13} /> Exporter
            </button>
          </div>
        </div>

        {/* Raccourcis */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button onClick={() => navigate('/app/sms/listes')}
            className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
            <List size={20} className="mb-2 text-[#F4511E]" />
            <p className="text-[14px] font-bold text-[#1F2937]">Gérer les Listes</p>
            <p className="mt-0.5 text-[11px] text-gray-500">{listes.length} liste(s) active(s)</p>
          </button>
          <button onClick={() => navigate('/app/sms/listes')}
            className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
            <Filter size={20} className="mb-2 text-[#3B82F6]" />
            <p className="text-[14px] font-bold text-[#1F2937]">Créer un Segment</p>
            <p className="mt-0.5 text-[11px] text-gray-500">Segmentation avancée</p>
          </button>
          <button title="Bientôt disponible"
            className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md">
            <AlertTriangle size={20} className="mb-2 text-[#F4511E]" />
            <p className="text-[14px] font-bold text-[#1F2937]">Détecter Doublons</p>
            <p className="mt-0.5 text-[11px] text-gray-500">— doublons détectés</p>
          </button>
          <button onClick={() => navigate('/app/sms/masse')}
            className="rounded-2xl bg-[#F4511E] p-4 text-left text-white shadow-sm transition-colors hover:bg-[#d9400f]">
            <Send size={20} className="mb-2 text-white/90" />
            <p className="text-[14px] font-bold">Envoyer SMS</p>
            <p className="mt-0.5 text-[11px] text-white/80">
              Campagne vers {selectedList ? selectedList.contact_count.toLocaleString('fr-FR') : totalContacts.toLocaleString('fr-FR')} contacts
            </p>
          </button>
        </div>

        {/* État vide — aucune liste */}
        {!selectedList && !loadingLists && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF7ED]">
              <List size={22} className="text-[#F4511E]" />
            </div>
            <p className="text-[14px] font-semibold text-[#1F2937]">Aucune liste de diffusion</p>
            <p className="mt-1 text-[12px] text-gray-400">Créez votre première liste pour commencer</p>
            <button onClick={() => setCreateList(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Nouvelle liste
            </button>
          </div>
        )}

        {/* Table des contacts */}
        {selectedList && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <p className="text-[12px] font-semibold text-[#1F2937]">
                {selectedList.name}
                <span className="ml-2 text-gray-400 font-normal">
                  — {meta ? `${meta.total} contact(s)` : `${selectedList.contact_count} contact(s)`}
                </span>
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
                      <input type="checkbox"
                        checked={selected.length === contacts.length && contacts.length > 0}
                        onChange={toggleAll} className="rounded" />
                    </th>
                    {['Contact', 'Téléphone', 'Localisation', 'Tags', 'Statut', 'Performance', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingCtx && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center">
                        <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                      </td>
                    </tr>
                  )}
                  {!loadingCtx && contacts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[12px] text-gray-400">
                        {search || statutFilter !== 'all'
                          ? 'Aucun contact ne correspond aux filtres'
                          : 'Aucun contact dans cette liste'}
                      </td>
                    </tr>
                  )}
                  {!loadingCtx && contacts.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="rounded" />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[11px] font-bold text-white">
                            {initials(c)}
                          </div>
                          <p className="text-[12px] font-semibold text-[#1F2937]">{displayName(c)}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[12px] text-gray-700 whitespace-nowrap font-mono">{c.phone}</td>

                      {/* Localisation — dispo quand le backend stockera ville/pays */}
                      <td className="px-4 py-3 text-[11px] text-gray-400">—</td>

                      {/* Tags — dispo quand le backend stockera les tags contact */}
                      <td className="px-4 py-3 text-[11px] text-gray-400">—</td>

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

                      {/* Performance — délivrabilité/ouverture/clic par contact à venir */}
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">—</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <button className="rounded p-1.5 text-[#3B82F6] hover:bg-blue-50 transition-colors" title="Envoyer SMS individuel">
                            <Send size={13} />
                          </button>
                          <button className="rounded p-1.5 text-gray-300 cursor-not-allowed" title="Modifier — bientôt disponible" disabled>
                            <Pencil size={13} />
                          </button>
                          <button className="rounded p-1.5 text-gray-300 cursor-not-allowed" title="Historique — bientôt disponible" disabled>
                            <Clock size={13} />
                          </button>
                          <button className="rounded p-1.5 text-gray-300 cursor-not-allowed" title="Supprimer — bientôt disponible" disabled>
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                  {pageNums(page, meta.lastPage).map(n => (
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

      </motion.div>

      {/* Modals */}
      {showCreateList && (
        <CreateListModal
          onClose={() => setCreateList(false)}
          onCreated={list => {
            setListes(prev => [...prev, list])
            setCreateList(false)
            handleListChange(list)
          }}
        />
      )}

      {showModal && selectedList && (
        <AddContactModal
          listId={selectedList.id}
          listName={selectedList.name}
          onClose={() => setModal(false)}
          onAdded={() => {
            setModal(false)
            fetchContacts(selectedList.id, page, search, statutFilter)
            setListes(prev => prev.map(l => l.id === selectedList.id ? { ...l, contact_count: l.contact_count + 1 } : l))
          }}
        />
      )}

      {showCrmModal && selectedList && (
        <ImportCrmModal
          listId={selectedList.id}
          listName={selectedList.name}
          onClose={() => setCrmModal(false)}
          onImported={added => {
            fetchContacts(selectedList.id, page, search, statutFilter)
            setListes(prev => prev.map(l => l.id === selectedList.id ? { ...l, contact_count: l.contact_count + added } : l))
          }}
        />
      )}

      {showCsvModal && selectedList && (
        <CsvImportModal
          listId={selectedList.id}
          listName={selectedList.name}
          onClose={() => setCsvModal(false)}
          onImported={added => {
            fetchContacts(selectedList.id, page, search, statutFilter)
            setListes(prev => prev.map(l => l.id === selectedList.id ? { ...l, contact_count: l.contact_count + added } : l))
          }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
