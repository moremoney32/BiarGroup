import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, ChevronDown, Trash2, BarChart2, Calendar, Send,
  Users, Loader2, X, AlertCircle, RefreshCw, List,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { PaginationMeta } from '../../../services/sms.service'
import { useToast } from '../../../hooks/useToast'
import type { SmsScheduled, SmsContactList, SmsSenderId } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const STATUT_STYLE: Record<string, { bg: string; text: string }> = {
  pending:    { bg: '#FFF7ED', text: '#EA580C' },
  processing: { bg: '#EFF6FF', text: '#2563EB' },
  dispatched: { bg: '#F0FDF4', text: '#16A34A' },
  cancelled:  { bg: '#FEF2F2', text: '#DC2626' },
  failed:     { bg: '#FEF2F2', text: '#DC2626' },
}

const STATUT_LABEL: Record<string, string> = {
  pending:    'En attente',
  processing: 'En cours',
  dispatched: 'Envoyé',
  cancelled:  'Annulé',
  failed:     'Échoué',
}

// ── Modal : Programmer un SMS ─────────────────────────────────

interface ProgrammerModalProps { onClose: () => void; onCreated: () => void }

function ProgrammerModal({ onClose, onCreated }: ProgrammerModalProps) {
  const [titre, setTitre]         = useState('')
  const [message, setMsg]         = useState('')
  const [senderId, setSender]     = useState('')
  const [listId, setListId]       = useState<number | ''>('')
  const [scheduledAt, setDate]    = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [senderIds, setSenderIds] = useState<SmsSenderId[]>([])
  const [lists, setLists]         = useState<SmsContactList[]>([])
  const [initLoading, setInit]    = useState(true)

  useEffect(() => {
    Promise.all([
      smsService.getSenderIds().catch(() => [] as SmsSenderId[]),
      smsService.getContactLists().catch(() => [] as SmsContactList[]),
    ]).then(([ids, ls]) => {
      const approved = ids.filter(s => s.status === 'approved')
      setSenderIds(approved)
      if (approved.length === 1) setSender(approved[0].sender_id)
      setLists(ls)
    }).finally(() => setInit(false))
  }, [])

  // Date minimum = maintenant + 6 minutes (le backend exige 5 min minimum)
  const minDate = new Date(Date.now() + 6 * 60 * 1000).toISOString().slice(0, 16)

  async function handleCreate() {
    if (!titre.trim())   { setError('Titre requis'); return }
    if (!senderId)       { setError('Expéditeur requis'); return }
    if (!listId)         { setError('Liste de contacts requise — sans liste, le SMS ne sera pas envoyé'); return }
    if (!message.trim()) { setError('Message requis'); return }
    if (!scheduledAt)    { setError('Date et heure requises'); return }

    setLoading(true); setError('')
    try {
      await smsService.createScheduled({
        titre: titre.trim(),
        message: message.trim(),
        senderId,
        listId: Number(listId),
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const selectedList = lists.find(l => l.id === Number(listId))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Programmer un SMS</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {initLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          ) : (
            <>
              {/* Titre */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Titre *</label>
                <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
                  placeholder="Ex: Promo Weekend"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
                />
              </div>

              {/* Sender ID */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Expéditeur (Sender ID) *</label>
                {senderIds.length === 0 ? (
                  <p className="rounded-xl border border-orange-200 bg-[#FFF7ED] px-3 py-2.5 text-[11px] text-orange-600">
                    Aucun Sender ID approuvé. Allez dans "Identifiants SMS" pour en créer un.
                  </p>
                ) : (
                  <select value={senderId} onChange={e => setSender(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 bg-white">
                    <option value="">— Choisir un expéditeur —</option>
                    {senderIds.map(s => (
                      <option key={s.id} value={s.sender_id}>{s.sender_id}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Liste de contacts */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                  Liste de contacts *
                  <span className="ml-1 font-normal text-gray-400">(requis pour l'envoi)</span>
                </label>
                {lists.length === 0 ? (
                  <p className="rounded-xl border border-orange-200 bg-[#FFF7ED] px-3 py-2.5 text-[11px] text-orange-600">
                    Aucune liste disponible. Créez-en une dans "Gestion des listes".
                  </p>
                ) : (
                  <select value={listId} onChange={e => setListId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 bg-white">
                    <option value="">— Choisir une liste —</option>
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.contact_count.toLocaleString('fr-FR')} contacts)</option>
                    ))}
                  </select>
                )}
                {selectedList && (
                  <p className="mt-1 text-[10px] font-semibold text-[#16A34A]">
                    ~{selectedList.contact_count.toLocaleString('fr-FR')} destinataire(s)
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Message *</label>
                <textarea rows={3} value={message} onChange={e => setMsg(e.target.value)}
                  placeholder="Votre message SMS..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
                />
                <p className="mt-0.5 text-[10px] text-gray-400">{message.length} caractères</p>
              </div>

              {/* Date & heure */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Date et heure d'envoi *</label>
                <input type="datetime-local" value={scheduledAt} onChange={e => setDate(e.target.value)}
                  min={minDate}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20"
                />
                <p className="mt-0.5 text-[10px] text-gray-400">Minimum 5 minutes dans le futur</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2.5 text-[11px] text-[#DC2626]">
                  <AlertCircle size={12} className="shrink-0" /> {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4 shrink-0">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleCreate}
            disabled={loading || initLoading || senderIds.length === 0 || lists.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4511E] py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
            Programmer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsMessagesProgrammesPage() {
  const navigate = useNavigate()
  const toast    = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast })

  const [programmes, setProgrammes] = useState<SmsScheduled[]>([])
  const [loading, setLoading]       = useState(true)
  const [fetchErr, setFetchErr]     = useState('')
  const [search, setSearch]         = useState('')
  const [statutFilter, setStatut]   = useState('all')
  const [statutOpen, setOpen]       = useState(false)
  const [showModal, setModal]       = useState(false)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [page, setPage]             = useState(1)
  const [meta, setMeta]             = useState<PaginationMeta | null>(null)

  const LIMIT = 15

  const fetchProgrammes = useCallback(async (p: number, status: string) => {
    setLoading(true)
    setFetchErr('')
    try {
      const { items, meta: m } = await smsService.getScheduled({
        page: p,
        limit: LIMIT,
        status: status !== 'all' ? status : undefined,
      })
      setProgrammes(items)
      setMeta(m)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les SMS programmés'
      setProgrammes([])
      setFetchErr(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProgrammes(page, statutFilter) }, [page, statutFilter, fetchProgrammes])

  // Auto-refresh toutes les 60s quand des SMS sont en attente ou en cours
  useEffect(() => {
    const hasPending = programmes.some(p => p.status === 'pending' || p.status === 'processing')
    if (!hasPending) return
    const t = setInterval(() => fetchProgrammes(page, statutFilter), 60_000)
    return () => clearInterval(t)
  }, [programmes, page, statutFilter, fetchProgrammes])

  function handleCreated() {
    setModal(false)
    toastRef.current.success('SMS programmé avec succès !')
    fetchProgrammes(page, statutFilter)
  }

  async function handleCancel(id: number) {
    if (!confirm('Annuler ce SMS programmé ?')) return
    setCancelling(id)
    try {
      await smsService.cancelScheduled(id)
      setProgrammes(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' as const } : p))
      toastRef.current.success('SMS programmé annulé')
    } catch (err: unknown) {
      toastRef.current.error(err instanceof Error ? err.message : "Erreur lors de l'annulation")
    } finally {
      setCancelling(null)
    }
  }

  const statutOptions = [
    { key: 'all',        label: 'Tous les statuts' },
    { key: 'pending',    label: 'En attente' },
    { key: 'processing', label: 'En cours' },
    { key: 'dispatched', label: 'Envoyé' },
    { key: 'cancelled',  label: 'Annulé' },
    { key: 'failed',     label: 'Échoué' },
  ]

  // Filtre texte côté client (sur la page courante)
  const filtered = programmes.filter(p =>
    p.titre.toLowerCase().includes(search.toLowerCase())
  )

  const pending    = programmes.filter(p => p.status === 'pending').length
  const dispatched = programmes.filter(p => p.status === 'dispatched').length

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-4 sm:px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">SMS Programmés</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Planifiez vos SMS pour un envoi automatique à une liste de contacts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchProgrammes(page, statutFilter)}
              className="rounded-xl border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50">
              <RefreshCw size={13} />
            </button>
            <button onClick={() => setModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={14} /> Nouveau SMS programmé
            </button>
          </div>
        </div>

        {/* Erreur de chargement */}
        {fetchErr && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-4 py-3 text-[12px] text-[#DC2626]">
            <AlertCircle size={14} className="shrink-0" /> {fetchErr}
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Calendar, bg: '#EFF6FF', color: '#3B82F6', label: 'En attente d\'envoi', value: loading ? '…' : pending },
            { icon: Send,     bg: '#F0FDF4', color: '#22C55E', label: 'SMS envoyés',          value: loading ? '…' : dispatched },
            { icon: Users,    bg: '#F5F3FF', color: '#8B5CF6', label: 'Total (page)',          value: loading ? '…' : (meta?.total ?? programmes.length) },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#FFEEE6] px-4 py-2.5 ring-1 ring-orange-200 focus-within:ring-2 focus-within:ring-[#F4511E]/40">
            <Search size={14} className="shrink-0 text-orange-300" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par titre..."
              className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-orange-300"
            />
          </div>
          <div className="relative">
            <button onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
              {statutOptions.find(s => s.key === statutFilter)?.label}
              <ChevronDown size={12} className={`transition-transform ${statutOpen ? 'rotate-180' : ''}`} />
            </button>
            {statutOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                {statutOptions.map(s => (
                  <button key={s.key} onClick={() => { setStatut(s.key); setPage(1); setOpen(false) }}
                    className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${s.key === statutFilter ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Titre & Message', 'Liste', 'Sender ID', 'Date & Heure planifiée', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="py-10 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center">
                    <Calendar size={28} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-[13px] font-semibold text-[#1F2937]">
                      {search || statutFilter !== 'all' ? 'Aucun résultat' : 'Aucun SMS programmé'}
                    </p>
                    {!search && statutFilter === 'all' && (
                      <p className="mt-1 text-[12px] text-gray-400">Cliquez sur "Nouveau SMS programmé" pour commencer</p>
                    )}
                  </td></tr>
                )}
                {!loading && filtered.map(p => {
                  const ss      = STATUT_STYLE[p.status] ?? { bg: '#F9FAFB', text: '#6B7280' }
                  const sendAt  = new Date(p.scheduled_at)
                  const isPast  = p.status === 'pending' && sendAt < new Date()
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-[12px] font-semibold text-[#1F2937] truncate">{p.titre}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400 truncate">{p.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        {p.list_id ? (
                          <span className="flex items-center gap-1 text-[11px] text-gray-600">
                            <List size={10} className="text-gray-400" />
                            {p.recipient_count > 0 ? `${p.recipient_count.toLocaleString('fr-FR')} contacts` : 'Liste liée'}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#FFEEE6] px-2.5 py-0.5 text-[10px] font-semibold text-[#F4511E]">
                          {p.sender_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-[12px] ${isPast ? 'text-orange-500 font-semibold' : 'text-gray-700'}`}>
                          {sendAt.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          ⏰ {sendAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {isPast && ' — en attente du cron'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.text }}>
                          {p.status === 'processing' && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 mr-1" />}
                          {STATUT_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.campaign_id && (
                            <button
                              onClick={() => navigate('/app/sms/masse')}
                              title="Voir la campagne générée"
                              className="rounded p-1.5 text-[#8B5CF6] hover:bg-purple-50 transition-colors">
                              <BarChart2 size={13} />
                            </button>
                          )}
                          {p.status === 'pending' && (
                            <button onClick={() => handleCancel(p.id)} disabled={cancelling === p.id}
                              title="Annuler"
                              className="rounded p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors disabled:opacity-40">
                              {cancelling === p.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
              <span className="text-[11px] text-gray-400">
                Page {meta.page} / {meta.lastPage} — {(meta.total).toLocaleString('fr-FR')} SMS programmé(s)
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                  Précédent
                </button>
                <button onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
                  className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

      </motion.div>

      {showModal && (
        <ProgrammerModal
          onClose={() => setModal(false)}
          onCreated={handleCreated}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
