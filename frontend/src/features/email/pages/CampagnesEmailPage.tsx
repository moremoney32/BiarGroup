import { useState } from 'react'
import { Send, Eye, MousePointer, RotateCcw, CheckCircle2, Search, Filter, ArrowUpRight, ArrowDownRight, BarChart3, Users, Zap, TestTube, Monitor, ShieldAlert, Wifi, Star } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const stats = [
  { icon: Send, color: '#3B82F6', bg: '#EFF6FF', label: 'Emails envoyés', value: '9 870', trend: '+12.5%', up: true },
  { icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5', label: 'Taux de délivrabilité', value: '99.5%', trend: '+2.3%', up: true },
  { icon: Eye, color: '#8B5CF6', bg: '#F5F3FF', label: "Taux d'ouverture", value: '40.6%', trend: '+5.8%', up: true },
  { icon: MousePointer, color: '#F4511E', bg: '#FFF7F5', label: 'Taux de clic', value: '9.6%', trend: '+3.2%', up: true },
  { icon: RotateCcw, color: '#EF4444', bg: '#FEF2F2', label: 'Rebonds', value: '47', trend: '-1.2%', up: false },
]

const tabs = ['Vue d\'ensemble', 'Segmentation', 'Éditeur', 'Analytics', 'Délivrabilité']

const campaigns = [
  { name: 'Lancement Royal Tower', sub: 'Découvrez', type: 'Bulk', status: 'Envoyé', statusColor: '#10B981', sent: '5 420', opens: '2 156', opensPct: '39.8%', clicks: '432', clicksPct: '8.0%', rate: 39.8 },
  { name: 'Newsletter Février 2026', sub: 'Vos', type: 'Newsletter', status: 'Envoyé', statusColor: '#10B981', sent: '3 200', opens: '1 850', opensPct: '57.8%', clicks: '520', clicksPct: '16.3%', rate: 57.8 },
  { name: 'Promo Saint-Valentin', sub: 'nOffre', type: 'Bulk', status: 'En cours', statusColor: '#F4511E', sent: '1 250', opens: '0', opensPct: '0.0%', clicks: '0', clicksPct: '0.0%', rate: 0 },
  { name: 'Invitation Webinar Mars', sub: 'nez', type: 'Bulk', status: 'Programmé', statusColor: '#6366F1', sent: '0', opens: '0', opensPct: '0%', clicks: '0', clicksPct: '0%', rate: 0 },
]

const metrics = [
  { label: "Taux d'ouverture", value: '42.3%' },
  { label: 'Taux de clic', value: '18.7%' },
  { label: 'CTDR', value: '44.2%' },
  { label: 'Conversions', value: '8.5%' },
  { label: 'Désabonnements', value: '0.8%' },
  { label: 'Plaintes', value: '0.02%' },
]

export default function CampagnesEmailPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Email Marketing</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gestion complète de vos campagnes email &amp; newsletters</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
              <Star size={13} /> Templates
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50">
              <Zap size={13} /> Automation
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
              + Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-5 gap-3">
          {stats.map(({ icon: Icon, color, bg, label, value, trend, up }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-green-500' : 'text-red-500'}`}>
                  {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {trend}
                </span>
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b border-gray-100">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-px ${
                activeTab === i
                  ? 'border-[#F4511E] text-[#F4511E]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              className="w-full rounded-lg border border-[#F4511E]/30 bg-[#FFF7F5] py-2 pl-8 pr-4 text-[12px] text-gray-700 outline-none focus:ring-2 focus:ring-[#F4511E]/20"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
            <Filter size={13} /> Filtrer
          </button>
        </div>

        {/* Table — Campagnes récentes */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <h2 className="text-[14px] font-semibold text-[#1F2937]">Campagnes récentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne', 'Type', 'Statut', 'Envoyés', 'Ouvertures', 'Clics', 'Taux'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-semibold text-[#1F2937]">{c.name}</p>
                      <p className="text-[11px] text-gray-400">{c.sub}</p>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-600">{c.type}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: c.statusColor }}>
                        ● {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-700">{c.sent}</td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-gray-700">{c.opens}</p>
                      <p className="text-[11px] text-blue-500">{c.opensPct}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-gray-700">{c.clicks}</p>
                      <p className="text-[11px] text-green-500">{c.clicksPct}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-[#F4511E]" style={{ width: `${c.rate}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-gray-600">{c.rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { icon: Send, label: 'Créer une campagne', sub: 'Éditeur drag & drop avec templates professionnels', bg: 'from-blue-400 to-indigo-500' },
            { icon: Users, label: 'Segmentation avancée', sub: 'Ciblage précis basé sur le comportement et données', bg: 'from-purple-400 to-pink-500' },
            { icon: Zap, label: 'Marketing Automation', sub: 'Workflows automatisés, triggers et scénarios', bg: 'from-green-400 to-emerald-500' },
          ].map(({ icon: Icon, label, sub, bg }) => (
            <div key={label} className={`rounded-xl bg-gradient-to-br ${bg} p-5 text-white cursor-pointer hover:opacity-90 transition-opacity`}>
              <Icon size={22} className="mb-3 opacity-90" />
              <p className="text-[13px] font-semibold">{label}</p>
              <p className="mt-1 text-[11px] opacity-80">{sub}</p>
            </div>
          ))}
        </div>

        {/* Optimisation & Automation */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* Optimisation & Tests */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                <TestTube size={15} className="text-[#F4511E]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1F2937]">Optimisation &amp; Tests</p>
                <p className="text-[11px] text-gray-500">Maximisez vos performances</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { icon: TestTube, label: 'A/B Testing', sub: 'Testez sujets, contenus et horaires' },
                { icon: Monitor, label: 'Tests de Rendu', sub: 'Prévisualisation 50+ clients email' },
                { icon: ShieldAlert, label: 'Spam Checker', sub: 'Analyse anti-spam & score délivr.', badge: '9.2/10' },
              ].map(({ icon: Icon, label, sub, badge }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon size={13} className="text-white/80" />
                    <div>
                      <p className="text-[12px] font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-white/70">{sub}</p>
                    </div>
                  </div>
                  {badge && <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
                  <ArrowUpRight size={13} className="text-white/70" />
                </div>
              ))}
            </div>
          </div>

          {/* Automation Intelligente */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                <Zap size={15} className="text-[#F4511E]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1F2937]">Automation Intelligente</p>
                <p className="text-[11px] text-gray-500">Campagnes automatisées 24/7</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Auto-répondeurs', sub: 'Réponses automatiques personnalisées', badge: '12 actifs', badgeColor: 'bg-green-500' },
                { label: 'Emails de Bienvenue', sub: "Séquences d'onboarding auto", badge: '85% ouvert', badgeColor: 'bg-blue-500' },
                { label: 'Drip Campaigns', sub: 'Séquences multi-emails programmées', badge: '8 actives', badgeColor: 'bg-purple-500' },
              ].map(({ label, sub, badge, badgeColor }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2.5">
                  <div>
                    <p className="text-[12px] font-semibold text-white">{label}</p>
                    <p className="text-[10px] text-white/70">{sub}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${badgeColor}`}>{badge}</span>
                    <ArrowUpRight size={13} className="text-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métriques Détaillées */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-[#1F2937]">Métriques Détaillées</p>
              <p className="text-[11px] text-gray-500">Analyse complète de vos performances</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white">
              <BarChart3 size={12} /> Voir tout
            </button>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {metrics.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-[#F4511E] p-3 text-center text-white">
                <p className="text-[18px] font-bold">{value}</p>
                <p className="mt-0.5 text-[10px] opacity-80">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gestion des problèmes */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {/* Bounces */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <RotateCcw size={15} className="text-[#F4511E]" />
              <p className="text-[13px] font-semibold text-[#1F2937]">Gestion des Bounces</p>
            </div>
            <p className="mb-3 text-[11px] text-gray-500">Cette semaine</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                <div>
                  <p className="text-[12px] font-semibold text-white">Hard Bounces</p>
                  <p className="text-[10px] text-white/70">Erreurs permanentes</p>
                </div>
                <span className="text-[18px] font-bold text-white">22</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                <div>
                  <p className="text-[12px] font-semibold text-white">Soft Bounces</p>
                  <p className="text-[10px] text-white/70">Erreurs temporaires</p>
                </div>
                <span className="text-[18px] font-bold text-white">34</span>
              </div>
            </div>
            <button className="mt-3 w-full rounded-lg bg-[#F4511E] py-2 text-[11px] font-semibold text-white hover:bg-[#d9400f]">
              ⚙ Gérer les bounces
            </button>
          </div>

          {/* Désabonnements */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users size={15} className="text-[#F4511E]" />
              <p className="text-[13px] font-semibold text-[#1F2937]">Désabonnements</p>
            </div>
            <p className="mb-1 text-[12px] text-gray-700 font-medium">18 cette semaine</p>
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Taux de désabo — 7 derniers jours</span>
                <span className="font-semibold text-green-500">0.8%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Total désabonnés — Liste complète</span>
                <span className="text-[14px] font-bold text-[#1F2937]">1 234</span>
              </div>
            </div>
            <button className="w-full rounded-lg bg-[#F4511E] py-2 text-[11px] font-semibold text-white hover:bg-[#d9400f]">
              ⚙ Gérer les désabonnements
            </button>
          </div>

          {/* Plaintes Spam */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert size={15} className="text-[#F4511E]" />
              <p className="text-[13px] font-semibold text-[#1F2937]">Plaintes Spam</p>
            </div>
            <p className="mb-1 text-[12px] text-gray-700 font-medium">2 cette semaine</p>
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Taux de plainte — 7 derniers jours</span>
                <span className="font-semibold text-green-500">0.02%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Total plaintes — Tous temps</span>
                <span className="text-[14px] font-bold text-[#1F2937]">45</span>
              </div>
            </div>
            <button className="w-full rounded-lg bg-[#F4511E] py-2 text-[11px] font-semibold text-white hover:bg-[#d9400f]">
              ⚙ Gérer les plaintes
            </button>
          </div>
        </div>

        {/* Infrastructure & Monitoring */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <Wifi size={15} className="text-[#F4511E]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1F2937]">Infrastructure &amp; Monitoring</p>
              <p className="text-[11px] text-gray-500">Gestion de la délivrabilité et des webhooks</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* IP Dédiées */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#1F2937]">IP Dédiées</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">3 actives</span>
              </div>
              <div className="mb-3 space-y-1 text-[11px] text-gray-600">
                <p>• 192.168.1.45 — Score: 95/100</p>
                <p>• 192.168.1.46 — Score: 98/100</p>
                <p>• 192.168.1.47 — Score: 92/100</p>
              </div>
              <button className="text-[11px] font-semibold text-[#F4511E] hover:underline">Gérer les IP →</button>
            </div>

            {/* Réputation */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#1F2937]">Réputation</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">Excellente</span>
              </div>
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Score global</span>
                  <span className="font-bold text-[#1F2937]">95/100</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#F4511E]" style={{ width: '95%' }} />
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded bg-[#F4511E] px-2 py-0.5 text-[10px] font-semibold text-white">Inbox</span>
                  <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Spam</span>
                </div>
              </div>
              <button className="text-[11px] font-semibold text-[#F4511E] hover:underline">Voir les détails →</button>
            </div>

            {/* Webhooks */}
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#1F2937]">Webhooks</p>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">6 actifs</span>
              </div>
              <div className="mb-3 space-y-1 text-[11px] text-gray-600">
                <p>• Delivery events (5.2K/jour)</p>
                <p>• Open events (8.7K/jour)</p>
                <p>• Click events (2.1K/jour)</p>
              </div>
              <button className="text-[11px] font-semibold text-[#F4511E] hover:underline">Configurer →</button>
            </div>
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
