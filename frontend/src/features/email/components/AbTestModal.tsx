import { useState, useEffect } from 'react'
import { X, FlaskConical, Loader2, CheckCircle2, ChevronDown } from 'lucide-react'
import apiFetch from '../../../services/api'

interface Group {
  id: number
  name: string
  contact_count?: number
}

interface Template {
  id: number
  name: string
  category: string
  sujet: string | null
  blocs_json: object[]
}

interface AbTestModalProps {
  onClose: () => void
  onSuccess: () => void
  prefillExpediteur?: string
  prefillSubjectA?: string
  prefillBlocsJson?: object[]
}

const SPLIT_OPTIONS = [5, 10, 20, 25]
const WAIT_OPTIONS  = [{ value: 1, label: '1h' }, { value: 2, label: '2h' }, { value: 4, label: '4h' }, { value: 8, label: '8h' }, { value: 24, label: '24h' }]

export default function AbTestModal({ onClose, onSuccess, prefillExpediteur, prefillSubjectA, prefillBlocsJson }: AbTestModalProps) {
  const fromEditor = Boolean(prefillBlocsJson)

  const [groups,    setGroups]    = useState<Group[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading,   setLoading]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const [form, setForm] = useState({
    name:         '',
    expediteur:   prefillExpediteur ?? '',
    subjectA:     prefillSubjectA ?? '',
    subjectB:     '',
    templateId:   0,
    groupIds:     [] as number[],
    splitPercent: 10,
    winnerMetric: 'open_rate' as 'open_rate' | 'click_rate',
    waitHours:    4,
  })

  useEffect(() => {
    const reqs: Promise<unknown>[] = [apiFetch.get<{ data: Group[] }>('/contacts/groups')]
    if (!fromEditor) reqs.push(apiFetch.get<{ data: Template[] }>('/email/templates'))
    Promise.all(reqs).then(([gRes, tRes]) => {
      setGroups((gRes as { data: Group[] }).data ?? [])
      if (tRes) setTemplates((tRes as { data: Template[] }).data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleGroup = (id: number) => {
    setForm(prev => ({
      ...prev,
      groupIds: prev.groupIds.includes(id)
        ? prev.groupIds.filter(g => g !== id)
        : [...prev.groupIds, id],
    }))
  }

  const selectedTemplate = templates.find(t => t.id === form.templateId)

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim())       return setError('Donnez un nom au test')
    if (!form.expediteur.trim()) return setError("L'expéditeur est requis")
    if (!form.subjectA.trim())   return setError("L'objet A est requis")
    if (!form.subjectB.trim())   return setError("L'objet B est requis")
    if (form.subjectA === form.subjectB) return setError('Les deux objets doivent être différents')
    if (!fromEditor && !form.templateId) return setError('Sélectionnez un template de contenu')
    if (!form.groupIds.length)   return setError('Sélectionnez au moins un groupe')

    const blocsJson = fromEditor ? prefillBlocsJson! : selectedTemplate!.blocs_json

    setSubmitting(true)
    try {
      await apiFetch.post('/email/ab-tests', {
        name:         form.name,
        expediteur:   form.expediteur,
        blocsJson,
        subjectA:     form.subjectA,
        subjectB:     form.subjectB,
        groupIds:     form.groupIds,
        splitPercent: form.splitPercent,
        winnerMetric: form.winnerMetric,
        waitHours:    form.waitHours,
      })
      setSuccess(true)
      setTimeout(() => { onSuccess(); onClose() }, 1800)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Erreur lors du lancement'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF1EE]">
              <FlaskConical size={16} className="text-[#F4511E]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">Nouveau test A/B</h2>
              <p className="text-[11px] text-gray-400">Même contenu, deux objets différents</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#F4511E]" />
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-[14px] font-semibold text-[#1F2937]">Test A/B lancé avec succès !</p>
            <p className="text-[12px] text-gray-400">Le résultat sera envoyé dans {form.waitHours}h</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">

            {/* Nom du test */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Nom du test</label>
              <input
                type="text"
                placeholder="Ex: Test objet newsletter mars"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]/40"
              />
            </div>

            {/* Expéditeur */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Nom expéditeur</label>
              <input
                type="text"
                placeholder="BIAR GROUP AFRICA"
                value={form.expediteur}
                onChange={e => setForm(p => ({ ...p, expediteur: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20 focus:border-[#F4511E]/40"
              />
            </div>

            {/* Objet A et B */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Objets à tester</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">A</span>
                  <input
                    type="text"
                    placeholder="Version A — Ex: Offre spéciale ce week-end"
                    value={form.subjectA}
                    onChange={e => setForm(p => ({ ...p, subjectA: e.target.value }))}
                    className="flex-1 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">B</span>
                  <input
                    type="text"
                    placeholder="Version B — Ex: 🔥 -30% seulement 48h"
                    value={form.subjectB}
                    onChange={e => setForm(p => ({ ...p, subjectB: e.target.value }))}
                    className="flex-1 rounded-lg border border-orange-200 bg-orange-50/50 px-3 py-2 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20"
                  />
                </div>
              </div>
            </div>

            {/* Template de contenu */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Contenu (template)</label>
              {fromEditor ? (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                  <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  <span className="text-[11px] text-green-700 font-medium">Contenu de l'éditeur utilisé ({prefillBlocsJson!.length} bloc{prefillBlocsJson!.length > 1 ? 's' : ''})</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
                  Aucun template disponible — créez-en un dans <strong>Modèles d'Emails</strong> d'abord.
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={form.templateId}
                    onChange={e => setForm(p => ({ ...p, templateId: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-8 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20"
                  >
                    <option value={0}>— Sélectionner un template —</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.sujet ? `— ${t.sujet}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              )}
            </div>

            {/* Groupes */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Groupes destinataires
                {form.groupIds.length > 0 && (
                  <span className="ml-2 rounded-full bg-[#F4511E] px-2 py-0.5 text-[9px] font-bold text-white">
                    {form.groupIds.length} sélectionné{form.groupIds.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>
              {groups.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
                  Aucun groupe disponible — créez-en un dans <strong>Contacts</strong> d'abord.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {groups.map(g => (
                    <label key={g.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${form.groupIds.includes(g.id) ? 'border-[#F4511E]/40 bg-[#FFF7F5]' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={form.groupIds.includes(g.id)}
                        onChange={() => toggleGroup(g.id)}
                        className="accent-[#F4511E]"
                      />
                      <span className="text-[11px] text-gray-700 truncate">{g.name}</span>
                      {g.contact_count !== undefined && (
                        <span className="ml-auto text-[10px] text-gray-400 shrink-0">{g.contact_count}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Configuration du test */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Split % */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Split par version</label>
                <div className="flex gap-1.5 flex-wrap">
                  {SPLIT_OPTIONS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, splitPercent: v }))}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${form.splitPercent === v ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-gray-400">
                  {form.splitPercent}% A + {form.splitPercent}% B + {100 - form.splitPercent * 2}% gagnant
                </p>
              </div>

              {/* Délai */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Délai avant résultat</label>
                <div className="flex gap-1.5 flex-wrap">
                  {WAIT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, waitHours: value }))}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${form.waitHours === value ? 'bg-[#F4511E] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métrique gagnante */}
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Critère gagnant</label>
                <div className="space-y-1.5">
                  {[
                    { value: 'open_rate',  label: "Taux d'ouverture" },
                    { value: 'click_rate', label: 'Taux de clic' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="winnerMetric"
                        value={value}
                        checked={form.winnerMetric === value}
                        onChange={() => setForm(p => ({ ...p, winnerMetric: value as 'open_rate' | 'click_rate' }))}
                        className="accent-[#F4511E]"
                      />
                      <span className="text-[11px] text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Récapitulatif */}
            {(fromEditor || form.templateId > 0) && form.groupIds.length > 0 && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-[11px] text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700 mb-1">Récapitulatif</p>
                <p>· Version A : <span className="text-blue-600 font-medium">"{form.subjectA || '—'}"</span></p>
                <p>· Version B : <span className="text-[#F4511E] font-medium">"{form.subjectB || '—'}"</span></p>
                <p>· Contenu : <span className="font-medium">{fromEditor ? `Éditeur (${prefillBlocsJson!.length} blocs)` : (selectedTemplate?.name ?? '—')}</span></p>
                <p>· Split : {form.splitPercent}% A + {form.splitPercent}% B → gagnant envoyé aux {100 - form.splitPercent * 2}% restants</p>
                <p>· Résultat dans <span className="font-medium">{form.waitHours}h</span> selon le <span className="font-medium">{form.winnerMetric === 'open_rate' ? "taux d'ouverture" : 'taux de clic'}</span></p>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-50">
              <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
                {submitting ? 'Lancement...' : 'Lancer le test'}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
