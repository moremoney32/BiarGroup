import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Loader2, BarChart2 } from 'lucide-react'
import apiFetch from '../../../services/api'

export interface Criterion {
  field:    string
  operator: string
  value?:   string
}

interface Props {
  onClose:   () => void
  onCreated: (seg: SegmentData) => void
  initial?:  { name?: string; criteriaJson?: Criterion[] }
}

export interface SegmentData {
  id:           number
  name:         string
  description:  string
  type:         'dynamique' | 'statique'
  criteria_json: Criterion[]
  contact_count: number
  created_at:   string
  updated_at:   string
}

const BASE_FIELD_OPTIONS = [
  { value: 'first_name',   label: 'Prénom' },
  { value: 'last_name',    label: 'Nom' },
  { value: 'email',        label: 'Email' },
  { value: 'phone',        label: 'Téléphone' },
  { value: 'company',      label: 'Entreprise' },
  { value: 'tags',         label: 'Tags' },
  { value: 'is_opted_out', label: 'Opt-out' },
  { value: 'created_at',   label: 'Date d\'inscription' },
]

// Champs dont les valeurs sont numériques → opérateurs <, >
const NUMERIC_FIELD_HINTS = new Set(['age', 'score', 'montant', 'nombre', 'total', 'prix', 'note', 'rating', 'annee', 'year', 'count', 'nb'])

function isNumericCustomField(key: string) {
  const k = key.toLowerCase()
  return NUMERIC_FIELD_HINTS.has(k) || k.startsWith('nb_') || k.startsWith('num_')
}

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  default: [
    { value: 'equals',       label: 'égal à' },
    { value: 'not_equals',   label: 'différent de' },
    { value: 'contains',     label: 'contient' },
    { value: 'starts_with',  label: 'commence par' },
    { value: 'is_empty',     label: 'est vide' },
    { value: 'is_not_empty', label: 'n\'est pas vide' },
  ],
  numeric: [
    { value: 'equals',       label: 'égal à' },
    { value: 'not_equals',   label: 'différent de' },
    { value: 'greater_than', label: 'supérieur à' },
    { value: 'less_than',    label: 'inférieur à' },
    { value: 'is_empty',     label: 'est vide' },
    { value: 'is_not_empty', label: 'n\'est pas vide' },
  ],
  created_at: [
    { value: 'greater_than', label: 'après le' },
    { value: 'less_than',    label: 'avant le' },
    { value: 'equals',       label: 'égal à' },
  ],
  is_opted_out: [
    { value: 'equals', label: 'égal à' },
  ],
  tags: [
    { value: 'equals',       label: 'contient le tag' },
    { value: 'not_equals',   label: 'ne contient pas' },
  ],
}

const NO_VALUE_OPS = new Set(['is_empty', 'is_not_empty'])

function emptyCriterion(): Criterion {
  return { field: 'email', operator: 'contains', value: '' }
}

