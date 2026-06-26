import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Clock, Info, ChevronDown, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsSenderId, SmsMessage } from '../../../types/sms.types'
import { motion } from 'framer-motion'

// GSM-7 charset
const GSM7 = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \n\r' +
  '@£$¥èéùìòçØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&\'()*+,-./:;<=>?¡ÄÖÑÜàäöñü§¿'
)

function calcSms(text: string) {
  if (!text) return { len: 0, segs: 1, limit: 160, unicode: false, encoding: 'GSM-7 (160 car/SMS)' }
  const unicode = [...text].some(c => !GSM7.has(c))
  const smsLimit = unicode ? 70 : 160
  const segLimit = unicode ? 67 : 153
  const len = text.length
  const segs = len <= smsLimit ? 1 : Math.ceil(len / segLimit)
  return { len, segs, limit: smsLimit, unicode, encoding: unicode ? 'Unicode (70 car/SMS)' : 'GSM-7 (160 car/SMS)' }
}

interface PhoneMockupProps {
  message: string
  senderId: string
}

function PhoneMockup({ message, senderId }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto w-[210px]">
      <div className="relative rounded-[32px] border-[8px] border-[#1F2937] bg-white shadow-2xl overflow-hidden">
        <div className="absolute left-1/2 top-0 z-10 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-[#1F2937]" />

        <div className="flex items-center justify-between bg-white px-4 pt-5 pb-1">
          <span className="text-[9px] font-semibold text-gray-800">13:06</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-px items-end">
              {[3, 4, 5, 6, 7].map((h, i) => (
                <div key={i} className="w-[2px] rounded-sm bg-gray-700" style={{ height: `${h}px` }} />
              ))}
            </div>
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <path d="M5.5 1.5C3.8 1.5 2.3 2.2 1.2 3.4L0 2.2C1.4 0.8 3.3 0 5.5 0s4.1.8 5.5 2.2L9.8 3.4C8.7 2.2 7.2 1.5 5.5 1.5z" fill="#374151"/>
              <path d="M5.5 4C4.3 4 3.2 4.5 2.5 5.3L1.3 4.1C2.4 2.9 3.9 2.2 5.5 2.2s3.1.7 4.2 1.9L8.5 5.3C7.8 4.5 6.7 4 5.5 4z" fill="#374151"/>
              <circle cx="5.5" cy="7" r="1" fill="#374151"/>
            </svg>
            <div className="flex items-center gap-px">
              <div className="h-3 w-4.5 rounded-sm border border-gray-700 p-px">
                <div className="h-full w-3/4 rounded-sm bg-gray-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#1976D2] px-3 py-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold text-white">
            {senderId.charAt(0)}
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">{senderId || '—'}</p>
            <p className="text-[9px] text-white/70 mt-px">SMS · Maintenant</p>
          </div>
        </div>

        <div className="min-h-[120px] bg-[#F5F5F5] px-3 py-3">
          {message ? (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#DCF8C6] px-3 py-2 shadow-sm">
                <p className="text-[10px] text-gray-800 leading-relaxed break-words">{message}</p>
                <p className="mt-1 text-right text-[8px] text-gray-400">13:06</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full pt-8">
              <p className="text-[10px] text-gray-400 italic">Votre message apparaîtra ici...</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-2">
          <div className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-[9px] text-gray-400">
            Répondre...
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Statut badge ──────────────────────────────────────────────

const STATUS_MSG: Record<string, { label: string; bg: string; color: string }> = {
  queued:      { label: 'En file',  bg: '#EFF6FF', color: '#2563EB' },
  sent:        { label: 'Envoyé',   bg: '#F0FDF4', color: '#16A34A' },
  delivered:   { label: 'Livré',    bg: '#F0FDF4', color: '#15803D' },
  failed:      { label: 'Échoué',   bg: '#FEF2F2', color: '#DC2626' },
  undelivered: { label: 'Non livré',bg: '#FFF7ED', color: '#EA580C' },
}

type SendResult = 'sent' | 'failed' | null

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsUniquePage() {
  const navigate = useNavigate()
  const [phone, setPhone]           = useState('')
  const [senderId, setSenderId]     = useState('')
  const [message, setMessage]       = useState('')
  const [senderOpen, setSenderOpen] = useState(false)
  const [sending, setSending]       = useState(false)
  const [sendResult, setSendResult] = useState<SendResult>(null)
  const [sendError, setSendErr]     = useState('')

  const [senderIds, setSenderIds]   = useState<SmsSenderId[]>([])
  const [loadingIds, setLoadingIds] = useState(true)

  const [history, setHistory]       = useState<SmsMessage[]>([])
  const [loadingHist, setLoadHist]  = useState(true)
  const [histPage, setHistPage]     = useState(1)
  const [histTotal, setHistTotal]   = useState(0)
  const HIST_LIMIT = 10

  const fetchHistory = useCallback(async (p: number) => {
    setLoadHist(true)
    try {
      const res = await smsService.getMessages({ singleOnly: true, page: p, limit: HIST_LIMIT })
      setHistory(res.messages)
      setHistTotal(res.meta.total)
    } catch {
      setHistory([])
    } finally {
      setLoadHist(false)
    }
  }, [])

  useEffect(() => {
    smsService.getSenderIds()
      .then(ids => setSenderIds(ids.filter(s => s.status === 'approved')))
      .catch(() => setSenderIds([]))
      .finally(() => setLoadingIds(false))
    fetchHistory(1)
  }, [fetchHistory])

  const sms = useMemo(() => calcSms(message), [message])

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) return
    setSending(true)
    setSendResult(null)
    setSendErr('')
    try {
      const result = await smsService.sendSingle({
        phone: phone.trim(),
        message,
        ...(senderId ? { senderId } : {}),
      })
      setSendResult(result.status === 'sent' ? 'sent' : 'failed')
      if (result.status === 'sent') {
        setMessage('')
        setPhone('')
        fetchHistory(1)
        setHistPage(1)
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Erreur lors de l'envoi"
      setSendErr(msg)
      setSendResult('failed')
    } finally {
      setSending(false)
    }
  }

  const canSend = phone.trim().length >= 7 && message.trim().length > 0 && !sending

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1F2937]">SMS Simple (Single)</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Envoyer un SMS à un seul destinataire</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">

          {/* ── Left column ── */}
          <div className="flex-1 space-y-5">

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-[15px] font-bold text-[#1F2937]">Composer votre SMS</h2>

              {/* Phone number */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-xl border-0 bg-[#FFEEE6] px-4 py-3 text-[13px] text-[#1F2937] placeholder-orange-300 outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
                />
              </div>

              {/* Sender ID */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                  Sender ID
                </label>
                {loadingIds ? (
                  <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-[12px] text-gray-400">
                    <Loader2 size={13} className="animate-spin" />
                    Chargement des sender IDs...
                  </div>
                ) : senderIds.length === 0 ? (
                  <div className="rounded-xl bg-[#FFF7ED] px-4 py-3 text-[12px] text-[#92400E]">
                    Aucun Sender ID approuvé — l'envoi utilisera l'expéditeur Infobip par défaut.{' '}
                    <span className="text-[11px] text-gray-500">Ajoutez un Sender ID dans Identifiants pour personnaliser.</span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setSenderOpen(o => !o)}
                      className="flex w-full items-center justify-between rounded-xl bg-[#F4511E] px-4 py-3 text-[13px] font-semibold text-white"
                    >
                      <span>{senderId || 'Sans Sender ID (expéditeur par défaut)'}</span>
                      <ChevronDown size={15} className={`transition-transform ${senderOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {senderOpen && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                        <button
                          onClick={() => { setSenderId(''); setSenderOpen(false) }}
                          className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${
                            senderId === '' ? 'font-semibold text-[#F4511E]' : 'text-gray-500 italic'
                          }`}
                        >
                          Sans Sender ID (expéditeur par défaut)
                        </button>
                        {senderIds.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setSenderId(s.sender_id); setSenderOpen(false) }}
                            className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${
                              s.sender_id === senderId ? 'font-semibold text-[#F4511E]' : 'text-gray-700'
                            }`}
                          >
                            {s.sender_id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border-0 bg-[#FFEEE6] px-4 py-3 text-[13px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">{sms.len} caractères</span>
                  <span className={`font-semibold ${sms.segs > 1 ? 'text-orange-500' : 'text-gray-700'}`}>
                    {sms.segs} SMS
                  </span>
                </div>
              </div>

              {/* Résultat envoi */}
              {sendResult === 'sent' && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-3">
                  <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                  <p className="text-[12px] font-semibold text-[#15803D]">SMS envoyé avec succès !</p>
                </div>
              )}
              {sendResult === 'failed' && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-[#FEF2F2] px-4 py-3">
                  <AlertCircle size={16} className="text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#DC2626]">Échec de l'envoi</p>
                    {sendError && <p className="mt-0.5 text-[11px] text-red-500">{sendError}</p>}
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold text-white
                    transition-all duration-150 active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${sending
                      ? 'bg-[#d9400f] cursor-wait'
                      : 'bg-[#F4511E] hover:bg-[#d9400f] shadow-md hover:shadow-lg active:shadow-sm'
                    }`}
                >
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Envoi en cours…</span>
                      <span className="absolute right-4 flex gap-0.5">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="h-1 w-1 rounded-full bg-white/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Envoyer maintenant</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/app/sms/programmes')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
                  <Clock size={15} />
                  Programmer
                </button>
              </div>
            </div>

            {/* Stats d'envoi */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-[14px] font-bold text-[#1F2937]">Statistiques d'envoi</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <span className="text-[12px] text-gray-500">Sender ID actif</span>
                  <span className="text-[13px] font-bold text-[#1F2937]">{senderId || '—'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <span className="text-[12px] text-gray-500">Segments SMS</span>
                  <span className={`text-[13px] font-bold ${sms.segs > 1 ? 'text-orange-500' : 'text-[#1F2937]'}`}>
                    {sms.segs} SMS
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">Durée d'envoi</span>
                  <span className="text-[13px] font-bold text-[#1F2937]">Instantané</span>
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div className="rounded-2xl bg-[#EFF6FF] p-5">
              <div className="mb-3 flex items-center gap-2">
                <Info size={15} className="text-[#3B82F6]" />
                <span className="text-[13px] font-bold text-[#1E40AF]">Conseils</span>
              </div>
              <ul className="space-y-1.5">
                {[
                  '160 caractères = 1 SMS (GSM-7)',
                  'Évitez les émojis (passe en Unicode = 70 car/SMS)',
                  'Vérifiez le numéro avec indicatif pays (+243, +237...)',
                ].map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-[12px] text-[#1D4ED8]">
                    <span className="mt-0.5 shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* ── Right column — Preview ── */}
          <div className="w-full lg:w-[340px] xl:w-[380px]">
            <div className="sticky top-6">

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-[#1F2937]">Aperçu du SMS</h2>
                <span className="text-[12px] font-semibold text-gray-500">
                  {sms.len} / {sms.limit} caractères
                </span>
              </div>

              <PhoneMockup message={message} senderId={senderId} />

              <div className="mt-5 space-y-3 rounded-2xl border border-gray-100 p-4">
                {[
                  { label: 'Expéditeur',    value: senderId || '—',   color: '' },
                  { label: 'Caractères',    value: `${sms.len} / ${sms.limit}`, color: '' },
                  {
                    label: 'Segments SMS',
                    value: `${sms.segs} SMS`,
                    color: sms.segs > 1 ? '#F97316' : '#22C55E',
                  },
                  { label: 'Encodage', value: sms.encoding, color: '' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                    <span className="text-[11px] text-gray-500">{label}</span>
                    <span className="text-[12px] font-bold" style={{ color: color || '#1F2937' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
        {/* ── Historique SMS uniques ── */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Historique des envois</h2>
            <button onClick={() => { setHistPage(1); fetchHistory(1) }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-50">
              <RefreshCw size={11} /> Actualiser
            </button>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {loadingHist ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-gray-300" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-[12px] text-gray-400">
                Aucun SMS envoyé pour l'instant
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/60">
                      {['Destinataire', 'Sender ID', 'Message', 'Statut', 'Date'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(m => {
                      const st = STATUS_MSG[m.status] ?? STATUS_MSG.sent
                      return (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937] whitespace-nowrap">
                            +{m.phone}
                          </td>
                          <td className="px-4 py-3">
                            {m.sender_id
                              ? <span className="rounded-full bg-[#FFEEE6] px-2.5 py-0.5 text-[10px] font-bold text-[#F4511E]">{m.sender_id}</span>
                              : <span className="text-[11px] text-gray-400">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 max-w-[260px]">
                            <p className="text-[11px] text-gray-600 truncate">{m.body}</p>
                            <p className="text-[10px] text-gray-400">{m.segments} segment{m.segments > 1 ? 's' : ''}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: st.bg, color: st.color }}>
                              {m.status === 'delivered'
                                ? '✓✓ ' + st.label
                                : st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">
                            {new Date(m.created_at).toLocaleString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination historique */}
            {histTotal > HIST_LIMIT && (
              <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
                <span className="text-[11px] text-gray-400">{histTotal} envoi(s) au total</span>
                <div className="flex gap-1">
                  <button onClick={() => { setHistPage(p => p - 1); fetchHistory(histPage - 1) }}
                    disabled={histPage === 1}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    Précédent
                  </button>
                  <span className="px-2 py-1 text-[11px] text-gray-500">Page {histPage}</span>
                  <button onClick={() => { setHistPage(p => p + 1); fetchHistory(histPage + 1) }}
                    disabled={histPage * HIST_LIMIT >= histTotal}
                    className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
