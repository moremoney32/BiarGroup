import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Globe, Search, TrendingDown, Signal } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface Tarif {
  pays: string
  code: string
  prixParSms: number
  couverture: number
}

export default function SmsTarifsCouverturePage() {
  const [tarifs, setTarifs] = useState<Tarif[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get<{ data: Tarif[] }>('/sms/outils/tarifs')
      .then(r => setTarifs(r.data))
      .catch(() => setTarifs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tarifs.filter(t =>
    t.pays.toLowerCase().includes(search.toLowerCase()) ||
    t.code.includes(search)
  )

  const avgPrice = tarifs.length > 0 ? tarifs.reduce((s, t) => s + t.prixParSms, 0) / tarifs.length : 0
  const bestCoverage = tarifs.length > 0 ? Math.max(...tarifs.map(t => t.couverture)) : 0

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tarifs & Couverture</h1>
        <p className="text-sm text-gray-500">Prix par SMS et couverture réseau par pays</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Pays couverts</p>
            <Globe size={14} className="text-[#F4511E]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{tarifs.length}</p>
          <p className="text-xs text-gray-400">destinations disponibles</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Prix moyen / SMS</p>
            <TrendingDown size={14} className="text-[#2563EB]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">${avgPrice.toFixed(4)}</p>
          <p className="text-xs text-gray-400">USD par message</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Meilleure couverture</p>
            <Signal size={14} className="text-green-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{bestCoverage}%</p>
          <p className="text-xs text-gray-400">taux de couverture réseau</p>
        </div>
      </div>

      {/* Tableau des tarifs */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un pays ou indicatif..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-gray-200 py-1.5 pl-9 pr-3 text-sm focus:border-[#F4511E] focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-400">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#F4511E] border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 text-xs">Pays</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 text-xs">Indicatif</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500 text-xs">Prix / SMS (USD)</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500 text-xs">Couverture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => (
                  <tr key={t.pays} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{t.pays}</td>
                    <td className="px-5 py-3 font-mono text-gray-600">{t.code}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-semibold text-[#F4511E]">${t.prixParSms.toFixed(4)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 rounded-full bg-gray-100" style={{ height: 5 }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${t.couverture}%`, backgroundColor: t.couverture >= 99 ? '#10B981' : t.couverture >= 95 ? '#F59E0B' : '#EF4444' }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{t.couverture}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                      Aucun pays trouvé pour "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            Tarifs indicatifs via Infobip — soumis à des variations selon les opérateurs locaux. Contact : <span className="text-[#F4511E]">commercial@biargroup.sbs</span>
          </p>
        </div>
      </div>
    </motion.div>
    <DashboardFooter />
    </div>
  )
}