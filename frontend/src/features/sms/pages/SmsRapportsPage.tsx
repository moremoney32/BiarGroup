import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  BarChart2, TrendingUp, Globe, RefreshCw, Download,
  MessageSquare, CheckCircle2, XCircle, Activity, Clock, Award,
} from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface RapportsData {
  byDayOfWeek: { day: string; sent: number; delivered: number; failed: number }[]
  statusDistribution: { delivered: number; pending: number; failed: number; rejected: number }
  byHour: { hour: string; count: number }[]
  engagementRate: { day: string; ouverture: number; clic: number; conversion: number }[]
  byCountry: { country: string; count: number }[]
  topCampaigns: { name: string; sent: number; delivered: number; openRate: number | null; clickRate: number | null; revenue: number | null }[]
}

interface AnalyticsKpis {
  totalSms: number
  successRate: number
  uniqueRecipients: number
  totalCost: number
}

const COUNTRY_COLORS = ['#F4511E', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#8B5CF6', '#06B6D4']

export default function SmsRapportsPage() {
  const [data, setData] = useState<RapportsData | null>(null)
  const [kpis, setKpis] = useState<AnalyticsKpis | null>(null)
  const [avgDeliveryMs, setAvgMs] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7j')

  const load = async () => {
    setLoading(true)
    try {
      const [r, k, d] = await Promise.all([
        api.get<{ data: RapportsData }>(`/sms/analytics/rapports?period=${period}`),
        api.get<{ data: AnalyticsKpis }>('/sms/analytics/kpis').catch(() => null),
        api.get<{ data: { kpis: { avgTimeMs: number } } }>('/sms/analytics/dlr').catch(() => null),
      ])
      setData(r.data)
      if (k) setKpis(k.data)
      if (d) setAvgMs(d.data.kpis.avgTimeMs)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  const pieData = data
    ? [
        { name: 'Délivrés',   value: data.statusDistribution.delivered },
        { name: 'En attente', value: data.statusDistribution.pending },
        { name: 'Échecs',     value: data.statusDistribution.failed },
        { name: 'Rejetés',    value: data.statusDistribution.rejected },
      ].filter(d => d.value > 0)
    : []

  const totalStatus = pieData.reduce((s, d) => s + d.value, 0)

  const totalSent  = kpis?.totalSms ?? 0
  const delivered  = data?.statusDistribution.delivered ?? 0
  const failed     = (data?.statusDistribution.failed ?? 0) + (data?.statusDistribution.rejected ?? 0)
  const failedPct  = totalSent > 0 ? Math.round((failed / totalSent) * 1000) / 10 : 0

  // Ouverture/clic non trackés pour le SMS standard : tout à zéro = pas de donnée, on affiche "—"
  const engagement = data?.engagementRate ?? []
  const hasEngagement = engagement.some(e => e.ouverture > 0 || e.clic > 0 || e.conversion > 0)
  const avgOuverture = hasEngagement
    ? Math.round(engagement.reduce((s, e) => s + e.ouverture, 0) / engagement.length * 10) / 10
    : null
  const avgClic = hasEngagement
    ? Math.round(engagement.reduce((s, e) => s + e.clic, 0) / engagement.length * 10) / 10
    : null
  const avgDeliverySec = avgDeliveryMs !== null ? Math.round(avgDeliveryMs / 100) / 10 : null

  function exportCsv() {
    if (!data) return
    const header = 'Campagne;Envoyés;Délivrés;Taux ouverture %;Taux clic %'
    const rows = data.topCampaigns.map(c =>
      [`"${c.name.replace(/"/g, '""')}"`, c.sent, c.delivered, c.openRate ?? '—', c.clickRate ?? '—'].join(';')
    ).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rapports-sms-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
            <BarChart2 size={22} className="text-[#F4511E]" />
            Rapports SMS Détaillés
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Analyses complètes de vos campagnes SMS</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-medium text-gray-700 focus:border-[#F4511E] focus:outline-none"
          >
            <option value="7j">Cette semaine</option>
            <option value="30j">Ce mois</option>
            <option value="90j">3 derniers mois</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50"
          >
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI — cartes pleines couleurs (maquette) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: MessageSquare,
            gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            label: 'Total Envoyés',
            value: loading ? '…' : totalSent.toLocaleString('fr-FR'),
            sub: 'sur la période sélectionnée',
          },
          {
            icon: CheckCircle2,
            gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
            label: 'Délivrés',
            value: loading ? '…' : delivered.toLocaleString('fr-FR'),
            sub: kpis ? `${kpis.successRate}% taux de réussite` : '—',
          },
          {
            icon: XCircle,
            gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
            label: 'Échecs',
            value: loading ? '…' : failed.toLocaleString('fr-FR'),
            sub: `${failedPct}% du total`,
          },
          {
            icon: Activity,
            gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            label: 'Coût Total',
            value: kpis ? `$${kpis.totalCost.toFixed(2)}` : '—',
            sub: avgDeliverySec !== null ? `Livraison moy: ${avgDeliverySec}s` : 'Livraison moy: —',
          },
        ].map(({ icon: Icon, gradient, label, value, sub }) => (
          <div key={label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: gradient }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] text-white/85">{label}</p>
                <p className="mt-1 text-[24px] font-bold">{value}</p>
              </div>
              <Icon size={30} className="text-white/40" />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-white/85">
              <Clock size={10} /> {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Cartes à barre de progression (maquette) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Taux d'Ouverture", icon: Activity, color: '#2563EB',
            value: avgOuverture !== null ? `${avgOuverture}%` : '—',
            pct: avgOuverture ?? 0,
            sub: 'moyenne sur la période',
          },
          {
            label: 'Taux de Clic', icon: TrendingUp, color: '#8B5CF6',
            value: avgClic !== null ? `${avgClic}%` : '—',
            pct: avgClic ?? 0,
            sub: 'moyenne sur la période',
          },
          {
            label: 'Temps Moyen de Livraison', icon: Clock, color: '#16A34A',
            value: avgDeliverySec !== null ? `${avgDeliverySec}s` : '—',
            pct: avgDeliverySec !== null ? Math.min(100, 100 - avgDeliverySec * 10) : 0,
            sub: avgDeliverySec !== null && avgDeliverySec <= 3 ? 'Performance excellente' : 'Mesuré via les DLR',
          },
        ].map(({ label, icon: Icon, color, value, pct, sub }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#1F2937]">{label}</p>
              <Icon size={15} style={{ color }} />
            </div>
            <p className="mt-2 text-[26px] font-bold" style={{ color }}>{value}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <BarChart2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Statistiques de la semaine */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <BarChart2 size={14} className="text-[#F4511E]" />
                Statistiques de la Semaine
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.byDayOfWeek} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sent"      name="envoyés"  fill="#3B82F6" radius={[4,4,0,0]} />
                  <Bar dataKey="delivered" name="délivrés" fill="#10B981" radius={[4,4,0,0]} />
                  <Bar dataKey="failed"    name="échecs"   fill="#EF4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution par statut */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Activity size={14} className="text-[#F4511E]" />
                Distribution par Statut
              </h2>
              {pieData.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-xs text-gray-600">
                          {d.name}: {totalStatus > 0 ? Math.round((d.value / totalStatus) * 1000) / 10 : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">Aucun message envoyé</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Activité par heure (aujourd'hui) */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <Clock size={14} className="text-[#F4511E]" />
                Activité par Heure (Aujourd'hui)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Messages" fill="#F4511E" stroke="#F4511E" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Taux d'engagement */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
                <TrendingUp size={14} className="text-[#F4511E]" />
                Taux d'Engagement
              </h2>
              {hasEngagement ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.engagementRate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="ouverture"  name="ouverture"  fill="#3B82F6" stroke="#3B82F6" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="clic"       name="clic"       fill="#EC4899" stroke="#EC4899" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="conversion" name="conversion" fill="#10B981" stroke="#10B981" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center rounded-xl bg-gray-50 px-6 text-center text-[12px] text-gray-400">
                  Le SMS standard ne permet pas de tracker l'ouverture — l'engagement sera alimenté par les clics des liens courts et les accusés de lecture RCS
                </div>
              )}
            </div>
          </div>

          {/* Distribution géographique */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <Globe size={14} className="text-[#F4511E]" />
              Distribution Géographique
            </h2>
            {data.byCountry.length > 0 ? (
              <div className="space-y-3">
                {data.byCountry.map((c, i) => {
                  const maxVal = data.byCountry[0]?.count || 1
                  const pct = Math.round((c.count / maxVal) * 100)
                  return (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="w-32 truncate text-[12px] text-gray-600">{c.country}</span>
                      <div className="flex-1 rounded-full bg-gray-100" style={{ height: 22 }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }} />
                      </div>
                      <span className="w-14 text-right text-[12px] font-semibold text-gray-600">{c.count.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Aucune donnée géo disponible</p>
            )}
          </div>

          {/* Top campagnes performantes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-bold text-[#1F2937]">
              <Award size={14} className="text-[#F4511E]" />
              Top Campagnes Performantes
            </h2>
            {data.topCampaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Campagne</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500">Envoyés</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500">Délivrés</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Taux d'Ouverture</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Taux de Clic</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-500">Revenu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.topCampaigns.map(c => (
                      <tr key={c.name}>
                        <td className="px-3 py-2.5 font-semibold text-gray-700 max-w-[160px] truncate">{c.name}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{c.sent.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#16A34A]">{c.delivered.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          {c.openRate != null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${Math.min(100, c.openRate)}%` }} />
                              </div>
                              <span className="font-semibold text-[#2563EB]">{c.openRate}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {c.clickRate != null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${Math.min(100, c.clickRate)}%` }} />
                              </div>
                              <span className="font-semibold text-[#7C3AED]">{c.clickRate}%</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-[#16A34A]">
                          {c.revenue != null ? `$${c.revenue.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Aucune campagne terminée</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}
