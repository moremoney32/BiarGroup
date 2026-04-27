import { useState, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Pencil, Check, XCircle, ChevronDown, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import type { Contact } from '../../../types/contact.types'
import apiFetch from '../../../services/api'

export interface ContactGroup {
  id: number
  name: string
  contacts: Contact[]
}

interface EditRow   { name: string; email: string; phone: string }
interface EditErrors { name?: string; email?: string; phone?: string }

const PER_PAGE = 5
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRe = /^\+?[\d\s\-(). ]{7,20}$/
const emptyForm = { firstName: '', lastName: '', email: '', phone: '' }

interface Props { open: boolean; onClose: () => void; onApply?: (groups: ContactGroup[]) => void }

function validateRow(row: EditRow): EditErrors {
  const err: EditErrors = {}
  if (!row.name.trim()) err.name = 'Le nom est requis'
  if (row.email && !emailRe.test(row.email)) err.email = 'Email invalide'
  if (row.phone && !phoneRe.test(row.phone)) err.phone = 'Numéro invalide'
  return err
}

export default function ContactGestionModal({ open, onClose, onApply }: Props) {
  const [tab, setTab] = useState<'individuel' | 'groupe'>('individuel')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups]     = useState<ContactGroup[]>([])
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')

  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [selectedGroups, setSelectedGroups]     = useState<number[]>([])
  const [ensembleName, setEnsembleName]         = useState('')
  const [ensembleError, setEnsembleError]       = useState('')
  const [creatingGroup, setCreatingGroup]       = useState(false)

  const [page, setPage]                 = useState(1)
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)

  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [formErrors, setFormErrors]   = useState<EditErrors>({})
  const [savingContact, setSavingContact] = useState(false)

  const [editingId, setEditingId]     = useState<number | null>(null)
  const [editRow, setEditRow]         = useState<EditRow>({ name: '', email: '', phone: '' })
  const [editErrors, setEditErrors]   = useState<EditErrors>({})
  const [savingEdit, setSavingEdit]   = useState(false)

  const totalPages = Math.ceil((tab === 'individuel' ? contacts.length : groups.length) / PER_PAGE)
  const start = (page - 1) * PER_PAGE
  const visibleContacts = contacts.slice(start, start + PER_PAGE)
  const visibleGroups   = groups.slice(start, start + PER_PAGE)

  // Charger contacts et groupes dès l'ouverture
  useEffect(() => {
    if (!open) return
    loadAll()
  }, [open])

  async function loadAll() {
    setLoading(true)
    setApiError('')
    try {
      const [cRes, gRes] = await Promise.all([
        apiFetch.get<{ data: Contact[] }>('/contacts'),
        apiFetch.get<{ data: ContactGroup[] }>('/contacts/groups'),
      ])
      setContacts(cRes.data ?? [])
      setGroups(gRes.data ?? [])
    } catch {
      setApiError('Impossible de charger les contacts')
    } finally {
      setLoading(false)
    }
  }

  const toggleContact = (id: number) =>
    setSelectedContacts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleGroup = (id: number) =>
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const switchTab = (t: 'individuel' | 'groupe') => { setTab(t); setPage(1); setExpandedGroup(null) }

  const inputCls = (err?: string) =>
    `w-full rounded-lg border px-2.5 py-1.5 text-[12px] text-gray-800 bg-white outline-none transition-colors placeholder:text-gray-300 ${err ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#1a73e8]'}`

  // ── Ajouter un contact ───────────────────────────────────────────────────
  const handleAddContact = async () => {
    const row: EditRow = { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email, phone: form.phone }
    const errs = validateRow(row)
    if (Object.keys(errs).length) { setFormErrors(errs); return }

    setSavingContact(true)
    try {
      const res = await apiFetch.post<{ data: Contact }>('/contacts', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
      })
      setContacts(prev => [res.data, ...prev])
      setForm(emptyForm); setFormErrors({}); setShowForm(false)
    } catch {
      setFormErrors({ name: 'Erreur lors de la création' })
    } finally {
      setSavingContact(false)
    }
  }

  // ── Supprimer contact ────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await apiFetch.delete(`/contacts/${id}`)
      setContacts(prev => prev.filter(c => c.id !== id))
      setSelectedContacts(prev => prev.filter(x => x !== id))
      if (editingId === id) setEditingId(null)
    } catch {
      setApiError('Erreur lors de la suppression')
    }
  }

  // ── Édition inline ───────────────────────────────────────────────────────
  const startEdit = (c: Contact) => {
    setEditingId(c.id)
    setEditRow({ name: `${c.firstName} ${c.lastName ?? ''}`.trim(), email: c.email ?? '', phone: c.phone })
    setEditErrors({})
  }

  const saveEdit = async (id: number) => {
    const errs = validateRow(editRow)
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    const [first, ...rest] = editRow.name.trim().split(' ')

    setSavingEdit(true)
    try {
      await apiFetch.put(`/contacts/${id}`, {
        firstName: first,
        lastName: rest.join(' ') || null,
        email: editRow.email || null,
        phone: editRow.phone || null,
      })
      setContacts(prev => prev.map(c => c.id === id
        ? { ...c, firstName: first, lastName: rest.join(' ') || null, email: editRow.email || null, phone: editRow.phone }
        : c
      ))
      setEditingId(null); setEditErrors({})
    } catch {
      setEditErrors({ name: 'Erreur lors de la mise à jour' })
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Créer un groupe ──────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!ensembleName.trim()) { setEnsembleError('Donnez un nom au groupe'); return }
    if (selectedContacts.length === 0) { setEnsembleError('Sélectionnez au moins un contact'); return }

    setCreatingGroup(true)
    setEnsembleError('')
    try {
      const res = await apiFetch.post<{ data: { id: number; name: string; contactCount: number } }>(
        '/contacts/groups',
        { name: ensembleName.trim(), contactIds: selectedContacts }
      )
      const members = contacts.filter(c => selectedContacts.includes(c.id))
      setGroups(prev => [{ id: res.data.id, name: res.data.name, contacts: members }, ...prev])
      setEnsembleName('')
      setSelectedContacts([])
      switchTab('groupe')
    } catch {
      setEnsembleError('Erreur lors de la création du groupe')
    } finally {
      setCreatingGroup(false)
    }
  }

  // ── Supprimer un groupe ──────────────────────────────────────────────────
  const handleDeleteGroup = async (id: number) => {
    try {
      await apiFetch.delete(`/contacts/groups/${id}`)
      setGroups(prev => prev.filter(g => g.id !== id))
      setSelectedGroups(prev => prev.filter(x => x !== id))
    } catch {
      setApiError('Erreur lors de la suppression du groupe')
    }
  }

  // ── Appliquer la sélection ───────────────────────────────────────────────
  const handleApply = () => {
    const applied = groups.filter(g => selectedGroups.includes(g.id))
    onApply?.(applied)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-[#1F2937]">Gestion des contacts</h2>
                  <p className="mt-0.5 max-w-sm text-[11px] leading-relaxed text-gray-500">
                    Importer de nouveaux fichiers, supprimer, modifier et subdiviser vos contacts en ensembles personnalisés pour des campagnes précises.
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => { setShowForm(v => !v); setEditingId(null); setFormErrors({}) }}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={13} /> Nouveau contact
                  </button>
                  <button className="flex items-center gap-1 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#1557b0]">
                    <Plus size={13} /> Importer un fichier
                  </button>
                  <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Fermer">
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Erreur globale */}
              <AnimatePresence>
                {apiError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mx-6 mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    <AlertCircle size={13} className="shrink-0" />
                    {apiError}
                    <button onClick={() => setApiError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={12} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Formulaire nouveau contact */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mx-6 mb-3 rounded-xl border border-[#1a73e8]/30 bg-blue-50/30 p-4">
                      <p className="mb-3 text-[12px] font-semibold text-[#1F2937]">Nouveau contact</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input type="text" placeholder="Prénom" value={form.firstName}
                            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                            className={inputCls(formErrors.name)} />
                        </div>
                        <div>
                          <input type="text" placeholder="Nom" value={form.lastName}
                            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                            className={inputCls(formErrors.name)} />
                          {formErrors.name && <p className="mt-0.5 text-[10px] text-red-500">{formErrors.name}</p>}
                        </div>
                        <div>
                          <input type="email" placeholder="Email" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className={inputCls(formErrors.email)} />
                          {formErrors.email && <p className="mt-0.5 text-[10px] text-red-500">{formErrors.email}</p>}
                        </div>
                        <div>
                          <input type="tel" placeholder="Téléphone (ex: +243...)" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className={inputCls(formErrors.phone)} />
                          {formErrors.phone && <p className="mt-0.5 text-[10px] text-red-500">{formErrors.phone}</p>}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => { setShowForm(false); setForm(emptyForm); setFormErrors({}) }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50">
                          Annuler
                        </button>
                        <button onClick={handleAddContact} disabled={savingContact}
                          className="flex items-center gap-1 rounded-lg bg-[#1a73e8] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1557b0] disabled:opacity-60">
                          {savingContact ? <><Loader2 size={12} className="animate-spin" /> Enregistrement...</> : 'Ajouter'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Import zone */}
              {!showForm && (
                <div className="mx-6 mb-4 flex items-center justify-between rounded-xl border-2 border-dashed border-gray-200 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#1F2937]">Importer des contacts</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Glissez-déposez un fichier CSV ou cliquez pour sélectionner un fichier.<br />
                      Nous détectons automatiquement le format des colonnes.
                    </p>
                  </div>
                  <button className="ml-4 flex shrink-0 items-center gap-1 rounded-lg bg-[#1a73e8] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#1557b0]">
                    <Plus size={13} /> Importer un fichier
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="mx-6 mb-3 flex overflow-hidden rounded-xl border border-gray-200">
                {(['individuel', 'groupe'] as const).map(t => (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`flex-1 py-2 text-[12px] font-semibold transition-colors ${tab === t ? 'bg-[#F4511E] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {t === 'individuel' ? 'Contact individuel' : 'Groupe de contacts'}
                  </button>
                ))}
              </div>

              {/* Contenu */}
              <div className="mx-6 max-h-[280px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-[12px] text-gray-400">
                    <Loader2 size={18} className="mr-2 animate-spin" /> Chargement...
                  </div>
                ) : tab === 'individuel' ? (
                  <table className="w-full table-fixed text-[12px]">
                    <colgroup>
                      <col className="w-8" />
                      <col className="w-[28%]" />
                      <col className="w-[30%]" />
                      <col className="w-[22%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Sél.</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Noms et Prénom</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Email</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Téléphone</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[12px] text-gray-400 italic">
                            Aucun contact — cliquez sur "Nouveau contact" pour commencer
                          </td>
                        </tr>
                      )}
                      {visibleContacts.map(c => {
                        const selected  = selectedContacts.includes(c.id)
                        const isEditing = editingId === c.id
                        const fullName  = `${c.firstName} ${c.lastName ?? ''}`.trim()
                        return isEditing ? (
                          <tr key={c.id} className="border-b border-gray-100 bg-orange-50/30">
                            <td colSpan={5} className="py-3 pr-2">
                              <div className="flex flex-col gap-2">
                                <div>
                                  <input autoFocus type="text" placeholder="Prénom Nom" value={editRow.name}
                                    onChange={e => setEditRow(r => ({ ...r, name: e.target.value }))}
                                    className={inputCls(editErrors.name)} />
                                  {editErrors.name && <p className="mt-0.5 text-[10px] text-red-500">{editErrors.name}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <input type="email" placeholder="Email" value={editRow.email}
                                      onChange={e => setEditRow(r => ({ ...r, email: e.target.value }))}
                                      className={inputCls(editErrors.email)} />
                                    {editErrors.email && <p className="mt-0.5 text-[10px] text-red-500">{editErrors.email}</p>}
                                  </div>
                                  <div>
                                    <input type="tel" placeholder="Téléphone (ex: +243...)" value={editRow.phone}
                                      onChange={e => setEditRow(r => ({ ...r, phone: e.target.value }))}
                                      className={inputCls(editErrors.phone)} />
                                    {editErrors.phone && <p className="mt-0.5 text-[10px] text-red-500">{editErrors.phone}</p>}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => saveEdit(c.id)} disabled={savingEdit}
                                    className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-600 disabled:opacity-60">
                                    {savingEdit ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Valider
                                  </button>
                                  <button onClick={() => { setEditingId(null); setEditErrors({}) }}
                                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50">
                                    <XCircle size={11} /> Annuler
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={c.id} className={`border-b border-gray-50 last:border-0 transition-colors ${selected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
                            <td className="py-2.5">
                              <input type="checkbox" checked={selected} onChange={() => toggleContact(c.id)}
                                className="h-4 w-4 cursor-pointer accent-[#1a73e8]" />
                            </td>
                            <td className="py-2.5 pr-2">
                              <span title={fullName} className="block max-w-full truncate font-medium text-gray-700">{fullName}</span>
                            </td>
                            <td className="py-2.5 pr-2">
                              <span title={c.email ?? ''} className="block max-w-full truncate text-gray-400">{c.email ?? '—'}</span>
                            </td>
                            <td className="py-2.5 pr-2">
                              <span title={c.phone} className="block max-w-full truncate text-gray-500">{c.phone}</span>
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleDelete(c.id)} className="text-gray-300 transition-colors hover:text-red-500" aria-label="Supprimer"><Trash2 size={13} /></button>
                                <button onClick={() => startEdit(c)} className="text-gray-300 transition-colors hover:text-[#1a73e8]" aria-label="Modifier"><Pencil size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full table-fixed text-[12px]">
                    <colgroup>
                      <col className="w-8" />
                      <col />
                      <col className="w-20" />
                      <col className="w-16" />
                    </colgroup>
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Sél.</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Groupe</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Contacts</th>
                        <th className="pb-2 text-left text-[11px] font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-[12px] text-gray-400 italic">
                            Aucun groupe — sélectionnez des contacts et créez un groupe
                          </td>
                        </tr>
                      )}
                      {visibleGroups.map(g => {
                        const selected = selectedGroups.includes(g.id)
                        const expanded = expandedGroup === g.id
                        return (
                          <Fragment key={g.id}>
                            <tr className={`border-b border-gray-50 transition-colors ${selected ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
                              <td className="py-2.5">
                                <input type="checkbox" checked={selected} onChange={() => toggleGroup(g.id)}
                                  className="h-4 w-4 cursor-pointer accent-[#1a73e8]" />
                              </td>
                              <td className="py-2.5 pr-2">
                                <button
                                  onClick={() => setExpandedGroup(expanded ? null : g.id)}
                                  className="flex items-center gap-1 text-left font-medium text-gray-700 hover:text-[#F4511E]"
                                >
                                  {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                  <span title={g.name} className="max-w-[180px] truncate">{g.name}</span>
                                </button>
                              </td>
                              <td className="py-2.5 pr-2 text-gray-400">{g.contacts.length} contact{g.contacts.length > 1 ? 's' : ''}</td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleDeleteGroup(g.id)} className="text-gray-300 transition-colors hover:text-red-500" aria-label="Supprimer"><Trash2 size={13} /></button>
                                </div>
                              </td>
                            </tr>

                            {expanded && (
                              <tr key={`${g.id}-detail`}>
                                <td colSpan={4} className="bg-gray-50/80 px-4 pb-3 pt-1">
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="border-b border-gray-200">
                                        <th className="pb-1.5 text-left font-semibold text-gray-400">Nom</th>
                                        <th className="pb-1.5 text-left font-semibold text-gray-400">Email</th>
                                        <th className="pb-1.5 text-left font-semibold text-gray-400">Téléphone</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {g.contacts.map((c, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0">
                                          <td className="py-1.5 pr-3 font-medium text-gray-600">{c.firstName} {c.lastName}</td>
                                          <td className="py-1.5 pr-3 text-gray-400">{c.email ?? '—'}</td>
                                          <td className="py-1.5 text-gray-400">{c.phone}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="mx-6 mt-4 mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    Préc.
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    Suiv.
                  </button>
                </div>

                {tab === 'individuel' && selectedContacts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="whitespace-nowrap text-[11px] text-gray-600">Créer un groupe ({selectedContacts.length} sél.)</p>
                    <div className="flex flex-col">
                      <input type="text" value={ensembleName}
                        onChange={e => { setEnsembleName(e.target.value); setEnsembleError('') }}
                        placeholder="Nom du groupe"
                        className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-[#1a73e8]" />
                      {ensembleError && <p className="mt-0.5 text-[10px] text-red-500">{ensembleError}</p>}
                    </div>
                    <button onClick={handleCreateGroup} disabled={creatingGroup}
                      className="flex items-center gap-1 rounded-lg bg-[#1a73e8] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#1557b0] disabled:opacity-60">
                      {creatingGroup ? <Loader2 size={11} className="animate-spin" /> : null}
                      Créer
                    </button>
                  </motion.div>
                )}

                {tab === 'groupe' && selectedGroups.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <button onClick={handleApply}
                      className="rounded-lg bg-[#F4511E] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
                      Appliquer ({selectedGroups.length} groupe{selectedGroups.length > 1 ? 's' : ''})
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
