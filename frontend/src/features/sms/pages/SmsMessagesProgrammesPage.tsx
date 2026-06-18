import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ChevronDown, Trash2, BarChart2, Calendar, Send, Users, Loader2, X } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsScheduled } from '../../../types/sms.types'

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
  const [titre, setTitre]       = useState('')
  const [message, setMsg]       = useState('')
  const [senderId, setSender]   = useState('')
  const [scheduledAt, setDate]  = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleCreate() {
    if (!titre.trim() || !message.trim() || !senderId.trim() || !scheduledAt) {
      setError('Tous les champs sont requis'); return
    }
    setLoading(true); setError('')
    try {
      await smsService.createScheduled({
        titre: titre.trim(),
        message: message.trim(),
        senderId: senderId.trim().toUpperCase(),
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      onCreated()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      setError(msg ?? 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Programmer un SMS</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Titre *', value: titre, onChange: setTitre, placeholder: 'Ex: Promo Weekend' },
            { label: 'Sender ID *', value: senderId, onChange: (v: string) => setSender(v.toUpperCase()), placeholder: 'BIARGROUP' },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label}>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">{label}</label>
              <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Message *</label>
            <textarea rows={3} value={message} onChange={e => setMsg(e.target.value)}
              placeholder="Votre message SMS..."
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Date et heure d'envoi *</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
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
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
            Programmer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

export default function SmsMessagesProgrammesPage() {
  const [programmes, setProgrammes] = useState<SmsScheduled[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statutFilter, setStatut]   = useState('all')
  const [statutOpen, setOpen]       = useState(false)
  const [showModal, setModal]       = useState(false)
  const [cancelling, setCancelling] = useState<number | null>(null)

  const fetchProgrammes = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await smsService.getScheduled()
      setProgrammes(items)
    } catch {
      setProgrammes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProgrammes() }, [fetchProgrammes])

  async function handleCancel(id: number) {
    if (!confirm('Annuler ce SMS programmé ?')) return
    setCancelling(id)
    try {
      await smsService.cancelScheduled(id)
      setProgrammes(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' as const } : p))
    } catch {
      alert('Erreur lors de l\'annulation')
    } finally {
      setCancelling(null)
    }
  }

  const statutOptions = [
    { key: 'all', label: 'Tous les statuts' },
    { key: 'pending', label: 'En attente' },
    { key: 'dispatched', label: 'Envoyé' },
    { key: 'cancelled', label: 'Annulé' },
  ]

  const filtered = programmes.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatut = statutFilter === 'all' || p.status === statutFilter
    return matchSearch && matchStatut
  })

  const pending   = programmes.filter(p => p.status === 'pending').length
  const dispatched = programmes.filter(p => p.status === 'dispatched').length

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 py-5">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">SMS Programmés</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Planifiez vos SMS pour un envoi automatique</p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
            <Plus size={14} /> Nouveau SMS programmé
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Calendar, bg: '#EFF6FF', color: '#3B82F6', label: 'SMS programmés', value: loading ? '…' : pending },
            { icon: Send,     bg: '#F0FDF4', color: '#22C55E', label: 'SMS envoyés',    value: loading ? '…' : dispatched },
            { icon: Users,    bg: '#F5F3FF', color: '#8B5CF6', label: 'Total',          value: loading ? '…' : programmes.length },
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
              placeholder="Rechercher un SMS programmé..."
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
                  <button key={s.key} onClick={() => { setStatut(s.key); setOpen(false) }}
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
                  {['Titre & Message', 'Sender ID', 'Date & Heure planifiée', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="py-10 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-[12px] text-gray-400">
                    {search || statutFilter !== 'all' ? 'Aucun résultat' : 'Aucun SMS programmé — cliquez sur "Nouveau SMS programmé"'}
                  </td></tr>
                )}
                {!loading && filtered.map(p => {
                  const ss = STATUT_STYLE[p.status] ?? { bg: '#F9FAFB', text: '#6B7280' }
                  const sendAt = new Date(p.send_at)
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-[12px] font-semibold text-[#1F2937]">{p.name}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400 truncate">{p.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#FFEEE6] px-2.5 py-0.5 text-[10px] font-semibold text-[#F4511E]">
                          {p.sender_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-700">
                          {sendAt.toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          ⏰ {sendAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.text }}>
                          {STATUT_LABEL[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.campaign_id && (
                            <button className="rounded p-1.5 text-[#8B5CF6] hover:bg-purple-50 transition-colors" title="Voir rapport">
                              <BarChart2 size={13} />
                            </button>
                          )}
                          {p.status === 'pending' && (
                            <button onClick={() => handleCancel(p.id)} disabled={cancelling === p.id}
                              className="rounded p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors">
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
        </div>

      </div>

      {showModal && (
        <ProgrammerModal
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); fetchProgrammes() }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
