import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Phone, CheckCircle, XCircle, Globe, Wifi, RotateCcw } from 'lucide-react'
import api from '../../../services/api'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }

interface HlrResult {
  valid: boolean
  number: string
  operator?: string
  country?: string
  networkType?: string
  roaming?: boolean
  ported?: boolean
}

export default function SmsHlrLookupPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HlrResult | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<(HlrResult & { query: string })[]>([])

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await api.post<{ data: HlrResult }>('/sms/technique/hlr-lookup', { phone: phone.trim() })
      const res = r.data
      setResult(res)
      setHistory(h => [{ ...res, query: phone.trim() }, ...h.slice(0, 9)])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      setError(msg ?? 'Erreur lors de la vérification. Vérifiez le format du numéro.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setResult(null); setPhone(''); setError('') }

  return (
    <div>
    <motion.div {...fade} className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">HLR Lookup</h1>
        <p className="text-sm text-gray-500">
          Vérifiez en temps réel si un numéro mobile est actif et identifiez son opérateur
        </p>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Wifi size={16} className="mt-0.5 shrink-0 text-blue-500" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Home Location Register (HLR)</p>
          <p className="text-xs mt-0.5">
            Le HLR est la base de données centrale d'un réseau mobile. Cette requête interroge directement
            l'opérateur via Infobip pour vérifier si le numéro est actif, son réseau, et s'il est en roaming.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <form onSubmit={lookup} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Numéro de téléphone mobile
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+243 81 234 5678"
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-700 focus:border-[#F4511E] focus:outline-none focus:ring-1 focus:ring-[#F4511E]/20"
                  disabled={loading}
                />
              </div>
              {result && (
                <button type="button" onClick={reset}
                  className="rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50">
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#F4511E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#c9186e] disabled:opacity-50"
              >
                {loading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Search size={14} />
                }
                {loading ? 'Vérification...' : 'Vérifier'}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Format international recommandé : +243XXXXXXXXX (RDC), +237XXXXXXXXX (Cameroun)
            </p>
          </div>
        </form>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Résultat */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`rounded-xl border-2 p-6 ${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <div className="flex items-center gap-3 mb-5">
              {result.valid
                ? <CheckCircle size={24} className="text-green-500" />
                : <XCircle    size={24} className="text-red-500" />
              }
              <div>
                <p className={`text-base font-bold ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {result.valid ? 'Numéro actif et joignable' : 'Numéro inactif ou invalide'}
                </p>
                <p className="font-mono text-sm text-gray-600">{result.number}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Pays',         value: result.country     ?? '—', icon: Globe },
                { label: 'Opérateur',    value: result.operator    ?? '—', icon: Wifi },
                { label: 'Type réseau',  value: result.networkType ?? '—', icon: Phone },
                { label: 'Roaming',      value: result.roaming != null ? (result.roaming ? 'Oui' : 'Non') : '—', icon: Globe },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg bg-white/70 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {result.ported != null && (
              <p className="mt-3 text-xs text-gray-500">
                Numéro porté : <span className="font-medium">{result.ported ? 'Oui (portabilité)' : 'Non'}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historique des lookups */}
      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Historique de la session ({history.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => { setPhone(h.query); setResult(h) }}>
                <div className="flex items-center gap-3">
                  {h.valid
                    ? <CheckCircle size={13} className="text-green-500" />
                    : <XCircle    size={13} className="text-red-400" />
                  }
                  <span className="font-mono text-sm text-gray-700">{h.number}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{h.country ?? '—'}</span>
                  <span>{h.operator ?? '—'}</span>
                  <span className={`font-medium ${h.valid ? 'text-green-600' : 'text-red-500'}`}>
                    {h.valid ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
    <DashboardFooter />
    </div>
  )
}