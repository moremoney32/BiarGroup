import { useState } from 'react'
import { Key, Activity, Wifi, Shield, Eye, EyeOff, Copy, RefreshCw, Plus, CheckCircle2, AlertTriangle } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const endpoints = [
  { method: 'POST', couleur: '#22C55E', titre: 'Envoyer SMS',    desc: 'Envoyer un SMS simple',        url: 'https://api.1s2u.io/v1/sms/send' },
  { method: 'POST', couleur: '#22C55E', titre: 'Envoi en masse',  desc: 'Envoyer des SMS en masse',     url: 'https://api.1s2u.io/v1/sms/bulk' },
  { method: 'GET',  couleur: '#3B82F6', titre: 'Statut SMS',      desc: "Récupérer le statut d'un SMS", url: 'https://api.1s2u.io/v1/sms/{message_id}' },
  { method: 'GET',  couleur: '#3B82F6', titre: 'Consulter solde', desc: 'Consulter votre solde de crédits', url: 'https://api.1s2u.io/v1/account/balance' },
  { method: 'POST', couleur: '#22C55E', titre: 'HLR Lookup',      desc: "Vérifier la validité d'un numéro", url: 'https://api.1s2u.io/v1/hlr/lookup' },
]

export default function SmsDocumentationApiPage() {
  const [showKey, setShowKey]     = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [newIp, setNewIp]         = useState('')
  const [ips, setIps]             = useState<string[]>([])
  const [copied, setCopied]       = useState<string | null>(null)

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-[#1F2937]">
            <span className="mr-2">&lt;&gt;</span>API SMS - Configuration Complète
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Gérez vos identifiants API, sécurisez l'accès et consultez la documentation d'intégration
          </p>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Key,      bg: '#EFF6FF', color: '#3B82F6', label: 'Clés API actives',  value: '2'     },
            { icon: Activity, bg: '#F0FDF4', color: '#22C55E', label: 'Requêtes (30j)',    value: '24.5K' },
            { icon: Wifi,     bg: '#F5F3FF', color: '#8B5CF6', label: 'Uptime',            value: '99.9%' },
            { icon: Shield,   bg: '#FFF7ED', color: '#F97316', label: 'IP Whitelist',      value: '0'     },
          ].map(({ icon: Icon, bg, color, label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* API Key display */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center py-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#F4511E]/20 bg-[#FFEEE6]">
              <span className="text-[22px] font-bold text-[#F4511E]">⊗</span>
            </div>
            <p className="mb-4 text-[18px] font-bold text-[#F4511E] font-mono tracking-wide">API1247256882</p>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                📥 Télécharger le guide d'intégration
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                🔑 Changer le mot de passe API
              </button>
            </div>
          </div>
        </div>

        {/* Identifiants API */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            <span className="text-[#3B82F6]">♂</span> Identifiants API Complets
          </h2>

          <div className="space-y-4">
            {/* API Key */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">API Key (Clé publique)</label>
              <div className="flex items-center gap-2 rounded-xl bg-[#E0F2FE] px-4 ring-1 ring-[#7DD3FC]">
                <input type={showKey ? 'text' : 'password'} defaultValue="sk_live_biargroup_2026_xxxxxxxxxxxxxxxxxxxx"
                  readOnly className="flex-1 bg-transparent py-2.5 text-[12px] text-[#1F2937] outline-none font-mono"
                />
                <button onClick={() => setShowKey(v => !v)} className="p-1 text-[#0284C7] hover:text-[#0369A1]">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => copyText('sk_live_biargroup_2026_xxxxxxxxxxxxxxxxxxxx', 'apikey')}
                  className="p-1 text-[#0284C7] hover:text-[#0369A1]">
                  {copied === 'apikey' ? <CheckCircle2 size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* API Secret */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">API Secret (Clé secrète)</label>
              <div className="flex items-center gap-2 rounded-xl bg-[#E0F2FE] px-4 ring-1 ring-[#7DD3FC]">
                <input type={showSecret ? 'text' : 'password'} defaultValue="secret_biargroup_2026_xxxxxxxxxxxxxxxxxx"
                  readOnly className="flex-1 bg-transparent py-2.5 text-[12px] text-[#1F2937] outline-none font-mono"
                />
                <button onClick={() => setShowSecret(v => !v)} className="p-1 text-[#0284C7] hover:text-[#0369A1]">
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => copyText('secret_biargroup_2026_xxxxxxxxxxxxxxxxxx', 'secret')}
                  className="p-1 text-[#0284C7] hover:text-[#0369A1]">
                  {copied === 'secret' ? <CheckCircle2 size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Account ID */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Account ID</label>
              <div className="flex items-center gap-2 rounded-xl bg-[#E0F2FE] px-4 ring-1 ring-[#7DD3FC]">
                <input type="text" defaultValue="ACC_BIAR_2026_001" readOnly
                  className="flex-1 bg-transparent py-2.5 text-[12px] text-[#1F2937] outline-none font-mono"
                />
                <button onClick={() => copyText('ACC_BIAR_2026_001', 'accountid')}
                  className="p-1 text-[#0284C7] hover:text-[#0369A1]">
                  {copied === 'accountid' ? <CheckCircle2 size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Régénérer */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                <RefreshCw size={13} /> Régénérer les clés
              </button>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500">
                <AlertTriangle size={13} />
                La régénération invalidera vos anciennes clés
              </div>
            </div>
          </div>
        </div>

        {/* IP Whitelist */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
                <Shield size={16} className="text-[#22C55E]" /> Adresses IP Whitelist
              </h2>
              <p className="text-[12px] text-gray-500">Sécurisez l'accès à votre API en autorisant uniquement certaines IP</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Ajouter IP
            </button>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Nouvelle adresse IP</label>
            <div className="flex gap-2">
              <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="Entrez une adresse IP (ex: 192.168.1.1)"
                className="flex-1 rounded-xl bg-[#E0F2FE] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-[#7DD3FC] placeholder-[#7DD3FC]"
              />
              <button onClick={() => { if (newIp) { setIps(prev => [...prev, newIp]); setNewIp('') } }}
                className="rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                Ajouter
              </button>
            </div>
          </div>

          {ips.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-[#E0F2FE]">
              <table className="w-full">
                <thead><tr className="bg-[#E0F2FE]">
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#0284C7]">#</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#0284C7]">Adresse IP</th>
                  <th className="px-4 py-2 text-left text-[10px] font-bold text-[#0284C7]">Action</th>
                </tr></thead>
                <tbody>{ips.map((ip, i) => (
                  <tr key={ip} className="border-t border-[#E0F2FE]">
                    <td className="px-4 py-2 text-[11px] text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2 text-[12px] font-mono text-[#1F2937]">{ip}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => setIps(prev => prev.filter(x => x !== ip))}
                        className="text-[11px] font-semibold text-[#EF4444] hover:underline">Supprimer</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Endpoints */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            &lt;&gt; Endpoints API Disponibles
          </h2>
          <div className="space-y-3">
            {endpoints.map(ep => (
              <div key={ep.titre} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: ep.couleur }}>
                    {ep.method}
                  </span>
                  <span className="text-[13px] font-bold text-[#1F2937]">{ep.titre}</span>
                </div>
                <p className="mb-2 text-[11px] text-gray-500">{ep.desc}</p>
                <div className="flex items-center justify-between rounded-lg bg-[#0F172A] px-3 py-2">
                  <code className="text-[11px] text-[#4ADE80] font-mono">{ep.url}</code>
                  <button onClick={() => copyText(ep.url, ep.url)}
                    className="shrink-0 p-1 text-gray-400 hover:text-white">
                    {copied === ep.url ? <CheckCircle2 size={13} className="text-[#4ADE80]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            ⚡ Limites de Taux (Rate Limits)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '100 req/min',    label: 'Par minute',  sub: 'Maximum de requêtes par minute', color: '#3B82F6', bg: '#EFF6FF' },
              { value: '5 000 req/hour', label: 'Par heure',   sub: 'Maximum de requêtes par heure',  color: '#22C55E', bg: '#F0FDF4' },
              { value: '50 000 req/day', label: 'Par jour',    sub: 'Maximum de requêtes par jour',   color: '#F97316', bg: '#FFF7ED' },
            ].map(({ value, label, sub, color, bg }) => (
              <div key={label} className="rounded-xl p-4" style={{ backgroundColor: bg }}>
                <p className="text-[18px] font-bold" style={{ color }}>{value}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#1F2937]">{label}</p>
                <p className="mt-0.5 text-[10px] text-gray-500">{sub}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f]">
            📚 Documentation API complète
          </button>
        </div>

      </div>
      <DashboardFooter />
    </div>
  )
}
