import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Send, CheckCircle2, XCircle, TrendingUp, Plus, ChevronDown,
  Zap, Settings2, Loader2, Trash2, Play, Eye, X, Clock,
  AlertCircle, RefreshCw, Users, List, Pencil,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import api from '../../../services/api'
import type { SmsCampaign, SmsSenderId, SmsContactList, SmsTemplate, CampaignStatus, CampaignType, UpdateCampaignPayload } from '../../../types/sms.types'
import type { PaginationMeta } from '../../../services/sms.service'
import { motion } from 'framer-motion'

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
  initialMessage?: string
  templates: SmsTemplate[]
  editCampaign?: SmsCampaign
  onClose: () => void
  onCreated: (campaign: SmsCampaign, sendNow: boolean) => void
}

const CAMPAIGN_TYPES: { value: CampaignType; label: string; desc: string; color: string; bg: string }[] = [
  { value: 'promotional',   label: 'Promotionnel',    desc: 'Offres, promos, marketing',   color: '#2563EB', bg: '#EFF6FF' },
  { value: 'transactional', label: 'Transactionnel',  desc: 'Confirmations, reçus, alertes', color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'otp',           label: 'OTP',             desc: 'Codes de vérification',        color: '#16A34A', bg: '#F0FDF4' },
  { value: 'notification',  label: 'Notification',    desc: 'Rappels, infos, événements',   color: '#EA580C', bg: '#FFF7ED' },
]

