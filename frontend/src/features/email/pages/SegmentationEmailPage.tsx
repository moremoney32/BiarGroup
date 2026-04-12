import { Upload, Plus, Download, Edit, Trash2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const summaryStats = [
  { label: 'Total contacts', value: '6 845' },
  { label: 'Segments actifs', value: '4' },
  { label: 'Engagement moyen', value: '42%' },
  { label: 'Nouveaux contacts', value: '+125' },
]

const quickSegments = [
  { icon: '📍', label: 'Par localisation', count: '12 critères' },
  { icon: '📅', label: "Par date d'inscription", count: '8 critères' },
  { icon: '🛒', label: 'Par achat', count: '15 critères' },
  { icon: '✉', label: 'Par engagement email', count: '9 critères' },
  { icon: '📊', label: 'Par score lead', count: '10 critères' },
  { icon: '👥', label: 'Par démographie', count: '12 critères' },
]

const mySegments = [
  {
    name: 'Investisseurs VIP',
    type: 'Dynamique',
    typeColor: 'bg-blue-500',
    contacts: 245,
    desc: "Clients ayant investi > 50 000 USD",
    tags: ['Investissement > 50000', 'Statut = VIP', 'Kinshasa'],
    date: '15/02/2026',
  },
  {
    name: 'Prospects immobilier',
    type: 'Dynamique',
    typeColor: 'bg-blue-500',
    contacts: 1240,
    desc: 'Leads intéressés par Royal Tower',
    tags: ['Intérêt = Immobilier', 'A ouvert 3+ emails', 'Pas encore client'],
    date: '14/02/2026',
  },
  {
    name: 'Newsletter abonnés',
    type: 'Statique',
    typeColor: 'bg-gray-500',
    contacts: 3850,
    desc: 'Tous les abonnés newsletter actifs',
    tags: ['Newsletter = Oui', 'Opt-in = Validé'],
    date: '01/02/2026',
  },
  {
    name: 'Clients inactifs',
    type: 'Dynamique',
    typeColor: 'bg-blue-500',
    contacts: 520,
    desc: "Aucune ouverture depuis 60 jours",
    tags: ['Dernière ouverture > 60 jours', 'Client = Oui'],
    date: '10/02/2026',
  },
]

export default function SegmentationEmailPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Segmentation Avancée</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Créez des segments ciblés pour des campagnes personnalisées</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Upload size={13} /> Importer
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
              <Plus size={14} /> Nouveau segment
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {summaryStats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <p className="text-[24px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Segmentation rapide */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Segmentation rapide</p>
          <div className="grid grid-cols-3 gap-3">
            {quickSegments.map(({ icon, label, count }) => (
              <button
                key={label}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-left hover:border-[#F4511E]/30 hover:bg-orange-50/50 transition-colors"
              >
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">{label}</p>
                  <p className="text-[10px] text-gray-400">{count}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mes segments */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-[#1F2937]">Mes segments</p>
            <div className="relative">
              <input
                placeholder="Rechercher un segment..."
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-600 outline-none w-48"
              />
            </div>
          </div>
          <div className="space-y-3">
            {mySegments.map(({ name, type, typeColor, contacts, desc, tags, date }) => (
              <div key={name} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#1F2937]">{name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${typeColor}`}>{type}</span>
                    <span className="text-[12px] text-gray-500">{contacts} contacts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50">Modifier</button>
                    <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"><Download size={12} /></button>
                    <button className="rounded-lg bg-[#F4511E] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#d9400f]">Créer campagne</button>
                  </div>
                </div>
                <p className="mb-2 text-[11px] text-gray-500">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-[#F4511E]">{tag}</span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-gray-400">Mis à jour le {date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
