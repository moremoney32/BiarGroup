import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const kpis = [
  { icon: Activity,   bg: '#EFF6FF', color: '#3B82F6', label: 'Total SMS',       value: '256.8K' },
  { icon: TrendingUp, bg: '#F0FDF4', color: '#22C55E', label: 'Taux de succès',  value: '98.5%'  },
  { icon: Users,      bg: '#F5F3FF', color: '#8B5CF6', label: 'Destinataires',   value: '12.4K'  },
  { icon: DollarSign, bg: '#FFF7ED', color: '#F97316', label: 'Dépenses',        value: '45.2K XAF' },
]

export default function SmsAnalyticsPage() {
  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 py-5">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[#1F2937]">Analytics SMS</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Analysez vos performances SMS en détail</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {kpis.map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-1 text-[12px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <DashboardFooter />
    </div>
  )
}
