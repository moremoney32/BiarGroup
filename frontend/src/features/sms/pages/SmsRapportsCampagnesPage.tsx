import { useState } from 'react'
import {
  Send, Eye, MousePointer, XCircle, DollarSign,
  CheckCircle2, ChevronDown, RefreshCw, Download, MoreVertical,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const timelineData = [
  { date: '01 Feb', envoyes: 18000, delivres: 17500, clics: 3600 },
  { date: '02 Feb', envoyes: 22000, delivres: 21400, clics: 4400 },
  { date: '03 Feb', envoyes: 19000, delivres: 18500, clics: 3800 },
  { date: '04 Feb', envoyes: 25000, delivres: 24300, clics: 5000 },
  { date: '05 Feb', envoyes: 21000, delivres: 20400, clics: 4200 },
  { date: '06 Feb', envoyes: 28000, delivres: 27200, clics: 5600 },
  { date: '07 Feb', envoyes: 24000, delivres: 23300, clics: 4800 },
]

const deliveryByHour = [
  { hour: '00h', rate: 87 }, { hour: '02h', rate: 89 },
  { hour: '04h', rate: 88 }, { hour: '06h', rate: 91 },
  { hour: '08h', rate: 95 }, { hour: '10h', rate: 97 },
  { hour: '12h', rate: 96 }, { hour: '14h', rate: 94 },
  { hour: '16h', rate: 93 }, { hour: '18h', rate: 92 },
  { hour: '20h', rate: 90 },
]

const volumeByHour = [
  { hour: '00h', v: 1200 }, { hour: '02h', v: 800 },
  { hour: '04h', v: 500 },  { hour: '06h', v: 2100 },
  { hour: '08h', v: 5500 }, { hour: '10h', v: 7800 },
  { hour: '12h', v: 8000 }, { hour: '14h', v: 6500 },
  { hour: '16h', v: 4800 }, { hour: '18h', v: 3200 },
  { hour: '20h', v: 2000 }, { hour: '22h', v: 1100 },
]

const operatorData = [
  { name: 'Vodacom',  value: 45, color: '#2563EB' },
  { name: 'Airtel',   value: 30, color: '#EF4444' },
  { name: 'Orange',   value: 18, color: '#F97316' },
  { name: 'Africell', value: 7,  color: '#22C55E' },
]

const campaignTypeData = [
  { name: 'Marketing',      value: 42, color: '#8B5CF6' },
  { name: 'Transactionnel', value: 28, color: '#22C55E' },
  { name: 'Notification',   value: 20, color: '#F97316' },
  { name: 'Alerte',         value: 10, color: '#EF4444' },
]

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  'Marketing':      { bg: '#EFF6FF', text: '#2563EB' },
  'Transactionnel': { bg: '#F5F3FF', text: '#7C3AED' },
  'Notification':   { bg: '#F0FDF4', text: '#16A34A' },
  'Alerte':         { bg: '#FFF7ED', text: '#EA580C' },
}

const mockCampaigns = [
  { id: 1, name: 'Promotion Black Friday 2026',   type: 'Marketing',      date: '20/02/2026', envoyes: 45000, delivres: 43956, delivresPct: 97.7, lusPct: 91.4, clics: 1200, cout: '$450.00' },
  { id: 2, name: 'Rappel Paiement Clients',        type: 'Transactionnel', date: '19/02/2026', envoyes: 12500, delivres: 12188, delivresPct: 97.5, lusPct: 89.4, clics: 388,  cout: '$125.00' },
  { id: 3, name: 'Nouvelle Collection Printemps',  type: 'Marketing',      date: '18/02/2026', envoyes: 60000, delivres: 58590, delivresPct: 97.7, lusPct: 91.8, clics: 1200, cout: '$600.00' },
  { id: 4, name: 'Confirmation Livraison',          type: 'Notification',   date: '17/02/2026', envoyes: 8900,  delivres: 8900,  delivresPct: 99.4, lusPct: 95.0, clics: 1200, cout: '$89.00' },
  { id: 5, name: 'Alerte Sécurité Compte',          type: 'Alerte',         date: '16/02/2026', envoyes: 3200,  delivres: 3166,  delivresPct: 98.9, lusPct: 95.0, clics: 890,  cout: '$32.00' },
]