export default function CreateSegmentModal({ onClose, onCreated, initial }: Props) {
  const [name, setName]         = useState(initial?.name ?? '')
  const [desc, setDesc]         = useState('')
  const [type, setType]         = useState<'dynamique' | 'statique'>('dynamique')
  const [criteria, setCriteria] = useState<Criterion[]>(
    initial?.criteriaJson?.length ? initial.criteriaJson : [emptyCriterion()]
  )
  const [estimate, setEstimate] = useState<number | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [nameErr, setNameErr]   = useState('')
  const [customKeys, setCustomKeys] = useState<string[]>([])

  // Charge les champs personnalisés du tenant (age, ville, etc.)
  useEffect(() => {
    apiFetch.get<{ data: string[] }>('/contacts/fields')
      .then(r => setCustomKeys(r.data ?? []))
      .catch(() => {})
  }, [])

  const fieldOptions = [
    ...BASE_FIELD_OPTIONS,
    ...customKeys.map(k => ({
      value: `custom.${k}`,
      label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '),
    })),
  ]

  function getOperators(field: string) {
    if (field in OPERATOR_OPTIONS) return OPERATOR_OPTIONS[field]
    if (field.startsWith('custom.') && isNumericCustomField(field.slice(7))) return OPERATOR_OPTIONS.numeric
    return OPERATOR_OPTIONS.default
  }

  const runEstimate = useCallback(async (crit: Criterion[]) => {
    if (type !== 'dynamique' || !crit.length) return
    setEstimating(true)
    try {
      const r = await apiFetch.post<{ data: { count: number } }>('/contacts/segments/estimate', { criteria: crit })
      setEstimate(r.data.count)
    } catch {
      setEstimate(null)
    } finally {
      setEstimating(false)
    }
  }, [type])

  useEffect(() => {
    const t = setTimeout(() => runEstimate(criteria), 600)
    return () => clearTimeout(t)
  }, [criteria, runEstimate])

  const updateCriterion = (i: number, patch: Partial<Criterion>) => {
    setCriteria(prev => prev.map((c, idx) => {
      if (idx !== i) return c
      const updated = { ...c, ...patch }
      if (patch.field) {
        const ops = getOperators(patch.field)
        updated.operator = ops[0].value
        updated.value    = ''
      }
      return updated
    }))
  }

  const addCriterion    = () => setCriteria(prev => [...prev, emptyCriterion()])
  const removeCriterion = (i: number) => setCriteria(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!name.trim()) { setNameErr('Le nom du segment est requis'); return }
    setSaving(true)
    try {
      const r = await apiFetch.post<{ data: SegmentData }>('/contacts/segments', {
        name:         name.trim(),
        description:  desc,
        type,
        criteriaJson: type === 'dynamique' ? criteria : [],
      })
      if (!r?.data) throw new Error('Réponse invalide du serveur')
      onCreated(r.data)
    } catch (err: unknown) {
      setNameErr(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#1F2937]">Créer un nouveau segment</h2>
            <p className="text-[12px] text-gray-400">Créez des segments ciblés pour vos campagnes</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Nom */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#1F2937]">
              Nom du segment <span className="text-[#E91E8C]">*</span>
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setNameErr('') }}
              placeholder="Ex. : Prospects immobilier Kinshasa"
              className="w-full rounded-xl border border-gray-200 bg-[#FFF5F0] px-3 py-2.5 text-[13px] text-[#1F2937] placeholder-gray-400 outline-none focus:border-[#E91E8C] focus:ring-1 focus:ring-[#E91E8C]/20"
            />
            {nameErr && <p className="mt-1 text-[11px] text-red-500">{nameErr}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-[#1F2937]">Description</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              placeholder="Décrivez votre segment..."
              className="w-full rounded-xl border border-gray-200 bg-[#FFF5F0] px-3 py-2.5 text-[13px] text-[#1F2937] placeholder-gray-400 outline-none focus:border-[#E91E8C] focus:ring-1 focus:ring-[#E91E8C]/20 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-[#1F2937]">Type de segment</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: 'dynamique', title: 'Dynamique', sub: 'Mis à jour automatiquement selon les critères' },
                { v: 'statique',  title: 'Statique',  sub: 'Liste fixe de contacts' },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setType(opt.v)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    type === opt.v
                      ? 'border-[#E91E8C] bg-[#FFF0F7]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className={`text-[13px] font-bold ${type === opt.v ? 'text-[#E91E8C]' : 'text-[#1F2937]'}`}>
                    {opt.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Critères — only for dynamique */}
          {type === 'dynamique' && (
            <div>
              <label className="mb-2 block text-[12px] font-semibold text-[#1F2937]">Critères de segmentation</label>
              <div className="space-y-2">
                {criteria.map((c, i) => {
                  const ops   = getOperators(c.field)
                  const noVal = NO_VALUE_OPS.has(c.operator)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {/* Field */}
                      <select
                        value={c.field}
                        onChange={e => updateCriterion(i, { field: e.target.value })}
                        className="flex-1 rounded-lg border border-[#E91E8C]/30 bg-[#E91E8C] px-2 py-2 text-[11px] font-medium text-white outline-none cursor-pointer"
                      >
                        {fieldOptions.map(f => (
                          <option key={f.value} value={f.value} className="bg-white text-[#1F2937]">{f.label}</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={c.operator}
                        onChange={e => updateCriterion(i, { operator: e.target.value })}
                        className="flex-1 rounded-lg border border-[#E91E8C]/30 bg-[#E91E8C] px-2 py-2 text-[11px] font-medium text-white outline-none cursor-pointer"
                      >
                        {ops.map(o => (
                          <option key={o.value} value={o.value} className="bg-white text-[#1F2937]">{o.label}</option>
                        ))}
                      </select>

                      {/* Value */}
                      {!noVal && (
                        <input
                          value={c.value ?? ''}
                          onChange={e => updateCriterion(i, { value: e.target.value })}
                          placeholder={
                            c.field === 'created_at' ? 'YYYY-MM-DD' :
                            c.field === 'is_opted_out' ? '0 ou 1' :
                            c.field === 'custom.age' ? 'Ex: 25' :
                            c.field === 'custom.ville' ? 'Ex: Kinshasa' :
                            c.field.startsWith('custom.') && isNumericCustomField(c.field.slice(7)) ? 'Nombre' :
                            'Valeur'
                          }
                          className="flex-1 rounded-lg border border-[#E91E8C]/30 bg-[#FFF0F7] px-2 py-2 text-[11px] text-[#1F2937] placeholder-gray-400 outline-none focus:border-[#E91E8C]"
                        />
                      )}
                      {noVal && <div className="flex-1" />}

                      {/* Remove */}
                      {criteria.length > 1 ? (
                        <button
                          onClick={() => removeCriterion(i)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={addCriterion}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-[#E91E8C] hover:text-[#E91E8C]"
                        >
                          <Plus size={13} />
                        </button>
                      )}
                    </div>
                  )
                })}

                {criteria.length > 1 && (
                  <button
                    onClick={addCriterion}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#E91E8C] hover:underline"
                  >
                    <Plus size={11} /> Ajouter un critère
                  </button>
                )}
              </div>

              {/* Estimation */}
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} className="text-blue-500" />
                  {estimating ? (
                    <p className="text-[12px] text-blue-600 flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin" /> Calcul en cours...
                    </p>
                  ) : estimate !== null ? (
                    <p className="text-[12px] font-semibold text-blue-700">
                      Estimation : ~{estimate.toLocaleString()} contacts correspondent à ces critères
                    </p>
                  ) : (
                    <p className="text-[12px] text-blue-600">Ajoutez des critères pour estimer le nombre de contacts</p>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-blue-500 ml-5">
                  Ce segment sera automatiquement mis à jour lorsque de nouveaux contacts correspondent aux critères.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-5 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#E91E8C] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#c9186f] disabled:opacity-60"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Créer le segment
          </button>
        </div>
      </div>
    </div>
  )
}
