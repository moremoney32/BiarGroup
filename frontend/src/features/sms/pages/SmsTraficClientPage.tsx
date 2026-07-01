import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Users, TrendingUp, UserCheck, UserPlus } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
const COLORS = ['#E91E8C', '#3B2F8F', '#10B981', '#F59E0B', '#6B7280']

interface TraficData {
  kpis: { activeClients: number; newClients: number; engagementRate: number; retentionRate: number }
  trends: { date: string; actifs: number; nouveaux: number; inactifs: number; engagement: number }[]
  segmentation: { segment: string; clients: number; engagement: number }[]
  byHour: { hour: number; count: number }[]
}

const SEG_COLORS: Record<string, string> = {
  VIP:         'bg-purple-100 text-purple-700',
  Premium:     'bg-pink-100 text-pink-700',
  Standard:    'bg-blue-100 text-blue-700',
  Occasionnel: 'bg-yellow-100 text-yellow-700',
  Inactif:     'bg-gray-100 text-gray-600',
}

export default function SmsTraficClientPage() {
  const [data, setData] = useState<TraficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30j')

  useEffect(() => {
    setLoading(true)
    api.get<{ data: TraficData }>(`/sms/analytics/trafic-client?period=${period}`)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [period])

  const kpiCards = [
    { label: 'Clients actifs',      value: data?.kpis.activeClients  ?? 0, icon: Users,      color: '#E91E8C', suffix: '' },
    { label: 'Nouveaux clients',    value: data?.kpis.newClients      ?? 0, icon: UserPlus,   color: '#3B2F8F', suffix: '' },
    { label: 'Taux d\'engagement',  value: data?.kpis.engagementRate  ?? 0, icon: TrendingUp, color: '#10B981', suffix: '%' },
    { label: 'Taux de rétention',   value: data?.kpis.retentionRate   ?? 0, icon: UserCheck,  color: '#F59E0B', suffix: '%' },
  ]

  // Graphique par heure avec labels simplifiés
  const byHourLabeled = (data?.byHour ?? []).map(h => ({
    ...h,
    label: h.hour % 3 === 0 ? `${h.hour}h` : '',
  }))

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trafic Client</h1>
          <p className="text-sm text-gray-500">Analyse comportementale et segmentation de vos destinataires</p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:border-[#E91E8C] focus:outline-none"
        >
          <option value="7j">7 jours</option>
          <option value="30j">30 jours</option>
          <option value="90j">90 jours</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {kpiCards.map(({ label, value, icon: Icon, color, suffix }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{label}</p>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                </div>
                <p className="mt-2 text-xl font-bold text-gray-900">{value.toLocaleString()}{suffix}</p>
              </div>
            ))}
          </div>

          {/* Tendances 30 jours */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Évolution des clients actifs — 30 jours</h2>
            {(data?.trends ?? []).length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data?.trends ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.floor((data?.trends.length ?? 1) / 7)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="actifs"   name="Actifs"    fill="#E91E8C" stroke="#E91E8C" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="nouveaux" name="Nouveaux"  fill="#3B2F8F" stroke="#3B2F8F" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="inactifs" name="Inactifs"  fill="#6B7280" stroke="#6B7280" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Aucune donnée de tendance</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Segmentation */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Segmentation clients</h2>
              {(data?.segmentation ?? []).some(s => s.clients > 0) ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(data?.segmentation ?? []).map(s => (
                      <div key={s.segment} className={`rounded-full px-3 py-1 text-xs font-medium ${SEG_COLORS[s.segment] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.segment}: {s.clients.toLocaleString()}
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data?.segmentation ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="segment" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip />
                      <Bar dataKey="clients" name="Clients" radius={[0,4,4,0]}>
                        {(data?.segmentation ?? []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="py-8 text-center text-sm text-gray-400">Aucun contact SMS enregistré</p>
              )}
            </div>

            {/* Activité par heure */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">Meilleure heure de contact (7 derniers jours)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byHourLabeled} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={v => `${byHourLabeled[Number(v)]?.hour ?? v}h`} />
                  <Bar dataKey="count" name="Clients contactés" fill="#3B2F8F" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Engagement par segment */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Taux d'engagement par segment (%)</h2>
            {(data?.segmentation ?? []).some(s => s.engagement > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data?.segmentation ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Engagement']} />
                  <Bar dataKey="engagement" name="Engagement %" radius={[4,4,0,0]}>
                    {(data?.segmentation ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-6 text-center text-sm text-gray-400">Aucune donnée d'engagement</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}