import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Send, X, Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Trash2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'

interface Campaign {
  id: number
  name: string | null
  sujet: string
  total_sent: number
  opens: number
  sent_at: string | null
}

interface Relance {
  id: number
  campaign_id: number
  campaign_name: string | null
  campaign_sujet: string
  new_subject: string
  delay_days: number
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  scheduled_at: string
  executed_at: string | null
  total_sent: number
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pending:   { label: 'Planifiée',  color: '#3B82F6', Icon: Clock },
  running:   { label: 'En cours',   color: '#F4511E', Icon: Loader2 },
  completed: { label: 'Exécutée',   color: '#10B981', Icon: CheckCircle2 },
  cancelled: { label: 'Annulée',    color: '#9CA3AF', Icon: XCircle },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ConstructeurFluxPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [relances,  setRelances]  = useState<Relance[]>([])
  const [loading,   setLoading]   = useState(true)

  // Modal
  const [showModal,   setShowModal]   = useState(false)
  const [selCampaign, setSelCampaign] = useState<Campaign | null>(null)
  const [newSubject,  setNewSubject]  = useState('')
  const [delayDays,   setDelayDays]   = useState(5)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState('')

  // Annulation
  const [cancelling, setCancelling] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([
        apiFetch.get<{ data: Campaign[] }>('/email/campaigns'),
        apiFetch.get<{ data: Relance[] }>('/email/relances'),
      ])
      // Seules les campagnes "sent" sont éligibles à une relance
      const sent = (cRes.data ?? []).filter(c => (c as any).status === 'sent')
      setCampaigns(sent)
      setRelances(rRes.data ?? [])
    } catch {
      // empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openModal = (c: Campaign) => {
    setSelCampaign(c)
    setNewSubject(`Re: ${c.sujet}`)
    setDelayDays(5)
    setFormError('')
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!newSubject.trim()) { setFormError("L'objet de relance est requis"); return }
    if (!selCampaign) return
    setSaving(true)
    setFormError('')
    try {
      await apiFetch.post('/email/relances', {
        campaignId: selCampaign.id,
        newSubject: newSubject.trim(),
        delayDays,
      })
      setShowModal(false)
      await load()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler cette relance ?')) return
    setCancelling(id)
    try {
      await apiFetch.delete(`/email/relances/${id}`)
      setRelances(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } finally {
      setCancelling(null)
    }
  }

  // Campagnes sans relance active (pending ou running)
  const activeRelanceCampaignIds = new Set(
    relances.filter(r => r.status === 'pending' || r.status === 'running').map(r => r.campaign_id)
  )
  const eligible = campaigns.filter(c => !activeRelanceCampaignIds.has(c.id))

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Relance automatique</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Renvoie automatiquement l'email aux contacts qui ne l'ont pas ouvert après X jours
            </p>
          </div>
        </div>

        {/* Explication */}
        <div className="mb-6 rounded-xl border border-[#F4511E]/20 bg-orange-50/40 p-4">
          <div className="flex items-start gap-3">
            <RotateCcw size={18} className="mt-0.5 shrink-0 text-[#F4511E]" />
            <div>
              <p className="text-[13px] font-semibold text-[#1F2937]">Comment ça marche ?</p>
              <p className="mt-1 text-[12px] leading-relaxed text-gray-600">
                Tu choisis une campagne déjà envoyée, tu écris un nouvel objet et tu choisis le délai.
                Le système attend le nombre de jours choisi, puis envoie automatiquement le même email
                — avec le nouvel objet — uniquement aux personnes qui ne l'ont pas ouvert.
                Les personnes qui l'ont déjà ouvert ne reçoivent rien.
              </p>
            </div>
          </div>
        </div>

        {/* Campagnes éligibles */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1F2937]">Campagnes éligibles à la relance</h2>
            <span className="text-[11px] text-gray-400">{eligible.length} campagne{eligible.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-[#F4511E]" />
            </div>
          ) : eligible.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12px] text-gray-400">
              Aucune campagne envoyée disponible — envoyez d'abord une campagne depuis l'éditeur.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne', 'Envoyés', 'Ouvertures', 'Non ouverts', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eligible.map(c => {
                  const nonOpeners = c.total_sent - c.opens
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#1F2937]">{c.name ?? c.sujet}</p>
                        {c.name && <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{c.sujet}</p>}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{c.total_sent.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[12px] text-blue-500">{c.opens.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[12px] font-semibold ${nonOpeners > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                          {nonOpeners.toLocaleString('fr-FR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openModal(c)}
                          disabled={nonOpeners === 0}
                          className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={11} /> Programmer la relance
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Relances existantes */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-3">
            <h2 className="text-[14px] font-semibold text-[#1F2937]">Historique des relances</h2>
          </div>

          {!loading && relances.length === 0 ? (
            <p className="px-5 py-8 text-center text-[12px] text-gray-400">Aucune relance créée pour l'instant.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne', 'Nouvel objet', 'Délai', 'Statut', 'Planifiée le', 'Envoyés', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relances.map(r => {
                  const { label, color, Icon } = STATUS_MAP[r.status] ?? STATUS_MAP.cancelled
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#1F2937]">{r.campaign_name ?? r.campaign_sujet}</p>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700 max-w-[180px] truncate">{r.new_subject}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-600">{r.delay_days}j</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: color }}>
                          <Icon size={10} className={r.status === 'running' ? 'animate-spin' : ''} />
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">{fmt(r.scheduled_at)}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">
                        {r.status === 'completed' ? r.total_sent.toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={cancelling === r.id}
                            className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                          >
                            {cancelling === r.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <DashboardFooter />

      {/* Modal création relance */}
      {showModal && selCampaign && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4511E]/10">
                    <RotateCcw size={15} className="text-[#F4511E]" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#1F2937]">Programmer une relance</h2>
                    <p className="text-[11px] text-gray-400">Pour les non-ouvreurs uniquement</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                  <X size={15} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Campagne sélectionnée */}
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-[11px] text-gray-500">Campagne</p>
                  <p className="text-[13px] font-semibold text-[#1F2937]">{selCampaign.name ?? selCampaign.sujet}</p>
                  <p className="text-[11px] text-orange-500">
                    {(selCampaign.total_sent - selCampaign.opens).toLocaleString('fr-FR')} non-ouvreur{selCampaign.total_sent - selCampaign.opens > 1 ? 's' : ''} recevront la relance
                  </p>
                </div>

                {/* Nouvel objet */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Nouvel objet de l'email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={e => { setNewSubject(e.target.value); setFormError('') }}
                    placeholder="Ex: Au cas où vous avez raté notre message..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]"
                  />
                  <p className="mt-1 text-[10px] text-gray-400">Utilisez un objet différent — c'est ce qui incite à ouvrir la 2e fois</p>
                </div>

                {/* Délai */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">Envoyer après</label>
                  <div className="flex gap-2">
                    {/* 0 = mode test : exécution immédiate côté serveur */}
                    {([0, 3, 5, 7, 10] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDelayDays(d)}
                        className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-all ${
                          delayDays === d
                            ? d === 0 ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-[#F4511E] bg-[#FFF7F5] text-[#F4511E]'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {d === 0 ? '1 min 🧪' : `${d}j`}
                      </button>
                    ))}
                  </div>
                  {delayDays === 0 && (
                    <p className="mt-1 text-[10px] text-purple-500">Mode test — la relance s'exécute dans ~1 minute, ignorant ceux qui ont ouvert.</p>
                  )}
                </div>

                {/* Récap */}
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5">
                  <Send size={12} className="mt-0.5 shrink-0 text-blue-400" />
                  <p className="text-[11px] text-blue-600">
                    {delayDays === 0
                      ? <>La relance sera envoyée <strong>dans ~1 minute</strong> aux non-ouvreurs (mode test).</>
                      : <>La relance sera envoyée automatiquement dans <strong>{delayDays} jours</strong> aux contacts qui n'auront pas ouvert l'email original.</>
                    }
                  </p>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    <AlertCircle size={13} className="shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#F4511E] py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60"
                  >
                    {saving ? <><Loader2 size={13} className="animate-spin" /> Création...</> : <><RotateCcw size={13} /> Planifier la relance</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
