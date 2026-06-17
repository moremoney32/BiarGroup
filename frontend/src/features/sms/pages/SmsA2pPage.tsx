import { useState } from 'react'
import { Plus, Send, CheckCircle2, XCircle, DollarSign, Search, Filter, Download, MoreVertical } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const TABS = ['Campagnes A2P', 'Fournisseurs', 'Conformité'] as const
type Tab = typeof TABS[number]

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  promotional:   { bg: '#EFF6FF', text: '#2563EB' },
  otp:           { bg: '#F0FDF4', text: '#16A34A' },
  transactional: { bg: '#F5F3FF', text: '#7C3AED' },
}

const mockCampagnes = [
  { id: 1, nom: 'Promo Black Friday 2026', date: '2026-02-20', type: 'promotional',   emetteur: 'BIARGROUP', envoyes: 15620, livres: 15380, echecs: 240,  cout: '$1 234.50', statut: 'Terminé' },
  { id: 2, nom: 'Codes OTP Banking',       date: '2026-02-18', type: 'otp',           emetteur: 'BIARGROUP', envoyes: 8750,  livres: 8720,  echecs: 30,   cout: '$875.00',   statut: 'Actif'   },
  { id: 3, nom: 'Notifications Livraison', date: '2026-02-15', type: 'transactional', emetteur: 'INFO',      envoyes: 3040,  livres: 3010,  echecs: 30,   cout: '$324.00',   statut: 'Actif'   },
]

const STATUT_STYLE: Record<string, { bg: string; text: string }> = {
  'Terminé': { bg: '#F3F4F6', text: '#6B7280' },
  'Actif':   { bg: '#F0FDF4', text: '#16A34A' },
  'Pause':   { bg: '#FFF7ED', text: '#EA580C' },
}

export default function SmsA2pPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Campagnes A2P')
  const [search, setSearch]       = useState('')

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-1">📱</span>SMS A2P (Application-to-Person)
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gestion professionnelle des campagnes SMS entreprise vers particuliers</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              Gérer les Émetteurs
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Nouvelle Campagne A2P
            </button>
          </div>
        </div>

        {/* Banner certifié */}
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[16px]">🛡</span>
            <p className="text-[15px] font-bold text-white">SMS A2P - Messaging Professionnel Certifié</p>
          </div>
          <p className="mb-4 text-[11px] text-white/80">
            Application-To-Person pour vos campagnes professionnelles à grande échelle. Routage direct opérateurs, conformité GSMA, taux de livraison optimum.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: '⚡', label: 'Routage Direct',    sub: 'Connexions opérateurs' },
              { icon: '📈', label: 'Haute Performance', sub: '800+ messages/seconde' },
              { icon: '✅', label: 'Conforme GSMA',     sub: 'Standards internationaux' },
              { icon: '💰', label: 'Taux Optimal',      sub: '98%+ de livraison' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="rounded-xl bg-white/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[13px]">{icon}</span>
                  <span className="text-[11px] font-bold text-white">{label}</span>
                </div>
                <p className="text-[10px] text-white/70">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés', value: '27 410' },
            { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Livrés',           value: '27 110' },
            { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Taux de Livraison', value: '98.9%' },
            { icon: DollarSign,   bg: '#FFF7ED', color: '#F97316', label: 'Coût Total',        value: '2 433.50 $' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-0 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13px] font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Campagnes A2P' && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#FFEEE6] px-3 py-2 ring-1 ring-orange-200 max-w-xs">
                <Search size={13} className="text-orange-300" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="flex-1 bg-transparent text-[12px] text-[#1F2937] outline-none placeholder-orange-300"
                />
              </div>
              <div className="flex gap-2 ml-3">
                <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-50">
                  <Filter size={12} /> Filtrer
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border border-[#F4511E] px-3 py-2 text-[11px] font-semibold text-[#F4511E] hover:bg-orange-50">
                  <Download size={12} /> Exporter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/60">
                    {['Campagne','Type','Émetteur','Envoyés','Livrés','Échecs','Coût','Statut',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockCampagnes.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())).map(c => {
                    const ts = TYPE_STYLE[c.type] ?? { bg: '#F9FAFB', text: '#6B7280' }
                    const ss = STATUT_STYLE[c.statut] ?? { bg: '#F9FAFB', text: '#6B7280' }
                    return (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-semibold text-[#1F2937]">{c.nom}</p>
                          <p className="text-[10px] text-gray-400">{c.date}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize"
                            style={{ backgroundColor: ts.bg, color: ts.text }}>{c.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-[#FFEEE6] px-2 py-1 text-[10px] font-bold text-[#F4511E]">{c.emetteur}</span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-gray-700">{c.envoyes.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-[12px] text-[#22C55E] font-semibold">{c.livres.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-[12px] text-[#EF4444] font-semibold">{c.echecs}</td>
                        <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{c.cout}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: ss.bg, color: ss.text }}>{c.statut}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="rounded p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100"><MoreVertical size={14} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab !== 'Campagnes A2P' && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-[14px] font-semibold text-gray-500">{activeTab}</p>
            <p className="mt-1 text-[12px]">Cette section sera disponible prochainement</p>
          </div>
        )}

      </div>
      <DashboardFooter />
    </div>
  )
}
