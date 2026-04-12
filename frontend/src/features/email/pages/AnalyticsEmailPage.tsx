import { Download, Send, TrendingUp, Eye, MousePointer, RotateCcw, UserMinus } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const topStats = [
  { icon: Send, color: '#3B82F6', bg: '#EFF6FF', label: 'Emails envoyés', value: '9 870', trend: '+15%', up: true },
  { icon: TrendingUp, color: '#10B981', bg: '#ECFDF5', label: 'Délivrés', value: '98.2%', trend: '-1.2%', up: false },
  { icon: Eye, color: '#8B5CF6', bg: '#F5F3FF', label: "Taux d'ouvert.", value: '38.5%', trend: '+3.5%', up: true },
  { icon: MousePointer, color: '#F4511E', bg: '#FFF7F5', label: 'Taux de clic', value: '8.2%', trend: '+1.8%', up: true },
  { icon: RotateCcw, color: '#EF4444', bg: '#FEF2F2', label: 'Rebonds', value: '1.8%', trend: '-0.5%', up: false },
  { icon: UserMinus, color: '#6B7280', bg: '#F9FAFB', label: 'Désabonnements', value: '0.3%', trend: '-0.1%', up: false },
]

const engagementRates = [
  { label: "Taux d'ouverture", value: 38.5, color: '#3B82F6' },
  { label: 'Taux de clic', value: 8.2, color: '#F4511E' },
  { label: 'Taux de conversion', value: 2.8, color: '#8B5CF6' },
  { label: 'Taux de rebond', value: 1.8, color: '#EF4444' },
  { label: 'Taux de désabonnement', value: 0.3, color: '#6B7280' },
]

const topCampaigns = [
  { rank: 1, name: 'Lancement Royal Tower', sent: 5420, open: '45.2%', click: '12.5%', conv: '3.8%', roi: '420%' },
  { rank: 2, name: 'Promo Saint-Valentin', sent: 3200, open: '42.8%', click: '10.2%', conv: '3.2%', roi: '385%' },
  { rank: 3, name: 'Newsletter Février', sent: 3850, open: '38.5%', click: '8.9%', conv: '2.5%', roi: '340%' },
  { rank: 4, name: 'Invitation Webinar', sent: 2100, open: '52.3%', click: '15.8%', conv: '8.2%', roi: '580%' },
  { rank: 5, name: 'Relance Prospects', sent: 1850, open: '35.2%', click: '7.5%', conv: '2.1%', roi: '280%' },
]

const segmentEngagement = [
  { label: 'Investisseurs VIP', contacts: 245, pct: 85, color: '#3B82F6' },
  { label: 'Prospects immobilier', contacts: 1240, pct: 62, color: '#F4511E' },
  { label: 'Newsletter abonnés', contacts: 3850, pct: 48, color: '#10B981' },
  { label: 'Clients inactifs', contacts: 520, pct: 15, color: '#6B7280' },
]

const devices = [
  { label: 'Mobile', opens: '6 120 ouvertures', color: 'bg-[#F4511E]' },
  { label: 'Desktop', opens: '2 760 ouvertures', color: 'bg-[#F4511E]' },
  { label: 'Webmail', opens: '980 ouvertures', color: 'bg-[#F4511E]' },
]

const heatmapHours = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, h) => Math.random())
)
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function AnalyticsEmailPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Analytics Email</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Analyses détaillées des performances de vos campagnes email</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
            <Download size={13} /> Exporter
          </button>
        </div>

        {/* Top stats */}
        <div className="mb-5 grid grid-cols-6 gap-3">
          {topStats.map(({ icon: Icon, color, bg, label, value, trend, up }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span className={`text-[10px] font-semibold ${up ? 'text-green-500' : 'text-red-500'}`}>{trend}</span>
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          {/* Évolution des envois */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Évolution des envois</p>
            <div className="flex items-end gap-1 h-28">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-[#F4511E]/80 transition-all hover:bg-[#F4511E]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400">
              <span>Semaine 1</span>
              <span>Semaine 2</span>
            </div>
          </div>

          {/* Taux d'engagement */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Taux d'engagement</p>
            <div className="space-y-3">
              {engagementRates.map(({ label, value, color }) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-[#1F2937]">{value}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value * 2, 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-[13px] font-semibold text-[#1F2937]">Heatmap des clics par heure d'envoi</p>
          <div className="overflow-x-auto">
            <div className="space-y-1">
              {heatmapHours.map((row, di) => (
                <div key={di} className="flex items-center gap-1">
                  <span className="w-14 shrink-0 text-[9px] text-gray-400">{days[di]}</span>
                  <div className="flex gap-0.5">
                    {row.slice(0, 24).map((v, hi) => (
                      <div
                        key={hi}
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: v > 0.7 ? '#F4511E' : v > 0.4 ? '#FCA28A' : v > 0.1 ? '#FEE2D5' : '#F5F5F5' }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[10px] text-green-600">✓ Meilleurs moments : Mardi 10h-12h, Jeudi 14h-16h</p>
        </div>

        {/* Top 5 campagnes */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm overflow-hidden">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Top 5 campagnes performantes</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Campagne', 'Envoyés', 'Taux ouverture', 'Taux clic', 'Conversions', 'ROI'].map(h => (
                  <th key={h} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map(({ rank, name, sent, open, click, conv, roi }) => (
                <tr key={rank} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5">
                    <span className="mr-2 text-[11px] font-bold text-[#F4511E]">#{rank}</span>
                    <span className="text-[12px] text-[#1F2937]">{name}</span>
                  </td>
                  <td className="py-2.5 text-[12px] text-gray-600">{sent.toLocaleString()}</td>
                  <td className="py-2.5 text-[12px] font-semibold text-[#F4511E]">{open}</td>
                  <td className="py-2.5 text-[12px] font-semibold text-blue-500">{click}</td>
                  <td className="py-2.5 text-[12px] font-semibold text-purple-500">{conv}</td>
                  <td className="py-2.5 text-[12px] font-bold text-[#F4511E]">{roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Engagement par segment + Appareils */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Engagement par segment</p>
            <div className="space-y-3">
              {segmentEngagement.map(({ label, contacts, pct, color }) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-gray-700">{label} <span className="text-gray-400">({contacts} contacts)</span></span>
                    <span className="font-bold text-[#1F2937]">{pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Appareils d'ouverture</p>
            <div className="space-y-2">
              {devices.map(({ label, opens, color }) => (
                <div key={label} className={`flex items-center justify-between rounded-lg ${color} px-4 py-3`}>
                  <p className="text-[12px] font-semibold text-white">{label}</p>
                  <p className="text-[11px] text-white/80">{opens}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-green-600">✓ Optimisez vos emails pour mobile (62% des ouvertures)</p>
          </div>
        </div>

        {/* Recommandations IA */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">🤖</span>
            <p className="text-[13px] font-semibold text-[#1F2937]">Recommandations IA</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Meilleur moment d'envoi", value: 'Mardi 10h-12h', sub: '+15% ouverture', color: 'text-[#F4511E]' },
              { label: 'Objet recommandé', value: 'Questions + Emojis', sub: '+22% engagement', color: 'text-[#F4511E]' },
              { label: 'Fréquence optimale', value: '2-3 emails/semaine', sub: '-8% désabonnements', color: 'text-[#F4511E]' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-xl border border-gray-100 p-4">
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className={`mt-1 text-[16px] font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-[10px] text-green-600">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
