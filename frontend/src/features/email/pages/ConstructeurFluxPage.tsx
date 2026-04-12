import { Plus, Users, Eye, Copy, Settings, Trash2, Play } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const whyItems = [
  { label: 'Email Drip', sub: 'Séquences goutte-à-goutte', color: 'text-[#F4511E]' },
  { label: 'Comportemental', sub: 'Basé sur les actions', color: 'text-green-500' },
  { label: 'A/B Testing', sub: 'Optimisation continue', color: 'text-blue-500' },
  { label: 'Analytics', sub: 'Suivi en temps réel', color: 'text-purple-500' },
]

const summaryStats = [
  { label: 'Flows actifs', value: '2' },
  { label: 'Total contacts', value: '2 270' },
  { label: "Taux d'ouverture", value: '77.0%' },
  { label: 'Total clics', value: '813' },
]

const predefinedFlows = [
  { icon: '🚀', name: 'Lead Nurturing B2B', desc: '7 emails éducatifs sur 21 jours', steps: 12, conv: '18%' },
  { icon: '🎓', name: 'Onboarding SaaS', desc: 'Formation progressive utilisateur', steps: 9, conv: '85%' },
  { icon: '🔄', name: 'Réengagement Inactifs', desc: 'Reconquête avec offres ciblées', steps: 6, conv: '22%' },
  { icon: '🛒', name: 'Panier Abandonné E-commerce', desc: 'Relance avec urgence et promo', steps: 5, conv: '35%' },
  { icon: '📰', name: 'Newsletter Automation', desc: 'Contenu personnalisé hebdo', steps: 8, conv: '42%' },
  { icon: '🎁', name: 'Programme VIP', desc: 'Parcours clients premium', steps: 11, conv: '78%' },
]

const myFlows = [
  { name: 'Nurturing Lead B2B', status: 'Actif', statusColor: 'bg-green-500', nodes: '12 nœuds', contacts: 850, opens: 612, clicks: 245, rate: '72.0%' },
  { name: 'Onboarding Client', status: 'Actif', statusColor: 'bg-green-500', nodes: '9 nœuds', contacts: 1420, opens: 1136, clicks: 568, rate: '80.0%' },
  { name: 'Réactivation Inactifs', status: 'Brouillon', statusColor: 'bg-gray-400', nodes: '6 nœuds', contacts: 0, opens: 0, clicks: 0, rate: '0%' },
]

export default function ConstructeurFluxPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <h1 className="text-[22px] font-bold text-[#1F2937]">Email Flow Builder</h1>
              <p className="mt-0.5 text-[13px] text-gray-500">Créez des campagnes email automatisées intelligentes avec l'éditeur visuel</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
            <Plus size={14} /> Créer un Flow
          </button>
        </div>

        {/* Why use flows */}
        <div className="mb-5 rounded-xl border border-[#F4511E]/20 bg-orange-50/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">⚡</span>
            <p className="text-[13px] font-semibold text-[#1F2937]">Pourquoi utiliser les Email Flows ?</p>
          </div>
          <p className="mb-3 text-[12px] text-gray-600">
            Les <span className="font-semibold text-[#F4511E]">Email Flows</span> automatisent vos campagnes marketing et augmentent drastiquement vos conversions grâce à des parcours personnalisés.
          </p>
          <div className="grid grid-cols-4 gap-3">
            {whyItems.map(({ label, sub, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold ${color}`}>● {label}</span>
                <span className="text-[10px] text-gray-500">{sub}</span>
              </div>
            ))}
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

        {/* Predefined flows */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">📋</span>
            <p className="text-[14px] font-semibold text-[#1F2937]">Templates de Flow Email prédéfinis</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {predefinedFlows.map(({ icon, name, desc, steps, conv }) => (
              <div key={name} className="rounded-xl border border-gray-100 p-4 hover:border-[#F4511E]/30 transition-colors">
                <span className="text-xl">{icon}</span>
                <p className="mt-2 text-[12px] font-semibold text-[#1F2937]">{name}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{desc}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-[#F4511E]">{steps} étapes</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">{conv} conversion</span>
                </div>
                <button className="mt-3 w-full rounded-lg border border-gray-200 py-1.5 text-[11px] font-medium text-gray-600 hover:border-[#F4511E] hover:text-[#F4511E] transition-colors">
                  Utiliser ce template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mes Flows */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Mes Flows Email</p>
          <div className="space-y-4">
            {myFlows.map(({ name, status, statusColor, nodes, contacts, opens, clicks, rate }) => (
              <div key={name} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-[13px] font-semibold text-[#1F2937]">{name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${statusColor}`}>{status}</span>
                  </div>
                </div>
                <p className="mb-3 text-[11px] text-gray-500">Séquence d'automatisation email</p>
                <div className="mb-3 grid grid-cols-5 gap-4 text-[11px]">
                  <div><p className="text-gray-400">Étapes</p><p className="font-bold text-[#1F2937]">{nodes}</p></div>
                  <div><p className="text-gray-400">Contacts</p><p className="font-bold text-[#1F2937]">{contacts}</p></div>
                  <div><p className="text-gray-400">Ouvertures</p><p className="font-bold text-blue-500">{opens}</p></div>
                  <div><p className="text-gray-400">Clics</p><p className="font-bold text-green-500">{clicks}</p></div>
                  <div><p className="text-gray-400">Taux ouverture</p><p className="font-bold text-[#F4511E]">{rate}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f]">Modifier</button>
                  <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"><Eye size={13} /></button>
                  <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"><Copy size={13} /></button>
                  <button className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50"><Play size={13} /></button>
                  <button className="rounded-lg border border-gray-200 p-1.5 text-red-300 hover:bg-red-50"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
