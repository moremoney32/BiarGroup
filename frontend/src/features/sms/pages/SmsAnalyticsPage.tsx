import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, TrendingUp, Users, DollarSign,
  Send, CheckCircle2, XCircle, RefreshCw, Loader2, ExternalLink,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import type { SmsCampaign, SmsAnalyticsOverview } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const TYPE_COLORS: Record<string, string> = {
  promotional:   '#3B82F6',
  transactional: '#22C55E',
  notification:  '#F97316',
  otp:           '#8B5CF6',
}
const TYPE_LABELS: Record<string, string> = {
  promotional:   'Marketing',
  transactional: 'Transactionnel',
  notification:  'Notification',
  otp:           'OTP',
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString('fr-FR')
}

export default function SmsAnalyticsPage() {
  const navigate = useNavigate()
  const [stats, setStats]         = useState<SmsAnalyticsOverview | null>(null)
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [s, c] = await Promise.all([
        smsService.getAnalyticsOverview(),
        smsService.getCampaigns({ page: 1, limit: 50 }),
      ])
      setStats(s)
      setCampaigns(c.campaigns)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Chart 1 — performance timeline (10 dernières campagnes avec envois)
  const timelineData = [...campaigns]
    .filter(c => c.total_sent > 0)
    .slice(0, 10)
    .map(c => ({
      date:     new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      envoyes:  c.total_sent,
      delivres: c.total_delivered,
      echecs:   c.total_failed,
    }))
    .reverse()

  // Chart 2 — types de campagne (donut)
  const typeCount: Record<string, number> = {}
  for (const c of campaigns) {
    typeCount[c.campaign_type] = (typeCount[c.campaign_type] ?? 0) + c.total_sent
  }
  const pieData = Object.entries(typeCount)
    .filter(([, v]) => v > 0)
    .map(([type, value]) => ({
      name:  TYPE_LABELS[type] ?? type,
      value,
      color: TYPE_COLORS[type] ?? '#9CA3AF',
    }))

  // Chart 3 — top 5 campagnes par livraison
  const top5 = [...campaigns]
    .filter(c => c.total_sent > 0)
    .sort((a, b) => b.total_delivered - a.total_delivered)
    .slice(0, 5)
    .map(c => ({
      name:     c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name,
      delivres: c.total_delivered,
    }))

  const totalSent      = stats?.totalSent      ?? 0
  const totalDelivered = stats?.totalDelivered ?? 0
  const totalFailed    = stats?.totalFailed    ?? 0
  const deliveryRate   = stats?.deliveryRate   ?? 0
  const totalContacts  = stats?.totalContacts  ?? 0

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-4 sm:px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Analytics SMS</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Analysez vos performances SMS en détail</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
            <button onClick={() => navigate('/app/sms/rapports')}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <ExternalLink size={13} /> Rapports Complets
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">
            Impossible de charger les statistiques. Vérifiez votre connexion.
          </div>
        )}

        {/* KPIs principaux — 4 grandes cartes */}
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: Activity,   bg: '#EFF6FF', color: '#3B82F6', label: 'Total SMS',      value: loading ? '…' : fmt(totalSent) },
            { icon: TrendingUp, bg: '#F0FDF4', color: '#22C55E', label: 'Taux de succès', value: loading ? '…' : `${deliveryRate}%` },
            { icon: Users,      bg: '#F5F3FF', color: '#8B5CF6', label: 'Destinataires',  value: loading ? '…' : fmt(totalContacts) },
            { icon: DollarSign, bg: '#FFF7ED', color: '#F97316', label: 'Dépenses',        value: loading ? '…' : '— XAF' },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                {loading
                  ? <Loader2 size={16} style={{ color }} className="animate-spin" />
                  : <Icon size={18} style={{ color }} />
                }
              </div>
              <p className="text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-1 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* KPIs secondaires — 4 cartes compactes */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés',  value: loading ? '…' : totalSent.toLocaleString('fr-FR'),      sub: 'Total cumulé' },
            { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Messages Délivrés', value: loading ? '…' : totalDelivered.toLocaleString('fr-FR'), sub: `${deliveryRate}% de réussite` },
            { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Échecs',            value: loading ? '…' : totalFailed.toLocaleString('fr-FR'),    sub: `${totalSent > 0 ? (100 - deliveryRate).toFixed(1) : 0}% d'échec` },
            { icon: Activity,     bg: '#F5F3FF', color: '#8B5CF6', label: 'Campagnes actives', value: loading ? '…' : String(stats?.activeCampaigns ?? 0),    sub: `${campaigns.length} au total` },
          ].map(({ icon: Icon, bg, color, label, value, sub }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-[#1F2937]">{value}</p>
                <p className="text-[10px] font-semibold text-gray-600 truncate">{label}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts ligne 1 */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Performance Timeline */}
          <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Performance Timeline</h3>
            <p className="mb-4 text-[11px] text-gray-400">Évolution des métriques clés</p>
            {!loading && timelineData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={timelineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      {([['gE','#3B82F6'],['gD','#22C55E'],['gC','#EF4444']] as const).map(([id, c]) => (
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={c} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F4F6' }} />
                    <Area type="monotone" dataKey="envoyes"  stroke="#3B82F6" fill="url(#gE)" strokeWidth={2} name="Envoyés" />
                    <Area type="monotone" dataKey="delivres" stroke="#22C55E" fill="url(#gD)" strokeWidth={2} name="Délivrés" />
                    <Area type="monotone" dataKey="echecs"   stroke="#EF4444" fill="url(#gC)" strokeWidth={1.5} name="Échecs" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-2 flex justify-center gap-5">
                  {[['#3B82F6','Envoyés'],['#22C55E','Délivrés'],['#EF4444','Échecs']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                      <span className="text-[10px] text-gray-500">{l}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne avec envois'}
              </div>
            )}
          </div>

          {/* Types de campagne */}
          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Types de Campagne</h3>
            <p className="mb-3 text-[11px] text-gray-400">Distribution par type</p>
            {!loading && pieData.length > 0 ? (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width="55%" height={155}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                      dataKey="value" stroke="none">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString('fr-FR'), 'SMS']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5">
                  {pieData.map(({ name, value, color }) => {
                    const total = pieData.reduce((s, d) => s + d.value, 0)
                    const pct   = total > 0 ? Math.round((value / total) * 100) : 0
                    return (
                      <div key={name} className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-gray-600">{name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-[155px] items-center justify-center text-[12px] text-gray-300">
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune donnée'}
              </div>
            )}
          </div>
        </div>

        {/* Top campagnes */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Top Campagnes</h3>
          <p className="mb-4 text-[11px] text-gray-400">Meilleures performances par messages délivrés</p>
          {!loading && top5.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={top5} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} width={82} />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString('fr-FR'), 'Délivrés']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #F3F4F6' }}
                />
                <Bar dataKey="delivres" fill="#3B82F6" radius={[0, 3, 3, 0]} name="Délivrés" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[160px] items-center justify-center text-[12px] text-gray-300">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Aucune campagne avec envois'}
            </div>
          )}
        </div>

        {/* Lien rapports complets */}
        <div className="rounded-2xl bg-gradient-to-r from-[#F4511E] to-[#FF7043] p-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[15px] font-bold">Rapports Campagnes Complets</p>
              <p className="mt-0.5 text-[12px] text-white/80">
                Graphiques détaillés, historique complet, export CSV et filtres avancés
              </p>
            </div>
            <button onClick={() => navigate('/app/sms/rapports')}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12px] font-bold text-[#F4511E] hover:bg-orange-50 transition-colors">
              <ExternalLink size={13} /> Voir les rapports
            </button>
          </div>
        </div>

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
