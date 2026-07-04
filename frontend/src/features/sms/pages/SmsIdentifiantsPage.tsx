import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Info, Tag, CheckCircle2, Clock, BarChart2, X, Loader2, Trash2, Star, Filter, Download } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import { useToast } from '../../../hooks/useToast'
import type { SmsSenderId } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const STATUT_STYLE: Record<string, { bg: string; text: string }> = {
  approved:         { bg: '#F0FDF4', text: '#16A34A' },
  pending_approval: { bg: '#FFF7ED', text: '#EA580C' },
  rejected:         { bg: '#FEF2F2', text: '#DC2626' },
}

const STATUT_LABEL: Record<string, string> = {
  approved: 'Actif',
  pending_approval: 'En attente',
  rejected: 'Refusé',
}

// ── Modal : Ajouter un Sender ID ──────────────────────────────

interface AddSenderIdModalProps { onClose: () => void; onCreated: () => void }

function AddSenderIdModal({ onClose, onCreated }: AddSenderIdModalProps) {
  const [senderId, setSender] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleAdd() {
    const val = senderId.trim().toUpperCase()
    if (!val) { setError('Le Sender ID est requis'); return }
    if (!/^[A-Za-z0-9]{1,11}$/.test(val)) { setError('1 à 11 caractères alphanumériques uniquement (A-Z, 0-9)'); return }
    setLoading(true); setError('')
    try {
      await smsService.createSenderId(val)
      onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">Ajouter un Sender ID</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-2 rounded-xl bg-[#EFF6FF] p-3">
            <Info size={14} className="mt-0.5 shrink-0 text-[#3B82F6]" />
            <p className="text-[11px] text-[#1D4ED8] leading-relaxed">
              Max 11 caractères alphanumériques. Exemple : BIARGROUP, CLINIQUE, BANQUE.<br />
              La demande est examinée par l'équipe BIAR avant activation.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-600">Sender ID *</label>
            <input
              type="text" value={senderId}
              onChange={e => setSender(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={11}
              placeholder="BIARGROUP"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-bold tracking-widest text-[#F4511E] outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]"
            />
            <p className="mt-1 text-[10px] text-gray-400">{senderId.length}/11 caractères</p>
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
            Soumettre
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

export default function SmsIdentifiantsPage() {
  const toast = useToast()
  const [emetteurs, setEmetteurs] = useState<SmsSenderId[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setModal]     = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [defaultSender, setDefaultSender] = useState<string>(() =>
    localStorage.getItem('sms_default_sender') ?? ''
  )

  function toggleDefault(sender: string) {
    const next = defaultSender === sender ? '' : sender
    setDefaultSender(next)
    if (next) localStorage.setItem('sms_default_sender', next)
    else localStorage.removeItem('sms_default_sender')
  }

  function exportCsv() {
    if (emetteurs.length === 0) return
    const header = 'Sender ID,Statut,Créé le,Approuvé le'
    const rows = emetteurs.map(e =>
      [e.sender_id, STATUT_LABEL[e.status] ?? e.status,
       new Date(e.created_at).toLocaleDateString('fr-FR'),
       e.approved_at ? new Date(e.approved_at).toLocaleDateString('fr-FR') : '—',
      ].join(',')
    ).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sender_ids.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchSenderIds = useCallback(async () => {
    setLoading(true)
    try {
      const data = await smsService.getSenderIds()
      setEmetteurs(data)
    } catch {
      // silently fail — table empty state handles it
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSenderIds() }, [fetchSenderIds])

  async function handleDelete(e: SmsSenderId) {
    const msg = e.status === 'approved'
      ? `ATTENTION : "${e.sender_id}" est approuvé et actif.\nLe supprimer empêchera tout envoi futur avec cet identifiant.\n\nConfirmer la suppression ?`
      : `Supprimer le Sender ID "${e.sender_id}" ?`
    if (!confirm(msg)) return
    setDeleting(e.id)
    try {
      await smsService.deleteSenderId(e.id)
      setEmetteurs(prev => prev.filter(x => x.id !== e.id))
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = emetteurs.filter(e =>
    e.sender_id.toLowerCase().includes(search.toLowerCase())
  )

  const total   = emetteurs.length
  const actifs  = emetteurs.filter(e => e.status === 'approved').length
  const attente = emetteurs.filter(e => e.status === 'pending_approval').length

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-2">🟠</span>Émetteurs (Sender ID / OADC)
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gérez vos identifiants d'expéditeur pour l'envoi de SMS</p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {/* Info box */}
        <div className="mb-5 flex gap-3 rounded-xl bg-[#EFF6FF] p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-[#3B82F6]" />
          <p className="text-[12px] text-[#1D4ED8] leading-relaxed">
            Le Sender ID (ou OADC) est le nom d'expéditeur qui apparaît sur le téléphone du destinataire.
            Il peut contenir jusqu'à 11 caractères alphanumériques. L'approbation peut prendre 2-5 jours ouvrables selon les opérateurs.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Tag,          bg: '#EFF6FF', color: '#3B82F6', label: 'Total Émetteurs', value: total },
            { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Actifs',           value: actifs },
            { icon: Clock,        bg: '#FFF7ED', color: '#EA580C', label: 'En Attente',       value: attente },
            { icon: BarChart2,    bg: '#F5F3FF', color: '#8B5CF6', label: 'Utilisations',     value: '—' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{loading ? '…' : value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Liste des Émetteurs</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-[#F4511E] px-3 py-2">
                <Search size={13} className="text-white/70" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-32 bg-transparent text-[11px] text-white outline-none placeholder-white/60"
                />
              </div>
              <button title="Filtres avancés"
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
                <Filter size={13} />
              </button>
              <button onClick={exportCsv} disabled={emetteurs.length === 0} title="Exporter en CSV"
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  <th className="px-4 py-2.5 text-left"><input type="checkbox" className="rounded" /></th>
                  {["Nom d'Émetteur", 'Statut', 'Pays', 'Utilisations', 'Créé le', 'Par défaut', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="py-10 text-center">
                    <Loader2 size={18} className="mx-auto animate-spin text-gray-300" />
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-[12px] text-gray-400">
                    {search ? 'Aucun émetteur trouvé' : 'Aucun Sender ID — cliquez sur "Ajouter"'}
                  </td></tr>
                )}
                {!loading && filtered.map(sid => {
                  const ss = STATUT_STYLE[sid.status] ?? { bg: '#F9FAFB', text: '#6B7280' }
                  return (
                    <tr key={sid.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-[#FFEEE6] px-3 py-1.5 text-[12px] font-bold text-[#F4511E]">
                          {sid.sender_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.text }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ss.text }} />
                          {STATUT_LABEL[sid.status] ?? sid.status}
                        </span>
                      </td>
                      {/* Pays de couverture Infobip — CM + CD pour l'instant */}
                      <td className="px-4 py-3 text-[11px] font-semibold text-gray-600 whitespace-nowrap">CM CD</td>
                      {/* Compteur d'utilisations — dispo quand le backend le stockera */}
                      <td className="px-4 py-3 text-[11px] text-gray-400">—</td>
                      <td className="px-4 py-3 text-[11px] text-gray-500">
                        {new Date(sid.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleDefault(sid.sender_id)}
                          aria-label={defaultSender === sid.sender_id ? 'Retirer le sender par défaut' : 'Définir comme sender par défaut'}
                          className="rounded p-1 transition-colors hover:bg-yellow-50">
                          <Star size={15}
                            className={defaultSender === sid.sender_id ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(sid)}
                          disabled={deleting === sid.id}
                          className="flex items-center gap-1 rounded p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors text-[11px] font-medium">
                          {deleting === sid.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Suppr.
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </motion.div>

      {showModal && (
        <AddSenderIdModal
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); fetchSenderIds() }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
