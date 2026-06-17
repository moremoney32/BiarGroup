import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Send, CheckCircle2, XCircle, TrendingUp, Plus, ChevronDown,
  Zap, Settings2, Loader2, Trash2, Play, Eye, X, Clock,
  AlertCircle, RefreshCw, Users, List,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsCampaign, SmsSenderId, SmsContactList, SmsTemplate, CampaignStatus } from '../../../types/sms.types'
import type { PaginationMeta } from '../../../services/sms.service'

// GSM-7 counter
const GSM7 = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n\r@£$¥èéùìòçØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&\'()*+,-./:;<=>?¡ÄÖÑÜàäöñü§¿')
function calcSms(text: string) {
  if (!text) return { len: 0, segs: 1, limit: 160 }
  const unicode = [...text].some(c => !GSM7.has(c))
  const limit = unicode ? 70 : 160
  const segLimit = unicode ? 67 : 153
  const len = text.length
  return { len, segs: len <= limit ? 1 : Math.ceil(len / segLimit), limit }
}

// ── Statut campagne ───────────────────────────────────────────

function StatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; bg: string; color: string }> = {
    draft:     { label: 'Brouillon',     bg: '#F3F4F6', color: '#6B7280' },
    queued:    { label: 'En file',       bg: '#FFF7ED', color: '#EA580C' },
    sending:   { label: 'Envoi en cours',bg: '#EFF6FF', color: '#2563EB' },
    sent:      { label: 'Envoyé',        bg: '#F0FDF4', color: '#16A34A' },
    failed:    { label: 'Échoué',        bg: '#FEF2F2', color: '#DC2626' },
    cancelled: { label: 'Annulé',        bg: '#F9FAFB', color: '#9CA3AF' },
    scheduled: { label: 'Programmé',     bg: '#F5F3FF', color: '#7C3AED' },
  }
  const s = map[status] ?? map.draft
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {status === 'sending' && <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />}
      {s.label}
    </span>
  )
}

function fmtNum(n: number) { return n.toLocaleString('fr-FR') }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) }
function deliveryRate(c: SmsCampaign) {
  if (!c.total_sent) return '—'
  return `${Math.round((c.total_delivered / c.total_sent) * 100)}%`
}

// ── Modal création campagne ────────────────────────────────────

interface NewCampaignModalProps {
  senderIds: SmsSenderId[]
  lists: SmsContactList[]
  templates: SmsTemplate[]
  onClose: () => void
  onCreated: (campaign: SmsCampaign, sendNow: boolean) => void
}

