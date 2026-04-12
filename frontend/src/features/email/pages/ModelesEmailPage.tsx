import { Plus, Search, Star, Trash2, Download } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const filterTabs = ['Tous', 'Newsletter', 'Marketing', 'Événement', 'Transactionnel', 'Relationnel']

const templates = [
  { name: 'Newsletter Moderne', type: 'Newsletter', date: '14/02/2026', starred: true, bg: 'from-blue-400 to-indigo-600' },
  { name: 'Promo Flash', type: 'Marketing', date: '12/02/2026', starred: false, bg: 'from-orange-400 to-red-500' },
  { name: 'Invitation Événement', type: 'Événement', date: '10/02/2026', starred: true, bg: 'from-purple-400 to-pink-500' },
  { name: 'Bienvenue Client', type: 'Transactionnel', date: '08/02/2026', starred: false, bg: 'from-green-400 to-emerald-500' },
  { name: 'Confirmation Commande', type: 'Transactionnel', date: '05/02/2026', starred: false, bg: 'from-cyan-400 to-blue-500' },
  { name: 'Anniversaire', type: 'Relationnel', date: '01/02/2026', starred: true, bg: 'from-pink-400 to-rose-500' },
]

const premiumPacks = [
  { name: 'E-commerce Pack', count: 12 },
  { name: 'SaaS Onboarding', count: 8 },
  { name: 'Event Marketing', count: 10 },
]

const summaryStats = [
  { label: 'Total templates', value: '6' },
  { label: 'Favoris', value: '3' },
  { label: 'Catégories', value: '5' },
  { label: 'Modifiés ce mois', value: '6' },
]

export default function ModelesEmailPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Templates Email</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Bibliothèque de templates professionnels prêts à l'emploi</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
            <Plus size={14} /> Créer un template
          </button>
        </div>

        {/* Summary stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {summaryStats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
              <p className="text-[24px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter tabs */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Rechercher un template..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-[12px] text-gray-700 outline-none"
            />
          </div>
          <div className="flex gap-1.5">
            {filterTabs.map((t, i) => (
              <button
                key={t}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  i === 0 ? 'bg-[#F4511E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {templates.map(({ name, type, date, starred, bg }) => (
            <div key={name} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Preview area */}
              <div className={`relative h-36 bg-gradient-to-br ${bg}`}>
                {starred && (
                  <span className="absolute right-2 top-2 rounded-full bg-yellow-400 p-1">
                    <Star size={12} className="fill-white text-white" />
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">{name}</p>
                  <p className="text-[11px] text-gray-400">{type}</p>
                  <p className="text-[10px] text-gray-300">Modifié le {date}</p>
                </div>
                <button className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Premium packs */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">🎁</span>
            <p className="text-[14px] font-semibold text-[#1F2937]">Templates Premium Recommandés</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {premiumPacks.map(({ name, count }) => (
              <div key={name} className="rounded-xl border border-gray-100 p-4">
                <p className="text-[13px] font-semibold text-[#1F2937]">{name}</p>
                <p className="mt-1 text-[11px] text-[#F4511E]">{count} templates</p>
                <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] py-2 text-[11px] font-semibold text-white hover:bg-blue-700">
                  <Download size={12} /> Télécharger Gratuit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