function NewCampaignModal({ senderIds, lists, templates, initialMessage = '', editCampaign, onClose, onCreated }: NewCampaignModalProps) {
  const isEdit = Boolean(editCampaign)
  const [name, setName]               = useState(editCampaign?.name ?? '')
  const [campaignType, setCampType]   = useState(editCampaign?.campaign_type ?? 'promotional')
  const [senderId, setSenderId]       = useState(editCampaign?.sender_id ?? '')
  const [listIds, setListIds]         = useState<number[]>([])
  const [message, setMessage]         = useState(editCampaign?.message ?? initialMessage)
  const initSched = editCampaign?.scheduled_at
    ? new Date(editCampaign.scheduled_at).toISOString().slice(0, 16)
    : ''
  const [scheduledAt, setSchAt]       = useState(initSched)
  const [useSchedule, setUseSch]      = useState(Boolean(editCampaign?.scheduled_at))
  const [senderOpen, setSOpen]        = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [step, setStep]               = useState<'form' | 'confirm'>('form')
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
    if (!name.trim())                           { setError('Nom de campagne requis'); return false }
    if (!isEdit && listIds.length === 0)        { setError('Sélectionnez au moins une liste'); return false }
    if (!message.trim())                        { setError('Message requis'); return false }
    return true
  }

  async function handleSubmit(willSend: boolean) {
    if (!validate()) return
    setLoading(true); setError('')
    try {
      let campaign: SmsCampaign
      if (isEdit && editCampaign) {
        const upd: UpdateCampaignPayload = {
          name: name.trim(),
          message: message.trim(),
          senderId,
          ...(listIds.length > 0 ? { listIds } : {}),
          scheduledAt: useSchedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }
        campaign = await smsService.updateCampaign(editCampaign.id, upd)
        onCreated(campaign, false)
      } else {
        const payload = {
          name: name.trim(),
          message: message.trim(),
          senderId,
          listIds,
          campaignType,
          ...(useSchedule && scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        }
        campaign = await smsService.createCampaign(payload)
        if (willSend) {
          await smsService.sendCampaign(campaign.id)
          const updated = await smsService.getCampaign(campaign.id)
          onCreated(updated, true)
        } else {
          onCreated(campaign, false)
        }
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message
      setError(msg ?? (isEdit ? 'Erreur lors de la modification' : 'Erreur lors de la création'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2 className="text-[15px] font-bold text-[#1F2937]">{isEdit ? 'Modifier la campagne' : 'Nouvelle Campagne SMS en Masse'}</h2>
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

            {/* Type de campagne */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Type de campagne *</label>
              <div className="grid grid-cols-2 gap-2">
                {CAMPAIGN_TYPES.map(t => {
                  const selected = campaignType === t.value
                  return (
                    <button key={t.value} type="button" onClick={() => setCampType(t.value)}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected ? 'border-[#F4511E] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected ? '#F4511E' : t.color, opacity: selected ? 1 : 0.5 }} />
                      <div>
                        <p className={`text-[11px] font-bold ${selected ? 'text-[#F4511E]' : 'text-[#1F2937]'}`}>{t.label}</p>
                        <p className="text-[10px] text-gray-400">{t.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
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
                    {senderId || 'Sans Sender ID (expéditeur par défaut)'}
                  </span>
                  <ChevronDown size={13} className={`transition-transform ${senderOpen ? 'rotate-180' : ''}`} />
                </button>
                {senderOpen && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-gray-100 bg-white shadow-lg">
                    <button onClick={() => { setSenderId(''); setSOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${senderId === '' ? 'font-bold text-[#F4511E]' : 'italic text-gray-500'}`}>
                      Sans Sender ID (expéditeur par défaut)
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
            <p className="text-[13px] text-gray-500 mb-1">
              ~<span className="font-bold text-[#F4511E]">{fmtNum(totalRecipients)}</span> destinataires · {sms.segs} SMS/contact
            </p>
            <p className="text-[13px] text-gray-500 mb-6">
              Type : <span className="font-bold text-[#1F2937]">{CAMPAIGN_TYPES.find(t => t.value === campaignType)?.label}</span>
              {senderId && <> · Sender : <span className="font-bold">{senderId}</span></>}
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
              {isEdit ? (
                <button onClick={() => handleSubmit(false)} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
                  Enregistrer les modifications
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleSubmit(false)} disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                    Sauvegarder brouillon
                  </button>
                  <button onClick={() => { if (validate()) setStep('confirm') }} disabled={loading}
                    className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-60">
                    <Play size={12} /> Envoyer maintenant
                  </button>
                </div>
              )}
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

// ── Modal : Détail campagne ───────────────────────────────────

interface CampaignDetailModalProps { campaign: SmsCampaign; onClose: () => void }

function CampaignDetailModal({ campaign: c, onClose }: CampaignDetailModalProps) {
  const delivPct = c.total_sent > 0
    ? Math.round((c.total_delivered / c.total_sent) * 1000) / 10
    : 0
  const failPct = c.total_sent > 0
    ? Math.round((c.total_failed / c.total_sent) * 1000) / 10
    : 0

  const rows = [
    { label: 'Destinataires',  value: fmtNum(c.total_recipients) },
    { label: 'Envoyés (Infobip)', value: fmtNum(c.total_sent) },
    { label: 'Délivrés (DLR)', value: `${fmtNum(c.total_delivered)} — ${delivPct}%` },
    { label: 'Échoués',        value: `${fmtNum(c.total_failed)} — ${failPct}%` },
    { label: 'Non livrés',     value: fmtNum(c.total_undelivered) },
    { label: 'Sender ID',      value: c.sender_id || '—' },
    { label: 'Statut',         value: c.status },
    { label: 'Créée le',       value: fmtDate(c.created_at) },
    { label: 'Envoyée le',     value: c.sent_at ? fmtDate(c.sent_at) : '—' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#1F2937] truncate max-w-[340px]">{c.name}</h2>
            <p className="mt-0.5 text-[11px] text-gray-400">Détails de la campagne #{c.id}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>

        {/* Stats visuelles */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: 'Envoyés',  value: fmtNum(c.total_sent),      color: '#3B82F6' },
            { label: 'Délivrés', value: fmtNum(c.total_delivered), color: '#22C55E' },
            { label: 'Échoués',  value: fmtNum(c.total_failed),    color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-[18px] font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress délivrabilité */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-gray-600">Taux de délivrance</span>
            <span className="text-[11px] font-bold text-[#22C55E]">{delivPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#22C55E] transition-all" style={{ width: `${delivPct}%` }} />
          </div>
        </div>

        {/* Tableau infos */}
        <div className="px-6 py-4 space-y-2">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500">{label}</span>
              <span className="text-[12px] font-semibold text-[#1F2937] max-w-[55%] text-right truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="mx-6 mb-4 rounded-xl bg-gray-50 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Message</p>
          <p className="text-[12px] text-[#1F2937] whitespace-pre-wrap leading-relaxed">{c.message}</p>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
            Fermer
          </button>
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
  initialMessage?: string
  openNewRequest?: number
}

function CampagnesTab({ senderIds, lists, templates, initialMessage = '', openNewRequest = 0 }: CampagnesTabProps) {
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [meta, setMeta]           = useState<PaginationMeta | null>(null)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [sending, setSending]     = useState<number | null>(null)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [showNew, setShowNew]     = useState(initialMessage !== '')
  const [editCamp, setEditCamp]   = useState<SmsCampaign | null>(null)
  const [viewCampaign, setView]   = useState<SmsCampaign | null>(null)
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

  // Bouton "Nouvelle Campagne" du header de page
  useEffect(() => {
    if (openNewRequest > 0) setShowNew(true)
  }, [openNewRequest])

  // Polling auto quand au moins une campagne est en cours d'envoi
  useEffect(() => {
    const hasSending = campaigns.some(c => c.status === 'sending' || c.status === 'queued')
    if (!hasSending) return
    const t = setInterval(() => fetchCampaigns(page, statusFilter), 15_000)
    return () => clearInterval(t)
  }, [campaigns, page, statusFilter, fetchCampaigns])

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

  const canSend   = (c: SmsCampaign) => c.status === 'draft' || c.status === 'scheduled'
  const canEdit   = (c: SmsCampaign) => c.status === 'draft' || c.status === 'scheduled'
  const canDelete = (c: SmsCampaign) => c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed'

  const STATUSES: { value: string; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'scheduled', label: 'Programmées' },
    { value: 'sending', label: 'En cours' },
    { value: 'sent', label: 'Envoyées' },
    { value: 'failed',    label: 'Échouées' },
    { value: 'cancelled', label: 'Annulées' },
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
                        {canEdit(c) && (
                          <button onClick={() => setEditCamp(c)} title="Modifier"
                            className="rounded-lg p-1.5 text-[#7C3AED] hover:bg-purple-50 transition-colors">
                            <Pencil size={13} />
                          </button>
                        )}
                        <button title="Voir détails" onClick={() => setView(c)}
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
          initialMessage={initialMessage}
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

      {editCamp && (
        <NewCampaignModal
          senderIds={senderIds}
          lists={lists}
          templates={templates}
          editCampaign={editCamp}
          onClose={() => setEditCamp(null)}
          onCreated={(campaign) => {
            setEditCamp(null)
            showToast(`Campagne "${campaign.name}" mise à jour`)
            fetchCampaigns(page, statusFilter)
          }}
        />
      )}

      {viewCampaign && (
        <CampaignDetailModal campaign={viewCampaign} onClose={() => setView(null)} />
      )}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────

const TABS = ['Campagnes', 'Contacts', 'Templates', 'API & SMPP'] as const
type Tab = typeof TABS[number]

const PERIODS = ['Derniers 7 jours', 'Derniers 30 jours', 'Derniers 90 jours'] as const

// Répartition opérateur : en attente des DLR Infobip (webhook notifyUrl — ticket IB#4492484)
const OPERATORS = [
  { name: 'Vodacom',  color: '#EF4444' },
  { name: 'Airtel',   color: '#F59E0B' },
  { name: 'Orange',   color: '#F97316' },
  { name: 'Africell', color: '#3B82F6' },
]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
}

export default function SmsEnMassePage() {
  const location = useLocation()
  const templateFromNav = (location.state as { templateBody?: string } | null)?.templateBody ?? ''

  const [activeTab, setActiveTab] = useState<Tab>('Campagnes')
  const [period, setPeriod]       = useState<typeof PERIODS[number]>('Derniers 7 jours')
  const [periodOpen, setPerOpen]  = useState(false)

  // Données partagées entre les tabs
  const [senderIds, setSenderIds] = useState<SmsSenderId[]>([])
  const [lists, setLists]         = useState<SmsContactList[]>([])
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [overview, setOverview]   = useState({ totalSent: 0, totalDelivered: 0, totalFailed: 0, deliveryRate: 0, activeCampaigns: 0 })
  const [loadingInit, setInit]    = useState(true)
  // Ouvre la modale automatiquement si on vient de "Utiliser" un template
  const [tplBody, setTplBody]     = useState(templateFromNav)
  // Incrémenté par le bouton "Nouvelle Campagne" du header
  const [newRequest, setNewReq]   = useState(0)
  // Volume horaire réel (endpoint analytics/rapports)
  const [byHour, setByHour]       = useState<{ hour: string; count: number }[]>([])
  // Taux de clic réel (liens courts — endpoint analytics/kpis)
  const [clickRate, setClickRate] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      smsService.getSenderIds().catch(() => [] as SmsSenderId[]),
      smsService.getContactLists().catch(() => [] as SmsContactList[]),
      smsService.getTemplates().catch(() => [] as SmsTemplate[]),
      smsService.getAnalyticsOverview().catch(() => null),
      api.get<{ data: { byHour: { hour: string; count: number }[] } }>('/sms/analytics/rapports?period=7j').catch(() => null),
      api.get<{ data: { clickRate?: number } }>('/sms/analytics/kpis').catch(() => null),
    ]).then(([ids, ls, tpls, ov, rap, kpis]) => {
      setSenderIds(ids.filter((s: SmsSenderId) => s.status === 'approved'))
      setLists(ls)
      setTemplates(tpls)
      if (ov) setOverview(ov as typeof overview)
      if (rap) setByHour(rap.data.byHour)
      if (kpis?.data.clickRate != null) setClickRate(kpis.data.clickRate)
    }).finally(() => setInit(false))
  }, [])

  const failRate = overview.totalSent > 0
    ? Math.round((overview.totalFailed / overview.totalSent) * 1000) / 10
    : 0

  const kpiCards = [
    { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés', value: fmtNum(overview.totalSent),      sub: '',                          subColor: '#16A34A' },
    { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Délivrés',          value: fmtNum(overview.totalDelivered), sub: `${overview.deliveryRate}%`, subColor: '#16A34A' },
    { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Échecs',             value: fmtNum(overview.totalFailed),    sub: `${failRate}%`,              subColor: '#DC2626' },
    { icon: TrendingUp,   bg: '#F5F3FF', color: '#8B5CF6', label: 'Taux de Clic',       value: clickRate !== null ? `${clickRate}%` : '—', sub: '',             subColor: '#16A34A' },
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
      <motion.div className="px-6 py-5" variants={stagger} initial="initial" animate="animate">

        {/* Header */}
        <motion.div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" variants={fadeUp}>
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">SMS Bulk Marketing</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gérez vos campagnes SMS en masse avec SMPP & API</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button onClick={() => setPerOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                <Clock size={13} /> {period}
                <ChevronDown size={12} className={`transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {PERIODS.map(p => (
                    <button key={p} onClick={() => { setPeriod(p); setPerOpen(false) }}
                      className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${p === period ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setActiveTab('Campagnes'); setNewReq(n => n + 1) }}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f]">
              <Send size={14} /> Nouvelle Campagne
            </button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4" variants={stagger}>
          {kpiCards.map(({ icon: Icon, bg, color, label, value, sub, subColor }) => (
            <motion.div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" variants={fadeUp}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] text-gray-500">{label}</p>
                  <p className="mt-1 text-[22px] font-bold text-[#1F2937]">{value}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold" style={{ color: subColor }}>
                {sub && <TrendingUp size={11} />}{sub}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts — placeholder jusqu'aux analytics réels */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Volume d'Envois SMS</h3>
            <p className="mb-4 text-[11px] text-gray-400">Distribution horaire des envois (aujourd'hui)</p>
            {byHour.some(h => h.count > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={byHour} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={3} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} name="Envois" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[160px] items-center justify-center rounded-xl bg-gray-50 text-[12px] text-gray-400">
                Aucun envoi aujourd'hui
              </div>
            )}
            <div className="mt-2 flex justify-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-[10px] font-semibold text-[#3B82F6]">Envois</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Par Opérateur</h3>
            <p className="mb-3 text-[11px] text-gray-400">Répartition des envois</p>
            <div className="flex h-[160px] flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 px-4 text-center">
              <div className="flex items-center gap-4">
                {OPERATORS.map(op => (
                  <div key={op.name} className="flex flex-col items-center gap-1">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: op.color }} />
                    <span className="text-[9px] text-gray-500">{op.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-semibold text-gray-400">En attente des DLR Infobip</p>
              <p className="text-[10px] text-gray-400 max-w-[240px]">
                La répartition par opérateur sera disponible dès réception des accusés de livraison (webhook notifyUrl)
              </p>
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
          <CampagnesTab senderIds={senderIds} lists={lists} templates={templates}
            initialMessage={tplBody} openNewRequest={newRequest} />
        )}

        {activeTab === 'Contacts' && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
              <h3 className="text-[14px] font-bold text-[#1F2937]">Listes de contacts</h3>
              <RouterLink to="/app/sms/contacts"
                className="flex items-center gap-1.5 rounded-xl border border-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-[#F4511E] hover:bg-orange-50">
                <Users size={12} /> Gérer les contacts
              </RouterLink>
            </div>
            {lists.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-gray-400">
                Aucune liste — créez-en une dans Gestion des Listes
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Liste', 'Contacts', 'Créée le'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lists.map(l => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <List size={13} className="text-[#F4511E]" />
                          <span className="text-[12px] font-semibold text-[#1F2937]">{l.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-600">{fmtNum(l.contact_count)}</td>
                      <td className="px-4 py-3 text-[11px] text-gray-400">{fmtDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'Templates' && (
          templates.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white py-12 text-center text-[12px] text-gray-400 shadow-sm">
              Aucun template — créez-en un dans Modèles SMS
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {templates.map(t => (
                <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="mb-2 text-[14px] font-bold text-[#1F2937]">{t.name}</h3>
                  <div className="mb-4 rounded-xl bg-[#FFD9C7] px-4 py-3 text-[12px] text-gray-700 leading-relaxed">
                    {t.body}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setTplBody(t.body); setActiveTab('Campagnes'); setNewReq(n => n + 1) }}
                      className="rounded-xl bg-[#F4511E] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                      Utiliser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
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

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
