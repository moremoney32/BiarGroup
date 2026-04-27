import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Send, Trash2, Loader2, Users } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'

interface Contact {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface Group {
  id: number
  name: string
  contacts: Contact[]
}

export default function SegmentationEmailPage() {
  const navigate  = useNavigate()
  const [groups, setGroups]   = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Nouveau groupe
  const [showNew, setShowNew]     = useState(false)
  const [newName, setNewName]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    apiFetch.get<{ data: Group[] }>('/contacts/groups')
      .then(r => setGroups(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce groupe ?')) return
    setDeleting(id)
    try {
      await apiFetch.delete(`/contacts/groups/${id}`)
      setGroups(prev => prev.filter(g => g.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) { setNameError('Le nom est requis'); return }
    setSaving(true)
    setNameError('')
    try {
      const res = await apiFetch.post<{ data: Group }>('/contacts/groups', { name: newName, contactIds: [] })
      setGroups(prev => [res.data, ...prev])
      setNewName('')
      setShowNew(false)
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleCampaign = (group: Group) => {
    navigate('/app/email/editeur', { state: { preselectedGroup: group } })
  }

  const totalContacts = groups.reduce((s, g) => s + g.contacts.length, 0)

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Segmentation</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gérez vos groupes de contacts pour cibler vos campagnes</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
          >
            <Plus size={14} /> Nouveau groupe
          </button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Groupes',         value: loading ? '—' : groups.length },
            { label: 'Total contacts',  value: loading ? '—' : totalContacts },
            { label: 'Moyenne/groupe',  value: loading || groups.length === 0 ? '—' : Math.round(totalContacts / groups.length) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
              <p className="text-[24px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Formulaire nouveau groupe */}
        {showNew && (
          <div className="mb-5 rounded-xl border border-[#F4511E]/30 bg-[#FFF7F5] p-4">
            <p className="mb-3 text-[13px] font-semibold text-[#1F2937]">Nouveau groupe</p>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNameError('') }}
                  placeholder="Nom du groupe (ex: Clients VIP Kinshasa)"
                  className="w-full rounded-lg border border-[#F4511E]/40 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]"
                />
                {nameError && <p className="mt-1 text-[11px] text-red-500">{nameError}</p>}
                <p className="mt-1 text-[10px] text-gray-400">Vous pourrez ajouter des contacts depuis la page "Contacts"</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Créer
              </button>
              <button
                onClick={() => { setShowNew(false); setNewName(''); setNameError('') }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des groupes */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[#F4511E]" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="mb-3 text-gray-200" />
            <p className="text-[13px] font-medium text-gray-400">
              Aucun groupe de contacts. Créez votre premier groupe pour organiser vos destinataires.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="mt-4 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
            >
              + Créer mon premier groupe
            </button>
          </div>
        ) : (
          <div className="mb-8 space-y-3">
            {groups.map(g => (
              <div key={g.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7F5]">
                      <Users size={16} className="text-[#F4511E]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1F2937]">{g.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {g.contacts.length} contact{g.contacts.length !== 1 ? 's' : ''}
                        {g.contacts.length > 0 && (
                          <span className="ml-1 text-gray-300">
                            — {g.contacts.slice(0, 3).map(c => c.first_name).join(', ')}
                            {g.contacts.length > 3 ? ` +${g.contacts.length - 3}` : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCampaign(g)}
                      disabled={g.contacts.length === 0}
                      className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-40 disabled:cursor-not-allowed"
                      title={g.contacts.length === 0 ? 'Ajoutez des contacts à ce groupe d\'abord' : 'Créer une campagne pour ce groupe'}
                    >
                      <Send size={11} /> Créer campagne
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      disabled={deleting === g.id}
                      className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deleting === g.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Aperçu contacts */}
                {g.contacts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.contacts.slice(0, 8).map(c => (
                      <span key={c.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                        {c.first_name} {c.last_name}
                      </span>
                    ))}
                    {g.contacts.length > 8 && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-[#F4511E]">
                        +{g.contacts.length - 8} autres
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DashboardFooter />
    </div>
  )
}