const kpiRow1 = [
  { icon: Send,         bg: '#EFF6FF', color: '#3B82F6', label: 'Messages Envoyés',   value: '137 600', trend: '+0.3%' },
  { icon: CheckCircle2, bg: '#F0FDF4', color: '#22C55E', label: 'Taux de Délivrance', value: '97.88%',  trend: '+0.8%' },
  { icon: Eye,          bg: '#F5F3FF', color: '#8B5CF6', label: 'Taux de Lecture',    value: '76.14%',  trend: '+1.2%' },
  { icon: MousePointer, bg: '#FFF7ED', color: '#F97316', label: 'Taux de Clic',       value: '19.97%',  trend: '+0.3%' },
]
const kpiRow2 = [
  { icon: Eye,          bg: '#F5F3FF', color: '#8B5CF6', label: 'Messages Lus',  value: '102 550' },
  { icon: MousePointer, bg: '#FFF7ED', color: '#F97316', label: 'Clics Totaux',  value: '26 890'  },
  { icon: XCircle,      bg: '#FEF2F2', color: '#EF4444', label: 'Échecs',        value: '2 920'   },
  { icon: DollarSign,   bg: '#F0FDF4', color: '#22C55E', label: 'Coût Total',    value: '$1 376'  },
]

const perfCards = [
  { label: 'Messages Délivrés', value: '134 680', sub: '97.88% taux de réussite',  bg: '#F0FDF4', color: '#16A34A', icon: CheckCircle2 },
  { label: 'Clics Totaux',      value: '26 890',  sub: '19.97% taux de clic',      bg: '#FFF7ED', color: '#EA580C', icon: MousePointer },
  { label: 'Messages Lus',      value: '102 550', sub: "76.14% taux d'ouverture",  bg: '#F5F3FF', color: '#7C3AED', icon: Eye },
  { label: 'Échecs',            value: '2 920',   sub: "2.12% taux d'échec",       bg: '#FEF2F2', color: '#DC2626', icon: XCircle },
]

const PERIOD_OPTIONS = ['7 derniers jours', '30 derniers jours', '3 derniers mois']
const TYPE_OPTIONS   = ['Tous les types', 'Marketing', 'Transactionnel', 'Notification', 'Alerte']
const OP_OPTIONS     = ['Tous les opérateurs', 'Vodacom', 'Airtel', 'Orange', 'Africell']

function FilterDropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex-1 min-w-[130px]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2.5 text-[12px] font-semibold text-white"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-max min-w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-[12px] hover:bg-orange-50 ${opt === value ? 'font-semibold text-[#F4511E]' : 'text-gray-700'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SmsRapportsCampagnesPage() {
  const [periode, setPeriode] = useState('7 derniers jours')
  const [typeFiltre, setType] = useState('Tous les types')
  const [operateur, setOp]   = useState('Tous les opérateurs')
  const [search, setSearch]  = useState('')
  const [page, setPage]      = useState(1)

  const filtered = mockCampaigns.filter(c =>
    (typeFiltre === 'Tous les types' || c.type === typeFiltre) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Campaign Reports</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Analyses détaillées et statistiques de performance SMS</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              <RefreshCw size={13} /> Actualiser
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Download size={13} /> Exporter Rapport
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-3">
          <FilterDropdown options={PERIOD_OPTIONS} value={periode}    onChange={setPeriode} />
          <FilterDropdown options={TYPE_OPTIONS}   value={typeFiltre} onChange={setType} />
          <FilterDropdown options={OP_OPTIONS}     value={operateur}  onChange={setOp} />
          <div className="flex-1 min-w-[150px]">
            <input type="text" placeholder="Nom de campagne..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] placeholder-orange-300 outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
            />
          </div>
        </div>

        {/* KPI Ligne 1 */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpiRow1.map(({ icon: Icon, bg, color, label, value, trend }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-[11px] font-semibold text-[#22C55E]">{trend} ↑</span>
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* KPI Ligne 2 */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {kpiRow2.map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts : Timeline + Delivery par heure */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Performance Timeline</h3>
            <p className="mb-4 text-[11px] text-gray-400">Évolution des métriques clés</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {[['gE','#3B82F6'],['gD','#22C55E'],['gC','#F97316']].map(([id, c]) => (
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
                <Area type="monotone" dataKey="clics"    stroke="#F97316" fill="url(#gC)" strokeWidth={2} name="Clics" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 flex justify-center gap-5">
              {[['#3B82F6','Envoyés'],['#22C55E','Délivrés'],['#F97316','Clics']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                  <span className="text-[10px] text-gray-500">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Taux de Délivrance par Heure</h3>
            <p className="mb-4 text-[11px] text-gray-400">Performance horaire moyenne</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={deliveryByHour} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Taux']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 3, fill: '#22C55E' }} name="Taux" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts : Volume + Opérateurs */}
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Volume par Heure</h3>
            <p className="mb-4 text-[11px] text-gray-400">Distribution horaire des envois</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volumeByHour} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="v" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#1F2937]">Distribution par Opérateur</h3>
            <p className="mb-3 text-[11px] text-gray-400">Répartition des envois</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={170}>
                <PieChart>
                  <Pie data={operatorData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                    {operatorData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {operatorData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[11px] text-gray-700">{name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-[#1F2937]">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Types de Campagne + Stats Perf */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Types de Campagne</h3>
            <p className="mb-4 text-[11px] text-gray-400">Distribution par type</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={campaignTypeData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" stroke="none">
                    {campaignTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {campaignTypeData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[11px] text-gray-700">{name}</span>
                    </div>
                    <span className="text-[12px] font-bold text-[#1F2937]">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-[14px] font-bold text-[#1F2937]">Statistiques de Performance</h3>
            <p className="mb-4 text-[11px] text-gray-400">Indicateurs clés de succès</p>
            <div className="grid grid-cols-2 gap-3">
              {perfCards.map(({ label, value, sub, bg, color, icon: Icon }) => (
                <div key={label} className="rounded-xl p-4" style={{ backgroundColor: bg }}>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Icon size={13} style={{ color }} />
                    <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                  </div>
                  <p className="text-[17px] font-bold text-[#1F2937]">{value}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campagnes Récentes */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3">
            <div>
              <h3 className="text-[14px] font-bold text-[#1F2937]">Campagnes Récentes</h3>
              <p className="text-[11px] text-gray-400">Historique détaillé des campagnes SMS</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-[#F4511E] hover:bg-orange-50">
              <Download size={12} /> Exporter CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/60">
                  {['Campagne','Type','Date','Envoyés','Délivrés','Lus','Clics','Coût',''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const ts = TYPE_STYLE[c.type] ?? { bg: '#F9FAFB', text: '#6B7280' }
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937] max-w-[160px] truncate">{c.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: ts.bg, color: ts.text }}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">{c.date}</td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{c.envoyes.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-700">{c.delivres.toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] font-medium text-[#22C55E]">{c.delivresPct}%</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${c.lusPct}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-gray-600">{c.lusPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-700">{c.clics.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#1F2937]">{c.cout}</td>
                      <td className="px-4 py-3">
                        <button className="rounded p-1 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
            <span className="text-[11px] text-gray-400">Affichage de 1 à {filtered.length} sur {filtered.length} campagnes</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40">Précédent</button>
              {[1,2,3].map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold ${page===n ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => p+1)}
                className="rounded px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100">Suivant</button>
            </div>
          </div>
        </div>

      </div>
      <DashboardFooter />
    </div>
  )
}
