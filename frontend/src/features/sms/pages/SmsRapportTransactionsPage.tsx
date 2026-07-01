import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface TxData {
  totalUsed: number
  thisMonth: number
  today: number
  transactions: {
    id: number
    type: 'debit' | 'credit'
    amount: number
    sms_count: number
    description: string | null
    campaign_name: string | null
    created_at: string
  }[]
}

const kpiCards = [
  { key: 'totalUsed',  label: 'Total dépensé',     icon: CreditCard,    color: '#E91E8C' },
  { key: 'thisMonth',  label: 'Ce mois-ci',         icon: Calendar,      color: '#3B2F8F' },
  { key: 'today',      label: "Aujourd'hui",         icon: TrendingDown,  color: '#10B981' },
]

export default function SmsRapportTransactionsPage() {
  const [data, setData] = useState<TxData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ data: TxData }>('/sms/analytics/transactions')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rapport Transactions</h1>
        <p className="text-sm text-gray-500">Historique des débits et crédits de votre compte SMS</p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {kpiCards.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  ${(data?.[key as keyof TxData] as number ?? 0).toFixed(4)}
                </p>
                <p className="text-xs text-gray-400">USD</p>
              </div>
            ))}
          </div>

          {/* Tableau des transactions */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <DollarSign size={16} className="text-[#E91E8C]" />
              <h2 className="text-sm font-semibold text-gray-700">
                Dernières transactions ({data?.transactions.length ?? 0})
              </h2>
            </div>

            {!data?.transactions.length ? (
              <div className="py-12 text-center">
                <CreditCard size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">Aucune transaction enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Date</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Type</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Campagne</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Description</th>
                      <th className="px-5 py-2.5 text-right font-medium text-gray-500">SMS</th>
                      <th className="px-5 py-2.5 text-right font-medium text-gray-500">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-400">{fmt(tx.created_at)}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.type === 'credit' ? '+ Crédit' : '− Débit'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-600 max-w-[120px]">
                          <span className="block truncate">{tx.campaign_name ?? '—'}</span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-500 max-w-[160px]">
                          <span className="block truncate">{tx.description ?? '—'}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-600">{tx.sms_count.toLocaleString()}</td>
                        <td className={`px-5 py-2.5 text-right font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '−'}${tx.amount.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}