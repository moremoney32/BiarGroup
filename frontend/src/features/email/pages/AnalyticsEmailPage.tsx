import { useEffect, useState } from 'react'
import { Download, Send, TrendingUp, Eye, MousePointer, RotateCcw, UserMinus, Loader2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import apiFetch from '../../../services/api'

interface Stats {
  totalSent: number
  totalRecipients: number
  totalFailed: number
  totalCampaigns: number
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubRate: number
  deliverRate: number
}

interface Campaign {
  id: number
  name: string | null
  sujet: string
  total_sent: number
  opens: number
  clicks: number
  unsubscribes: number
}

function fmt(n: number) { return n.toLocaleString('fr-FR') }

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function AnalyticsEmailPage() {
  const [stats, setStats]         = useState<Stats | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [heatmap, setHeatmap]     = useState<number[][] | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes, hRes] = await Promise.all([
          apiFetch.get<{ data: Stats }>('/email/campaigns/stats'),
          apiFetch.get<{ data: Campaign[] }>('/email/campaigns'),
          apiFetch.get<{ data: number[][] }>('/email/analytics/heatmap'),
        ])
        setStats(sRes.data)
        setCampaigns(cRes.data)
        setHeatmap(hRes.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Normalise la matrice brute (clicks) vers 0–1 pour l'affichage couleur
  const normalizedHeatmap = (() => {
    if (!heatmap) return null
    const max = Math.max(...heatmap.flat())
    if (max === 0) return null
    return heatmap.map(row => row.map(v => v / max))
  })()

  const s = stats

  const topStats = [
    { icon: Send,      color: '#3B82F6', bg: '#EFF6FF', label: 'Emails envoyés',     value: s ? fmt(s.totalSent)      : '—' },
    { icon: TrendingUp,color: '#10B981', bg: '#ECFDF5', label: 'Délivrés',           value: s ? `${s.deliverRate}%`   : '—' },
    { icon: Eye,       color: '#8B5CF6', bg: '#F5F3FF', label: "Taux d'ouvert.",     value: s ? `${s.openRate}%`      : '—' },
    { icon: MousePointer,color:'#F4511E',bg: '#FFF7F5', label: 'Taux de clic',       value: s ? `${s.clickRate}%`     : '—' },
    { icon: RotateCcw, color: '#EF4444', bg: '#FEF2F2', label: 'Rebonds',            value: s ? `${s.bounceRate}%`    : '—' },
    { icon: UserMinus, color: '#6B7280', bg: '#F9FAFB', label: 'Désabonnements',     value: s ? `${s.unsubRate}%`     : '—' },
  ]

  const engagementRates = s ? [
    { label: "Taux d'ouverture",      value: s.openRate,    color: '#3B82F6' },
    { label: 'Taux de clic',          value: s.clickRate,   color: '#F4511E' },
    { label: 'Taux de rebond',        value: s.bounceRate,  color: '#EF4444' },
    { label: 'Taux de désabonnement', value: s.unsubRate,   color: '#6B7280' },
    { label: 'Délivrabilité',         value: s.deliverRate, color: '#10B981' },
  ] : []

  // Top campaigns triées par taux d'ouverture
  const topCampaigns = [...campaigns]
    .filter(c => c.total_sent > 0)
    .sort((a, b) => (b.opens / b.total_sent) - (a.opens / a.total_sent))
    .slice(0, 5)

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
        <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {topStats.map(({ icon: Icon, color, bg, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              {loading
                ? <div className="h-5 w-12 animate-pulse rounded bg-gray-100 mb-1" />
                : <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              }
              <p className="mt-0.5 text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          {/* Évolution simulée — visuel uniquement */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Volume des campagnes</p>
            {loading
              ? <div className="h-28 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[#F4511E]" /></div>
              : campaigns.length === 0
                ? <div className="h-28 flex items-center justify-center text-[12px] text-gray-400">Aucune donnée disponible</div>
                : (
                  <div className="flex items-end gap-1 h-28">
                    {campaigns.slice(0, 12).map((c, i) => {
                      const h = campaigns.length > 0 ? Math.max((c.total_sent / Math.max(...campaigns.map(x => x.total_sent || 1))) * 100, 5) : 5
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm bg-[#F4511E]/80 transition-all hover:bg-[#F4511E]"
                          style={{ height: `${h}%` }}
                          title={`${c.name ?? c.sujet} — ${c.total_sent} envois`}
                        />
                      )
                    })}
                  </div>
                )
            }
            <p className="mt-2 text-[10px] text-gray-400">Basé sur {campaigns.length} campagne{campaigns.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Taux d'engagement — données réelles */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Taux d'engagement</p>
            {loading
              ? <div className="h-28 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[#F4511E]" /></div>
              : (
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
              )
            }
          </div>
        </div>

        {/* Heatmap — données réelles depuis email_events */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1F2937]">Heatmap des clics par heure d'envoi</p>
            {!loading && normalizedHeatmap && (
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>Faible</span>
                <div className="flex gap-0.5">
                  {['#F5F5F5', '#FEE2D5', '#FCA28A', '#F4511E'].map(c => (
                    <div key={c} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span>Élevé</span>
              </div>
            )}
          </div>
          {loading ? (
            <div className="flex h-28 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[#F4511E]" />
            </div>
          ) : !normalizedHeatmap ? (
            <div className="flex h-28 items-center justify-center text-[12px] text-gray-400">
              Aucun clic enregistré pour l'instant — envoyez des campagnes avec des liens pour alimenter la heatmap.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="space-y-1 mt-3">
                {/* Labels heures */}
                <div className="flex items-center gap-1 mb-1">
                  <span className="w-14 shrink-0" />
                  <div className="flex gap-0.5">
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="w-4 text-center text-[8px] text-gray-300">
                        {h % 6 === 0 ? `${h}h` : ''}
                      </div>
                    ))}
                  </div>
                </div>
                {normalizedHeatmap.map((row, di) => (
                  <div key={di} className="flex items-center gap-1">
                    <span className="w-14 shrink-0 text-[9px] text-gray-400">{days[di]}</span>
                    <div className="flex gap-0.5">
                      {row.map((v, hi) => {
                        const rawClicks = heatmap![di][hi]
                        return (
                          <div
                            key={hi}
                            className="h-4 w-4 rounded-sm cursor-default"
                            style={{ backgroundColor: v > 0.7 ? '#F4511E' : v > 0.4 ? '#FCA28A' : v > 0.05 ? '#FEE2D5' : '#F5F5F5' }}
                            title={rawClicks > 0 ? `${days[di]} ${hi}h — ${rawClicks} clic${rawClicks > 1 ? 's' : ''}` : ''}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top campagnes — données réelles */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm overflow-hidden">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Top campagnes performantes</p>
          {loading
            ? <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-[#F4511E]" /></div>
            : topCampaigns.length === 0
              ? <p className="py-4 text-center text-[12px] text-gray-400">Envoyez votre première campagne pour voir les stats ici.</p>
              : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Campagne', 'Envoyés', 'Taux ouverture', 'Taux clic', 'Désabo.'].map(h => (
                        <th key={h} className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topCampaigns.map((c, i) => {
                      const openRate  = c.total_sent > 0 ? (c.opens       / c.total_sent * 100).toFixed(1) : '0.0'
                      const clickRate = c.total_sent > 0 ? (c.clicks      / c.total_sent * 100).toFixed(1) : '0.0'
                      const unsubRate = c.total_sent > 0 ? (c.unsubscribes/ c.total_sent * 100).toFixed(1) : '0.0'
                      return (
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5">
                            <span className="mr-2 text-[11px] font-bold text-[#F4511E]">#{i + 1}</span>
                            <span className="text-[12px] text-[#1F2937]">{c.name ?? c.sujet}</span>
                          </td>
                          <td className="py-2.5 text-[12px] text-gray-600">{fmt(c.total_sent)}</td>
                          <td className="py-2.5 text-[12px] font-semibold text-[#F4511E]">{openRate}%</td>
                          <td className="py-2.5 text-[12px] font-semibold text-blue-500">{clickRate}%</td>
                          <td className="py-2.5 text-[12px] font-semibold text-gray-500">{unsubRate}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
          }
        </div>

        {/* Compteurs résumés */}
        {s && (
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ouvertures totales',      value: fmt(s.opens),        color: 'text-[#8B5CF6]' },
              { label: 'Clics totaux',            value: fmt(s.clicks),       color: 'text-[#F4511E]' },
              { label: 'Désabonnements',          value: fmt(s.unsubscribes), color: 'text-gray-500'  },
              { label: 'Campagnes lancées',       value: fmt(s.totalCampaigns),color: 'text-[#10B981]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-gray-100 p-4 shadow-sm text-center">
                <p className={`text-[24px] font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <DashboardFooter />
    </div>
  )
}
