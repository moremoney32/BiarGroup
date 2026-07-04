import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, TrendingDown, Calendar, DollarSign, Download } from 'lucide-react'
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
  { key: 'totalUsed',  label: 'Crédits Utilisés', icon: DollarSign,   gradient: 'linear-gradient(135deg, #22C55E, #15803D)' },
  { key: 'thisMonth',  label: 'Ce Mois',           icon: TrendingDown, gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
  { key: 'today',      label: "Aujourd'hui",        icon: Calendar,     gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)' },
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

  function exportCsv() {
    if (!data?.transactions.length) return
    const header = 'Date;Type;Campagne;Description;SMS;Montant'
    const rows = data.transactions.map(tx =>
      [fmt(tx.created_at), tx.type === 'credit' ? 'Crédit' : 'Débit',
       tx.campaign_name ?? '—', `"${(tx.description ?? '—').replace(/"/g, '""')}"`,
       tx.sms_count, `${tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(4)}`].join(';')
    ).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-sms-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
            <DollarSign size={22} className="text-[#F4511E]" />
            Rapport de Transactions
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Suivez toutes vos transactions SMS</p>
        </div>
        <button onClick={exportCsv} disabled={!data?.transactions.length}
          className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
          <Download size={13} /> Exporter
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPIs — cartes pleines couleurs (maquette) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {kpiCards.map(({ key, label, icon: Icon, gradient }) => (
              <div key={key} className="rounded-2xl p-5 text-white shadow-sm" style={{ background: gradient }}>
                <Icon size={26} className="mb-3 text-white/80" />
                <p className="text-[13px] text-white/85">{label}</p>
                <p className="mt-1 text-[26px] font-bold">
                  ${(data?.[key as keyof TxData] as number ?? 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Tableau des transactions */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-bold text-[#1F2937]">
                Transactions Récentes
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