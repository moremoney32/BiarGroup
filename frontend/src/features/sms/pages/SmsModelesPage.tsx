import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Copy, Trash2, X, Loader2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsTemplate } from '../../../types/sms.types'

const VARIABLES = ['{{name}}', '{{code}}', '{{date}}', '{{order_id}}', '{{prenom}}', '{{nom}}', '{{tel}}']

// ── Modal ─────────────────────────────────────────────────────

interface ModalProps {
  template?: SmsTemplate | null
  onClose: () => void
  onSaved: () => void
}

function TemplateModal({ template, onClose, onSaved }: ModalProps) {
  const [name, setName]       = useState(template?.name ?? '')
  const [body, setBody]       = useState(template?.body ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const insertVar = (v: string) => setBody(m => m + v)

  async function handleSave() {
    if (!name.trim() || !body.trim()) { setError('Nom et message requis'); return }
    setLoading(true); setError('')
    try {
      if (template) {
        await smsService.updateTemplate(template.id, { name: name.trim(), body: body.trim() })
      } else {
        await smsService.createTemplate({ name: name.trim(), body: body.trim() })
      }
      onSaved()
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#1F2937]">
            {template ? 'Modifier le template' : 'Nouveau template SMS'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Nom du template</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Confirmation commande"
              className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[13px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Variables disponibles</label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <button key={v} onClick={() => insertVar(v)}
                  className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-mono font-semibold text-[#F4511E] hover:bg-orange-100 transition-colors">
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder="Composez votre message SMS..."
              className="w-full resize-none rounded-xl bg-[#FFEEE6] px-4 py-3 text-[13px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
            />
            <p className="mt-1 text-right text-[10px] text-gray-400">{body.length} caractères</p>
          </div>

          {body && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Aperçu</label>
              <div className="rounded-xl bg-[#FFD9C7] px-4 py-3 text-[12px] text-gray-700 leading-relaxed">
                {body}
              </div>
            </div>
          )}

          {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSave} disabled={loading || !name || !body}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#F4511E] py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {template ? 'Sauvegarder' : 'Créer le template'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────

export default function SmsModelesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setModal]     = useState(false)
  const [editing, setEditing]     = useState<SmsTemplate | null>(null)
  const [deleting, setDeleting]   = useState<number | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await smsService.getTemplates()
      setTemplates(data)
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  async function handleDelete(id: number) {
    if (!confirm('Supprimer ce template ?')) return
    setDeleting(id)
    try {
      await smsService.deleteTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch {
      alert('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  async function handleCopy(t: SmsTemplate) {
    try {
      const created = await smsService.createTemplate({ name: `${t.name} (copie)`, body: t.body })
      setTemplates(prev => [...prev, created])
    } catch {
      alert('Erreur lors de la copie')
    }
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.body.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 py-5">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Templates SMS</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Créez et gérez vos modèles de SMS</p>
          </div>
          <button onClick={() => { setEditing(null); setModal(true) }}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f]">
            <Plus size={15} /> Nouveau template
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-[#FFEEE6] px-4 py-3 ring-1 ring-orange-200 focus-within:ring-2 focus-within:ring-[#F4511E]/40">
          <Search size={15} className="shrink-0 text-orange-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un template..."
            className="flex-1 bg-transparent text-[13px] text-[#1F2937] outline-none placeholder-orange-300"
          />
        </div>

        {/* Chargement */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[13px]">Chargement des templates...</span>
          </div>
        )}

        {/* Vide */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-[14px] font-semibold text-gray-500">
              {search ? 'Aucun template trouvé' : 'Aucun template SMS'}
            </p>
            <p className="mt-1 text-[12px]">
              {search ? 'Modifiez votre recherche' : 'Créez votre premier template SMS'}
            </p>
          </div>
        )}

        {/* Grille */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filtered.map(t => (
              <div key={t.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                {/* Card header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1F2937]">{t.name}</h3>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      Créé le {new Date(t.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => { setEditing(t); setModal(true) }}
                      className="rounded-lg p-1.5 text-[#3B82F6] hover:bg-blue-50 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleCopy(t)}
                      className="rounded-lg p-1.5 text-[#0EA5E9] hover:bg-sky-50 transition-colors">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                      className="rounded-lg p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors">
                      {deleting === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* Message preview */}
                <div className="mb-4 rounded-xl bg-[#FFD9C7] px-4 py-3 text-[12px] text-gray-700 leading-relaxed min-h-[60px]">
                  {t.body}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{t.body.length} car. · ~{Math.ceil(t.body.length / 160)} segment(s)</span>
                  <button className="rounded-xl bg-[#F4511E] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#d9400f] transition-colors">
                    Utiliser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {showModal && (
        <TemplateModal
          template={editing}
          onClose={() => { setModal(false); setEditing(null) }}
          onSaved={() => { setModal(false); setEditing(null); fetchTemplates() }}
        />
      )}

      <DashboardFooter />
    </div>
  )
}
