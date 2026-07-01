import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, TrendingDown, DollarSign, RefreshCw, Plus } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface CreditsData {
  balance: number
  usedThisMonth: number
  remaining: number
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

export default function SmsCreditsComptePage() {
  const [data, setData] = useState<CreditsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get<{ data: CreditsData }>('/sms/technique/credits')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const balancePct = data && (data.balance + data.usedThisMonth) > 0
    ? Math.round((data.remaining / (data.balance + data.usedThisMonth)) * 100)
    : 0

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Crédits SMS</h1>
          <p className="text-sm text-gray-500">Solde et historique de consommation de votre compte</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            disabled
            title="Disponible dès l'ouverture du module Billing"
            className="flex items-center gap-1.5 rounded-lg bg-[#E91E8C] px-4 py-1.5 text-sm font-medium text-white opacity-60 cursor-not-allowed"
          >
            <Plus size={14} />
            Recharger les crédits
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Solde principal */}
          <div className="rounded-xl border-2 border-[#E91E8C]/20 bg-gradient-to-br from-[#E91E8C]/5 to-[#3B2F8F]/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E91E8C]">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Solde disponible</p>
                <p className="text-3xl font-bold text-gray-900">${(data?.balance ?? 0).toFixed(4)}</p>
                <p className="text-xs text-gray-400">USD</p>
              </div>
            </div>

            {/* Barre de consommation */}
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Consommé ce mois</span>
                <span>{balancePct}% restant</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] transition-all duration-500"
                  style={{ width: `${100 - balancePct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-red-600 font-medium">−${(data?.usedThisMonth ?? 0).toFixed(4)}</span>
                <span className="text-green-600 font-medium">${(data?.remaining ?? 0).toFixed(4)} restants</span>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Utilisé ce mois</p>
                <TrendingDown size={13} className="text-red-500" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">${(data?.usedThisMonth ?? 0).toFixed(4)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Restants ce mois</p>
                <DollarSign size={13} className="text-green-500" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">${(data?.remaining ?? 0).toFixed(4)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Transactions</p>
                <RefreshCw size={13} className="text-[#3B2F8F]" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">{(data?.transactions.length ?? 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">dernières opérations</p>
            </div>
          </div>

          {/* Bannière recharge */}
          <div className="rounded-xl border border-dashed border-[#E91E8C]/40 bg-[#E91E8C]/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E91E8C]/10">
                <Plus size={14} className="text-[#E91E8C]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Recharge de crédits SMS</p>
                <p className="text-xs text-gray-500">
                  La recharge sera disponible via le module Billing (Mobile Money, carte, virement).
                  Contactez <span className="text-[#E91E8C]">commercial@biargroup.sbs</span> pour un rechargement manuel.
                </p>
              </div>
            </div>
          </div>

          {/* Historique transactions */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-700">Historique des 20 dernières transactions</h2>
            </div>
            {!data?.transactions.length ? (
              <div className="py-12 text-center">
                <DollarSign size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-400">Aucune transaction enregistrée</p>
                <p className="text-xs text-gray-400 mt-1">Les débits apparaissent dès le premier envoi de campagne</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Date</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Type</th>
                      <th className="px-5 py-2.5 text-left font-medium text-gray-500">Campagne</th>
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
                            {tx.type === 'credit' ? 'Crédit' : 'Débit'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-600 max-w-[140px]">
                          <span className="block truncate">{tx.campaign_name ?? tx.description ?? '—'}</span>
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
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}