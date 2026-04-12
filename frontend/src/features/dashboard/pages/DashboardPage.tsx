import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Phone, MessageSquare, Mail, Wifi, TrendingUp, TrendingDown, Users,
  ArrowRight, CheckCircle, Clock, XCircle, Activity,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppSelector } from '../../../store/index'
import { selectCurrentUser } from '../../../store/slices/authSlice'
import PageTransition from '../../../components/animations/PageTransition'
import { StaggerList, StaggerItem } from '../../../components/animations/StaggerList'

// ── Mock data ────────────────────────────────────────────────────────────────

const activityData = [
  { day: 'Lun', appels: 120, sms: 1800, emails: 340, wa: 210 },
  { day: 'Mar', appels: 98,  sms: 2200, emails: 410, wa: 180 },
  { day: 'Mer', appels: 145, sms: 1500, emails: 290, wa: 320 },
  { day: 'Jeu', appels: 162, sms: 2800, emails: 510, wa: 270 },
  { day: 'Ven', appels: 134, sms: 3100, emails: 620, wa: 390 },
  { day: 'Sam', appels: 78,  sms: 1200, emails: 180, wa: 150 },
  { day: 'Dim', appels: 55,  sms: 900,  emails: 120, wa: 95  },
]

const recentActivity = [
  { id: 1, type: 'sms',   label: 'Campagne "Promo Vodacom Avril"',  status: 'completed', count: '5 000 SMS', time: 'Il y a 2h' },
  { id: 2, type: 'email', label: 'Newsletter Avril 2026',           status: 'completed', count: '1 200 emails', time: 'Il y a 4h' },
  { id: 3, type: 'call',  label: 'Appel entrant +243 810 000 01',   status: 'completed', count: '2 min 22s', time: 'Il y a 6h' },
  { id: 4, type: 'wa',    label: 'Campagne WhatsApp "Offre spéciale"', status: 'running', count: '850 envois', time: 'En cours' },
  { id: 5, type: 'sms',   label: 'OTP vérification clients',        status: 'failed',   count: '12 échecs', time: 'Il y a 8h' },
]

const kpis = [
  {
    id: 'calls',
    module: 'B-GOTOCALL',
    label: 'Appels aujourd\'hui',
    value: '134',
    sub: '2h 47min de durée',
    trend: +12,
    icon: Phone,
    color: '#3B82F6',
    bg: 'from-blue-500/20 to-blue-600/5',
  },
  {
    id: 'sms',
    module: 'B-SMSBULK',
    label: 'SMS envoyés',
    value: '3 100',
    sub: '96.4% délivrés',
    trend: +8,
    icon: MessageSquare,
    color: '#E91E8C',
    bg: 'from-pink-500/20 to-pink-600/5',
  },
  {
    id: 'email',
    module: 'B-EMAIL',
    label: 'Emails envoyés',
    value: '620',
    sub: '40% taux d\'ouverture',
    trend: -3,
    icon: Mail,
    color: '#8B5CF6',
    bg: 'from-violet-500/20 to-violet-600/5',
  },
  {
    id: 'wa',
    module: 'B-WHATSAPP',
    label: 'Messages WA',
    value: '390',
    sub: '98% lus',
    trend: +21,
    icon: Wifi,
    color: '#22C55E',
    bg: 'from-green-500/20 to-green-600/5',
  },
]

const quickActions = [
  { label: 'Nouvelle campagne SMS', href: '/app/sms', color: '#E91E8C' },
  { label: 'Créer email marketing', href: '/app/email/campagnes', color: '#8B5CF6' },
  { label: 'Voir les appels live', href: '/app/call-center', color: '#3B82F6' },
  { label: 'Gérer les contacts', href: '/app/contacts', color: '#22C55E' },
]

