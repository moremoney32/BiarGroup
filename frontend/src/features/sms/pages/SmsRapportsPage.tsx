import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart2, TrendingUp, Globe, Users, RefreshCw } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const COLORS = ['#E91E8C', '#3B2F8F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface RapportsData {
  byDayOfWeek: { day: string; sent: number; delivered: number; failed: number }[]
  statusDistribution: { delivered: number; pending: number; failed: number; rejected: number }
  byHour: { hour: string; count: number }[]
  engagementRate: { day: string; ouverture: number; clic: number; conversion: number }[]
  byCountry: { country: string; count: number }[]
  topCampaigns: { name: string; sent: number; delivered: number; openRate: number; clickRate: number }[]
}

export default function SmsRapportsPage() {
  const [data, setData] = useState<RapportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30j')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get<{ data: RapportsData }>(`/sms/analytics/rapports?period=${period}`)
      setData(r.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [period])

  const pieData = data
    ? [
        { name: 'Délivrés',   value: data.statusDistribution.delivered },
        { name: 'En attente', value: data.statusDistribution.pending },
        { name: 'Échecs',     value: data.statusDistribution.failed },
        { name: 'Rejetés',    value: data.statusDistribution.rejected },
      ].filter(d => d.value > 0)
    : []

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rapports SMS</h1>
          <p className="text-sm text-gray-500">Analyse détaillée des performances de vos campagnes</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-[#E91E8C] focus:outline-none"
          >
            <option value="7j">7 derniers jours</option>
            <option value="30j">30 derniers jours</option>
            <option value="90j">90 derniers jours</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <BarChart2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Envois par jour de la semaine */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Envois par jour de la semaine</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byDayOfWeek} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="sent"      name="Envoyés"  fill="#3B2F8F" radius={[4,4,0,0]} />
                <Bar dataKey="delivered" name="Livrés"   fill="#E91E8C" radius={[4,4,0,0]} />
                <Bar dataKey="failed"    name="Échecs"   fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribution des statuts */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Distribution des statuts</h2>
              {pieData.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-xs text-gray-600">{d.name} ({d.value.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">Aucun message envoyé</p>
              )}
            </div>

            {/* Taux d'engagement hebdomadaire */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#E91E8C]" />
                Taux d'engagement (%)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.engagementRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="ouverture"  name="Ouverture %"  fill="#E91E8C" stroke="#E91E8C" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="clic"       name="Clic %"       fill="#3B2F8F" stroke="#3B2F8F" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="conversion" name="Conversion %" fill="#10B981" stroke="#10B981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activité par heure (aujourd'hui) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Activité par heure — aujourd'hui</h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Messages" fill="#E91E8C" stroke="#E91E8C" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Distribution géographique */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Globe size={14} className="text-[#E91E8C]" />
                Distribution géographique
              </h2>
              {data.byCountry.length > 0 ? (
                <div className="space-y-2">
                  {data.byCountry.map((c, i) => {
                    const maxVal = data.byCountry[0]?.count || 1
                    const pct = Math.round((c.count / maxVal) * 100)
                    return (
                      <div key={c.country} className="flex items-center gap-3">
                        <span className="w-28 truncate text-xs text-gray-600">{c.country}</span>
                        <div className="flex-1 rounded-full bg-gray-100" style={{ height: 6 }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                        <span className="w-10 text-right text-xs text-gray-500">{c.count.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">Aucune donnée géo disponible</p>
              )}
            </div>

            {/* Top campagnes */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users size={14} className="text-[#E91E8C]" />
                Top campagnes
              </h2>
              {data.topCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-2 text-left font-medium text-gray-500">Campagne</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Envoyés</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Livrés</th>
                        <th className="pb-2 text-right font-medium text-gray-500">Taux livr.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.topCampaigns.map(c => (
                        <tr key={c.name}>
                          <td className="py-1.5 font-medium text-gray-700 max-w-[100px] truncate">{c.name}</td>
                          <td className="py-1.5 text-right text-gray-600">{c.sent.toLocaleString()}</td>
                          <td className="py-1.5 text-right text-gray-600">{c.delivered.toLocaleString()}</td>
                          <td className="py-1.5 text-right font-semibold text-[#E91E8C]">{c.openRate}%</td>
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
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}
