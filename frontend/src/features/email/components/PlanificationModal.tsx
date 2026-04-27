import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Calendar, Send, Users, Mail, Clock, Code2, Loader2, AlertCircle } from 'lucide-react'
import type { EmailBlock } from '../pages/EditeurEmailPage'
import type { ContactGroup } from './ContactGestionModal'
import apiFetch from '../../../services/api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  nomCampagne?: string
  category?: string
  sujet?: string
  preheader?: string
  expediteur?: string
  blocs?: EmailBlock[]
  groupesSelectionnes?: ContactGroup[]
}

interface SendResult {
  campaignId: number
  totalRecipients: number
  queued: boolean
  scheduledAt: string | null
}

type Mode = 'immediat' | 'differe'

export default function PlanificationModal({ open, onClose, onSuccess, nomCampagne, category = 'Marketing', sujet, preheader, expediteur, blocs = [], groupesSelectionnes = [] }: Props) {
  const [mode, setMode]           = useState<Mode>('immediat')
  const [date, setDate]           = useState('')
  const [heure, setHeure]         = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [apiError, setApiError]   = useState('')
  const [result, setResult]       = useState<SendResult | null>(null)
  const [errors, setErrors]       = useState<{ date?: string; heure?: string }>({})

  const today = new Date().toISOString().split('T')[0]

  const validate = () => {
    if (mode === 'immediat') return true
    const errs: { date?: string; heure?: string } = {}
    if (!date) errs.date = 'Choisissez une date'
    if (!heure) errs.heure = 'Choisissez une heure'
    if (date && date < today) errs.date = 'La date doit être dans le futur'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleConfirm = async () => {
    if (!validate()) return

    setLoading(true)
    setApiError('')

    const payload = {
      nomCampagne: nomCampagne || sujet,
      category,
      sujet,
      preheader: preheader || null,
      expediteur,
      informationUser: blocs,
      groupeIds: groupesSelectionnes.map(g => g.id),
      scheduledAt: mode === 'differe' && date
        ? new Date(`${date}T${heure || '00:00'}`).toISOString()
        : null,
    }

    try {
      const res = await apiFetch.post<{ data: SendResult }>('/email/campaigns/send', payload)
      setResult(res.data)
      setConfirmed(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setConfirmed(false)
    setMode('immediat')
    setDate('')
    setHeure('')
    setErrors({})
    setApiError('')
    setResult(null)
    onClose()
  }

  const formatDate = () => {
    if (!date) return '—'
    const d = new Date(`${date}T${heure || '00:00'}`)
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const inputCls = (err?: string) =>
    `w-full rounded-lg border px-3 py-2 text-[12px] text-gray-700 bg-white outline-none transition-colors ${err ? 'border-red-400' : 'border-gray-200 focus:border-[#F4511E]'}`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4511E]/10">
                    <Calendar size={15} className="text-[#F4511E]" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#1F2937]">Programmer l'envoi</h2>
                    <p className="text-[11px] text-gray-400">Choisissez quand envoyer votre campagne</p>
                  </div>
                </div>
                <button onClick={handleClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Fermer">
                  <X size={15} />
                </button>
              </div>

              <div className="px-6 py-5">
                {!confirmed ? (
                  <>
                    {/* Choix du mode */}
                    <div className="mb-5 space-y-2">
                      <button
                        onClick={() => setMode('immediat')}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${mode === 'immediat' ? 'border-[#F4511E] bg-[#FFF7F5]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mode === 'immediat' ? 'bg-[#F4511E]' : 'bg-gray-100'}`}>
                          <Zap size={15} className={mode === 'immediat' ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div>
                          <p className={`text-[13px] font-semibold ${mode === 'immediat' ? 'text-[#F4511E]' : 'text-gray-700'}`}>Envoyer immédiatement</p>
                          <p className="text-[11px] text-gray-400">La campagne part dès la confirmation</p>
                        </div>
                        <div className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${mode === 'immediat' ? 'border-[#F4511E] bg-[#F4511E]' : 'border-gray-300'}`}>
                          {mode === 'immediat' && <div className="h-full w-full rounded-full bg-white scale-[0.4]" />}
                        </div>
                      </button>

                      <button
                        onClick={() => setMode('differe')}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${mode === 'differe' ? 'border-[#F4511E] bg-[#FFF7F5]' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mode === 'differe' ? 'bg-[#F4511E]' : 'bg-gray-100'}`}>
                          <Clock size={15} className={mode === 'differe' ? 'text-white' : 'text-gray-400'} />
                        </div>
                        <div>
                          <p className={`text-[13px] font-semibold ${mode === 'differe' ? 'text-[#F4511E]' : 'text-gray-700'}`}>Planifier à une date</p>
                          <p className="text-[11px] text-gray-400">Choisissez la date et l'heure d'envoi</p>
                        </div>
                        <div className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${mode === 'differe' ? 'border-[#F4511E] bg-[#F4511E]' : 'border-gray-300'}`}>
                          {mode === 'differe' && <div className="h-full w-full rounded-full bg-white scale-[0.4]" />}
                        </div>
                      </button>
                    </div>

                    {/* Sélecteur date/heure */}
                    <AnimatePresence>
                      {mode === 'differe' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mb-5 overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-3">
                            <div>
                              <label className="mb-1 block text-[11px] font-medium text-gray-500">Date d'envoi</label>
                              <input type="date" min={today} value={date}
                                onChange={e => { setDate(e.target.value); setErrors(er => ({ ...er, date: undefined })) }}
                                className={inputCls(errors.date)} />
                              {errors.date && <p className="mt-0.5 text-[10px] text-red-500">{errors.date}</p>}
                            </div>
                            <div>
                              <label className="mb-1 block text-[11px] font-medium text-gray-500">Heure d'envoi</label>
                              <input type="time" value={heure}
                                onChange={e => { setHeure(e.target.value); setErrors(er => ({ ...er, heure: undefined })) }}
                                className={inputCls(errors.heure)} />
                              {errors.heure && <p className="mt-0.5 text-[10px] text-red-500">{errors.heure}</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Récapitulatif */}
                    <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Récapitulatif</p>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <Mail size={12} className="mt-0.5 shrink-0 text-gray-400" />
                          <div>
                            <span className="text-[11px] text-gray-500">Objet : </span>
                            {sujet ? <span className="text-[12px] font-medium text-gray-700">{sujet}</span>
                              : <span className="text-[11px] italic text-red-400">⚠ Non renseigné</span>}
                          </div>
                        </div>
                        {blocs.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Code2 size={12} className="shrink-0 text-gray-400" />
                            <span className="text-[11px] text-gray-500">Contenu : </span>
                            <span className="text-[12px] font-medium text-gray-700">
                              {blocs.length} bloc{blocs.length > 1 ? 's' : ''} — {blocs.map(b => b.type).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <Users size={12} className="mt-0.5 shrink-0 text-gray-400" />
                          <div>
                            <span className="text-[11px] text-gray-500">Destinataires : </span>
                            {groupesSelectionnes.length > 0
                              ? <span className="text-[12px] font-medium text-gray-700">
                                  {groupesSelectionnes.map(g => `${g.name} (${g.contacts.length})`).join(', ')}
                                  {' — '}
                                  <span className="text-[#F4511E]">
                                    {groupesSelectionnes.reduce((a, g) => a + g.contacts.length, 0)} destinataire{groupesSelectionnes.reduce((a, g) => a + g.contacts.length, 0) > 1 ? 's' : ''}
                                  </span>
                                </span>
                              : <span className="text-[11px] italic text-orange-400">⚠ Aucun segment sélectionné</span>
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="shrink-0 text-gray-400" />
                          <span className="text-[11px] text-gray-500">Envoi :</span>
                          <span className="text-[12px] font-medium text-gray-700">
                            {mode === 'immediat' ? 'Immédiatement après confirmation'
                              : date ? `${formatDate()}${heure ? ` à ${heure}` : ''}` : <span className="italic text-gray-300">Date non choisie</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Erreur API */}
                    {apiError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
                        <AlertCircle size={13} className="shrink-0" />
                        {apiError}
                      </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3">
                      <button onClick={handleClose} disabled={loading}
                        className="flex-1 rounded-lg border border-gray-200 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                        Annuler
                      </button>
                      <button onClick={handleConfirm} disabled={loading}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F4511E] py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60">
                        {loading
                          ? <><Loader2 size={13} className="animate-spin" /> Envoi en cours...</>
                          : <><Send size={13} /> {mode === 'immediat' ? 'Envoyer maintenant' : "Planifier l'envoi"}</>
                        }
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── Succès ── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-4 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                      <Send size={22} className="text-green-500" />
                    </div>
                    <h3 className="mb-1 text-[15px] font-bold text-[#1F2937]">
                      {mode === 'immediat' ? 'Campagne envoyée !' : 'Envoi planifié !'}
                    </h3>
                    {nomCampagne && (
                      <p className="mb-1 text-[13px] font-semibold text-[#F4511E]">{nomCampagne}</p>
                    )}
                    <p className="mb-2 text-[12px] text-gray-500">
                      {mode === 'immediat'
                        ? `${result?.totalRecipients ?? 0} email${(result?.totalRecipients ?? 0) > 1 ? 's' : ''} en cours d'envoi via Brevo.`
                        : `Votre campagne sera envoyée le ${formatDate()}${heure ? ` à ${heure}` : ''}.`
                      }
                    </p>
                    {result && (
                      <p className="mb-5 text-[11px] text-gray-400">Référence #{result.campaignId}</p>
                    )}
                    <button onClick={() => { onSuccess?.(); handleClose() }}
                      className="rounded-lg bg-[#F4511E] px-6 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
                      Fermer et nouvelle campagne
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