// ── Composants locaux ────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle size={14} className="text-green-400 shrink-0" />
  if (status === 'running')   return <Clock size={14} className="text-yellow-400 shrink-0" />
  return <XCircle size={14} className="text-red-400 shrink-0" />
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    sms:   { label: 'SMS',   cls: 'bg-pink-500/15 text-pink-300' },
    email: { label: 'Email', cls: 'bg-violet-500/15 text-violet-300' },
    call:  { label: 'Appel', cls: 'bg-blue-500/15 text-blue-300' },
    wa:    { label: 'WA',    cls: 'bg-green-500/15 text-green-300' },
  }
  const { label, cls } = map[type] ?? { label: type, cls: 'bg-white/10 text-white/60' }
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAppSelector(selectCurrentUser)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }, [])

  const today = useMemo(() =>
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  [])

  return (
    <PageTransition>
      <div className="space-y-5 pb-8">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white sm:text-xl">
              {greeting}, {user?.firstName ?? 'là'} 👋
            </h1>
            <p className="mt-0.5 text-xs capitalize text-white/40">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-1.5 text-[12px] font-medium text-green-400">
              <Activity size={12} />
              Plateforme opérationnelle
            </span>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.id}>
              <motion.div
                whileHover={{ y: -2 }}
                className={`relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${kpi.bg} p-4`}
              >
                {/* icon */}
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${kpi.color}25` }}
                >
                  <kpi.icon size={18} style={{ color: kpi.color }} />
                </div>

                {/* value */}
                <p className="text-xl font-bold text-white sm:text-2xl">{kpi.value}</p>
                <p className="mt-0.5 text-[11px] text-white/50">{kpi.label}</p>

                {/* sub + trend */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/40 leading-tight">{kpi.sub}</span>
                  <span
                    className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${
                      kpi.trend >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {kpi.trend >= 0
                      ? <TrendingUp size={11} />
                      : <TrendingDown size={11} />
                    }
                    {Math.abs(kpi.trend)}%
                  </span>
                </div>

                {/* module label */}
                <p
                  className="absolute right-3 top-3 text-[10px] font-bold tracking-wide opacity-30"
                  style={{ color: kpi.color }}
                >
                  {kpi.module}
                </p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* ── Chart + Quick actions ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          {/* Graphique — occupe 2/3 sur xl */}
          <div className="xl:col-span-2 rounded-xl border border-white/5 bg-white/3 p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[13px] font-semibold text-white/80">Activité — 7 derniers jours</h2>
              <span className="text-[11px] text-white/30">Toutes les chaînes</span>
            </div>
            <div className="h-48 sm:h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSms" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E91E8C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E91E8C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gEmail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gWa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}
                    itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: 'rgba(255,255,255,0.4)' }} />
                  <Area type="monotone" dataKey="sms"    name="SMS"    stroke="#E91E8C" strokeWidth={2} fill="url(#gSms)"   dot={false} />
                  <Area type="monotone" dataKey="emails" name="Emails" stroke="#8B5CF6" strokeWidth={2} fill="url(#gEmail)" dot={false} />
                  <Area type="monotone" dataKey="appels" name="Appels" stroke="#3B82F6" strokeWidth={2} fill="url(#gCalls)" dot={false} />
                  <Area type="monotone" dataKey="wa"     name="WA"     stroke="#22C55E" strokeWidth={2} fill="url(#gWa)"    dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actions rapides — 1/3 */}
          <div className="rounded-xl border border-white/5 bg-white/3 p-4 sm:p-6">
            <h2 className="mb-4 text-[13px] font-semibold text-white/80">Actions rapides</h2>
            <div className="space-y-2">
              {quickActions.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-3 text-[13px] font-medium text-white/70 transition-all hover:border-white/10 hover:bg-white/6 hover:text-white"
                >
                  <span>{a.label}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-40" />
                </a>
              ))}
            </div>

            {/* Contacts actifs */}
            <div className="mt-4 rounded-lg border border-white/5 bg-white/3 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E91E8C]/20">
                  <Users size={15} className="text-[#E91E8C]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white">12 480</p>
                  <p className="text-[11px] text-white/40">Contacts actifs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Activité récente ── */}
        <div className="rounded-xl border border-white/5 bg-white/3 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-white/80">Activité récente</h2>
            <a href="/app/reporting" className="flex items-center gap-1 text-[12px] text-[#E91E8C] hover:underline">
              Tout voir <ArrowRight size={12} />
            </a>
          </div>

          {/* Table desktop / Cards mobile */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-2 text-left text-[11px] font-medium text-white/30">Type</th>
                  <th className="pb-2 text-left text-[11px] font-medium text-white/30">Campagne / Action</th>
                  <th className="pb-2 text-left text-[11px] font-medium text-white/30">Volume</th>
                  <th className="pb-2 text-left text-[11px] font-medium text-white/30">Statut</th>
                  <th className="pb-2 text-right text-[11px] font-medium text-white/30">Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentActivity.map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-3 pr-3"><TypeBadge type={item.type} /></td>
                    <td className="py-3 pr-3">
                      <span className="text-[13px] text-white/70 group-hover:text-white transition-colors">
                        {item.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[12px] text-white/40">{item.count}</td>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-1.5">
                        <StatusIcon status={item.status} />
                        <span className="text-[12px] text-white/50 capitalize">{
                          item.status === 'completed' ? 'Terminé' :
                          item.status === 'running' ? 'En cours' : 'Échec'
                        }</span>
                      </span>
                    </td>
                    <td className="py-3 text-right text-[12px] text-white/30">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {recentActivity.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/5 bg-white/3 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TypeBadge type={item.type} />
                    <span className="text-[12px] text-white/70 truncate">{item.label}</span>
                  </div>
                  <StatusIcon status={item.status} />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-white/30">{item.count}</span>
                  <span className="text-[11px] text-white/25">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
