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
  // Devise réelle du compte Infobip (via DLR) — null tant qu'aucune transaction datée
  currency: string | null
  transactions: {
    id: number
    type: 'debit' | 'credit'
    // DECIMAL MySQL → mysql2 renvoie une string, pas un number
    amount: number | string
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
          <h1 className="flex items-center gap-2 text-[22px] font-bold text-[#1F2937]">
            <Wallet size={22} className="text-[#F4511E]" />
            Crédits Compte
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Gérez vos crédits SMS et votre solde</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs — cartes pleines couleurs (maquette) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Wallet,       gradient: 'linear-gradient(135deg, #22C55E, #15803D)', label: 'Solde Actuel',     value: data?.balance ?? 0 },
              { icon: TrendingDown, gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)', label: 'Utilisés ce mois', value: data?.usedThisMonth ?? 0 },
              { icon: RefreshCw,    gradient: 'linear-gradient(135deg, #A855F7, #7C3AED)', label: 'Restants',          value: data?.remaining ?? 0 },
            ].map(({ icon: Icon, gradient, label, value }) => (
              <div key={label} className="rounded-2xl p-5 text-white shadow-sm" style={{ background: gradient }}>
                <Icon size={26} className="mb-3 text-white/80" />
                <p className="text-[13px] text-white/85">{label}</p>
                <p className="mt-1 text-[26px] font-bold">
                  {value.toFixed(2)}
                  {data?.currency ? <span className="ml-1 text-[15px] font-semibold text-white/85">{data.currency}</span> : null}
                </p>
              </div>
            ))}
          </div>

          {/* Recharger votre compte (maquette) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Recharger votre compte</h2>
            <button
              disabled
              title="Disponible dès l'ouverture du module Billing (Mobile Money, carte, virement)"
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-5 py-3 text-[13px] font-bold text-white opacity-60 cursor-not-allowed"
            >
              <Plus size={14} /> Ajouter des crédits
            </button>
            <p className="mt-3 text-[11px] text-gray-400">
              Contactez <span className="text-[#F4511E]">commercial@biargroup.sbs</span> pour un rechargement manuel
              — {balancePct}% de votre solde mensuel restant.
            </p>
          </div>

          {/* Historique transactions */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-[15px] font-bold text-[#1F2937]">Historique des transactions</h2>
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
                          {tx.type === 'credit' ? '+' : '−'}{Number(tx.amount).toFixed(4)}{data?.currency ? ` ${data.currency}` : ''}
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