function NewCampaignModal({ senderIds, lists, templates, onClose, onCreated }: NewCampaignModalProps) {
  const [name, setName]           = useState('')
  const [senderId, setSenderId]   = useState('')
  const [listIds, setListIds]     = useState<number[]>([])
  const [message, setMessage]     = useState('')
  const [scheduledAt, setSchAt]   = useState('')
  const [useSchedule, setUseSch]  = useState(false)
  const [senderOpen, setSOpen]    = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [step, setStep]           = useState<'form' | 'confirm'>('form')
  const sms = useMemo(() => calcSms(message), [message])

  const totalRecipients = lists
    .filter(l => listIds.includes(l.id))
    .reduce((s, l) => s + l.contact_count, 0)

  function toggleList(id: number) {
    setListIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function applyTemplate(tpl: SmsTemplate) {
    setMessage(tpl.body)
  }

  function validate() {
    if (!name.trim())         { setError('Nom de campagne requis'); return false }
    if (listIds.length === 0) { setError('Sélectionnez au moins une liste'); return false }
    if (!message.trim())      { setError('Message requis'); return false }
    return true
  }

  async function handleSubmit(willSend: boolean) {
    if (!validate()) return
    setLoading(true); setError('')
    try {
      const payload = {
        name: name.trim(),
        message: message.trim(),
        senderId,
        listIds,
        ...(useSchedule && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
      }
      const campaign = await smsService.createCampaign(payload)

      if (willSend) {
        await smsService.sendCampaign(campaign.id)
        // Recharger pour avoir le statut mis à jour
        const updated = await smsService.getCampaign(campaign.id)
        onCreated(updated, true)
      } else {
        onCreated(campaign, false)
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Nouvelle Campagne SMS en Masse</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        {step === 'form' && (
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Nom */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Nom de la campagne *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex : Promo Vodacom Juillet"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
              />
            </div>

            {/* Sender ID */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                Sender ID <span className="font-normal text-gray-400">(optionnel)</span>
              </label>
              <div className="relative">
                <button onClick={() => setSOpen(o => !o)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] text-[#1F2937] hover:bg-gray-50">
                  <span className={senderId ? 'font-semibold' : 'italic text-gray-400'}>
                    {senderId || 'Sans Sender ID (AT défaut)'}
                  </span>
                  <ChevronDown size={13} className={`transition-transform ${senderOpen ? 'rotate-180' : ''}`} />
                </button>
                {senderOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-gray-100 bg-white shadow-lg">
                    <button onClick={() => { setSenderId(''); setSOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${senderId === '' ? 'font-bold text-[#F4511E]' : 'italic text-gray-500'}`}>
                      Sans Sender ID (AT défaut)
                    </button>
                    {senderIds.map(s => (
                      <button key={s.id} onClick={() => { setSenderId(s.sender_id); setSOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${s.sender_id === senderId ? 'font-bold text-[#F4511E]' : 'text-gray-700'}`}>
                        {s.sender_id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Listes */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">
                Listes de contacts * <span className="font-normal text-gray-400">(plusieurs possibles)</span>
              </label>
              {lists.length === 0 ? (
                <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[12px] text-[#DC2626]">
                  Aucune liste — créez-en une dans Gestion des listes
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {lists.map(l => {
                    const sel = listIds.includes(l.id)
                    return (
                      <button key={l.id} onClick={() => toggleList(l.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[12px] transition-colors ${sel ? 'border-[#F4511E] bg-orange-50 text-[#F4511E]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                        <List size={11} className="shrink-0" />
                        <div className="min-w-0">
                          <p className={`font-semibold truncate ${sel ? 'text-[#F4511E]' : ''}`}>{l.name}</p>
                          <p className="text-[10px] text-gray-400">{fmtNum(l.contact_count)} contacts</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {listIds.length > 0 && (
                <p className="mt-2 text-[11px] font-semibold text-[#16A34A]">
                  ~{fmtNum(totalRecipients)} destinataire(s) estimé(s)
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-gray-600">Message *</label>
                {templates.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Template :</span>
                    {templates.slice(0, 4).map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t)}
                        className="rounded-lg border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 hover:bg-orange-50 hover:border-[#F4511E] hover:text-[#F4511E] transition-colors">
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Votre message SMS..."
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>{sms.len} caractères</span>
                <span className={sms.segs > 1 ? 'text-orange-500 font-semibold' : ''}>{sms.segs} SMS / destinataire</span>
              </div>
            </div>

            {/* Programmation */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={useSchedule} onChange={e => setUseSch(e.target.checked)} className="rounded" />
                <span className="text-[11px] font-semibold text-gray-600">Programmer l'envoi à une date précise</span>
              </label>
              {useSchedule && (
                <input type="datetime-local" value={scheduledAt} onChange={e => setSchAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] text-[#1F2937] outline-none focus:ring-2 focus:ring-[#F4511E]/20"
                />
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-4 py-3 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {error}
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF7ED]">
              <Send size={22} className="text-[#F4511E]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#1F2937] mb-2">Confirmer l'envoi</h3>
            <p className="text-[13px] text-gray-500 mb-1">
              <span className="font-semibold text-[#1F2937]">{name}</span>
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              ~<span className="font-bold text-[#F4511E]">{fmtNum(totalRecipients)}</span> destinataires · {sms.segs} SMS/contact · Sender : <span className="font-bold">{senderId}</span>
            </p>
            <p className="text-[11px] text-gray-400 mb-4">L'envoi sera délégué à la file d'attente. Vous pourrez suivre la progression dans la liste.</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 shrink-0">
          {step === 'form' ? (
            <>
              <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleSubmit(false)} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                  Sauvegarder brouillon
                </button>
                <button onClick={() => { if (validate()) { setStep('confirm'); setSendNow(true) } }} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
                  <Play size={12} /> Envoyer maintenant
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep('form')} className="rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] text-gray-600 hover:bg-gray-50">
                Retour
              </button>
              <button onClick={() => handleSubmit(true)} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'Envoi en cours...' : 'Confirmer l\'envoi'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Onglet Campagnes ──────────────────────────────────────────

interface CampagnesTabProps {
  senderIds: SmsSenderId[]
  lists: SmsContactList[]
  templates: SmsTemplate[]
}

function CampagnesTab({ senderIds, lists, templates }: CampagnesTabProps) {
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [meta, setMeta]           = useState<PaginationMeta | null>(null)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [sending, setSending]     = useState<number | null>(null)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [showNew, setShowNew]     = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchCampaigns = useCallback(async (p: number, status: string) => {
    setLoading(true)
    try {
      const res = await smsService.getCampaigns({ page: p, limit: 15, status: status || undefined })
      setCampaigns(res.campaigns)
      setMeta(res.meta)
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns(page, statusFilter) }, [page, statusFilter, fetchCampaigns])

  async function handleSend(campaign: SmsCampaign) {
    if (!confirm(`Envoyer "${campaign.name}" à tous les contacts des listes liées ?`)) return
    setSending(campaign.id)
    try {
      await smsService.sendCampaign(campaign.id)
      showToast(`Campagne "${campaign.name}" mise en file d'envoi`)
      fetchCampaigns(page, statusFilter)
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Erreur lors de l\'envoi', false)
    } finally {
      setSending(null)
    }
  }

  async function handleDelete(campaign: SmsCampaign) {
    if (!confirm(`Supprimer la campagne "${campaign.name}" ?`)) return
    setDeleting(campaign.id)
    try {
      await smsService.deleteCampaign(campaign.id)
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id))
      showToast('Campagne supprimée')
    } catch {
      showToast('Erreur lors de la suppression', false)
    } finally {
      setDeleting(null)
    }
  }

  const canSend = (c: SmsCampaign) => c.status === 'draft' || c.status === 'scheduled'
  const canDelete = (c: SmsCampaign) => c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed'

  const STATUSES: { value: string; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'scheduled', label: 'Programmées' },
    { value: 'sending', label: 'En cours' },
    { value: 'sent', label: 'Envoyées' },
    { value: 'failed', label: 'Échouées' },
  ]

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold ${toast.ok ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
          {toast.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => { setStatus(s.value); setPage(1) }}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors ${statusFilter === s.value ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => fetchCampaigns(page, statusFilter)} className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
            <RefreshCw size={13} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
            <Plus size={13} /> Nouvelle campagne
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Send size={28} className="mb-3 text-gray-200" />
            <p className="text-[13px] font-semibold text-[#1F2937]">Aucune campagne</p>
            <p className="mt-1 text-[12px] text-gray-400">Créez votre première campagne SMS en masse</p>
            <button onClick={() => setShowNew(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Créer une campagne
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne', 'Sender ID', 'Statut', 'Destinataires', 'Envoyés', 'Livrés', 'Taux', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-[12px] font-semibold text-[#1F2937] truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{c.message.slice(0, 40)}{c.message.length > 40 ? '…' : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-bold text-[#EA580C]">{c.sender_id}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{fmtNum(c.total_recipients)}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{fmtNum(c.total_sent)}</td>
                    <td className="px-4 py-3 text-[12px] text-[#16A34A] font-semibold">{fmtNum(c.total_delivered)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[12px] font-bold ${c.total_sent > 0 ? 'text-[#16A34A]' : 'text-gray-400'}`}>
                        {deliveryRate(c)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                      {c.sent_at ? fmtDate(c.sent_at) : fmtDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canSend(c) && (
                          <button onClick={() => handleSend(c)} disabled={sending === c.id} title="Envoyer"
                            className="rounded-lg p-1.5 text-[#22C55E] hover:bg-green-50 disabled:opacity-40 transition-colors">
                            {sending === c.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                          </button>
                        )}
                        <button title="Voir détails"
                          className="rounded-lg p-1.5 text-[#3B82F6] hover:bg-blue-50 transition-colors">
                          <Eye size={13} />
                        </button>
                        {canDelete(c) && (
                          <button onClick={() => handleDelete(c)} disabled={deleting === c.id} title="Supprimer"
                            className="rounded-lg p-1.5 text-[#EF4444] hover:bg-red-50 disabled:opacity-40 transition-colors">
                            {deleting === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
            <span className="text-[11px] text-gray-400">Page {meta.page} / {meta.lastPage} — {fmtNum(meta.total)} campagne(s)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Précédent</button>
              <button onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <NewCampaignModal
          senderIds={senderIds}
          lists={lists}
          templates={templates}
          onClose={() => setShowNew(false)}
          onCreated={(campaign, wasSent) => {
            setShowNew(false)
            showToast(wasSent
              ? `Campagne "${campaign.name}" mise en file d'envoi`
              : `Campagne "${campaign.name}" sauvegardée en brouillon`)
            fetchCampaigns(page, statusFilter)
          }}
        />
      )}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────

const TABS = ['Campagnes', 'API & SMPP'] as const
type Tab = typeof TABS[number]

// Mock charts — seront remplacés par les analytics réels
const CHART_DATA = [
  { h: '08h', e: 0 }, { h: '10h', e: 0 }, { h: '12h', e: 0 },
  { h: '14h', e: 0 }, { h: '16h', e: 0 }, { h: '18h', e: 0 },
]
const OP_DATA = [
  { name: 'Vodacom', value: 1, color: '#2563EB' },
  { name: 'Airtel',  value: 1, color: '#EF4444' },
  { name: 'Orange',  value: 1, color: '#F97316' },
]

export default function SmsEnMassePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Campagnes')

  // Données partagées entre les tabs
  const [senderIds, setSenderIds] = useState<SmsSenderId[]>([])
  const [lists, setLists]         = useState<SmsContactList[]>([])
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [overview, setOverview]   = useState({ totalSent: 0, totalDelivered: 0, totalFailed: 0, deliveryRate: 0, activeCampaigns: 0 })
  const [loadingInit, setInit]    = useState(true)

  useEffect(() => {
    Promise.all([
      smsService.getSenderIds().catch(() => [] as SmsSenderId[]),
      smsService.getContactLists().catch(() => [] as SmsContactList[]),
      smsService.getTemplates().catch(() => [] as SmsTemplate[]),
      smsService.getAnalyticsOverview().catch(() => null),
    ]).then(([ids, ls, tpls, ov]) => {
      setSenderIds(ids.filter((s: SmsSenderId) => s.status === 'approved'))
      setLists(ls)
      setTemplates(tpls)
      if (ov) setOverview(ov as typeof overview)
    }).finally(() => setInit(false))
  }, [])

  const kpiCards = [
    { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés', value: fmtNum(overview.totalSent) },
    { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Délivrés',          value: fmtNum(overview.totalDelivered) },
    { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Échecs',             value: fmtNum(overview.totalFailed) },
    { icon: TrendingUp,   bg: '#FFF7ED', color: '#F97316', label: 'Taux de Livraison',  value: `${overview.deliveryRate}%` },
  ]

  if (loadingInit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#F4511E]" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1F2937]">SMS Bulk Marketing</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Créez et gérez vos campagnes SMS en masse</p>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpiCards.map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Infos listes / sender IDs */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Users, bg: '#F5F3FF', color: '#7C3AED', label: 'Listes disponibles',   value: lists.length },
            { icon: List,  bg: '#FFF7ED', color: '#EA580C', label: 'Sender IDs approuvés', value: senderIds.length },
            { icon: Send,  bg: '#F0FDF4', color: '#16A34A', label: 'Total contacts',        value: fmtNum(lists.reduce((s, l) => s + l.contact_count, 0)) },
            { icon: CheckCircle2, bg: '#EFF6FF', color: '#2563EB', label: 'Templates',      value: templates.length },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts — placeholder jusqu'aux analytics réels */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Volume d'Envois SMS</h3>
            <p className="mb-4 text-[11px] text-gray-400">Les données apparaîtront après vos premières campagnes</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={CHART_DATA} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="h" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="e" stroke="#F4511E" strokeWidth={2} dot={false} name="Envois" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Par Opérateur</h3>
            <p className="mb-3 text-[11px] text-gray-400">Répartition après activation DLR</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={140}>
                <PieChart>
                  <Pie data={OP_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" stroke="none">
                    {OP_DATA.map((e, i) => <Cell key={i} fill={e.color} opacity={0.4} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {OP_DATA.map(({ name, color }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-gray-500">{name}</span>
                    <span className="ml-auto text-[11px] text-gray-400">—</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-0 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13px] font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Campagnes' && (
          <CampagnesTab senderIds={senderIds} lists={lists} templates={templates} />
        )}

        {activeTab === 'API & SMPP' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#FFE8D9] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4511E]/20">
                  <Zap size={20} className="text-[#F4511E]" />
                </div>
                <span className="text-[15px] font-bold text-[#1F2937]">API REST</span>
              </div>
              <p className="mb-5 text-[12px] text-gray-600">Intégrez nos API pour envoyer des SMS depuis vos applications</p>
              <button className="w-full rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f]">
                Documentation API
              </button>
            </div>
            <div className="rounded-2xl bg-[#FFE8D9] p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4511E]/20">
                  <Settings2 size={20} className="text-[#F4511E]" />
                </div>
                <span className="text-[15px] font-bold text-[#1F2937]">Connexion SMPP</span>
              </div>
              <p className="mb-5 text-[12px] text-gray-600">Configuration directe avec les opérateurs télécom</p>
              <button className="w-full rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f]">
                Configurer SMPP
              </button>
            </div>
          </div>
        )}

      </div>
      <DashboardFooter />
    </div>
  )
}
