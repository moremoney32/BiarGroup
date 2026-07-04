import { useState, useEffect, useCallback } from 'react'
import {
  Key, Activity, Shield, Eye, EyeOff, Copy, Plus,
  CheckCircle2, AlertTriangle, Trash2, Loader2, RefreshCw, X,
  Zap, Clock
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { smsService } from '../../../services/sms.service'
import { useToast } from '../../../hooks/useToast'
import type { SmsApiKey, SmsAnalyticsOverview } from '../../../types/sms.types'
import { motion } from 'framer-motion'

const API_BASE = (import.meta.env.VITE_API_URL as string ?? '/api/v1').startsWith('http')
  ? (import.meta.env.VITE_API_URL as string)
  : `${window.location.origin}${import.meta.env.VITE_API_URL ?? '/api/v1'}`

interface Endpoint {
  method: 'POST' | 'GET' | 'DELETE'
  color: string
  title: string
  desc: string
  url: string
  curl: string
  js: string
  py: string
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST', color: '#22C55E',
    title: 'Envoyer un SMS',
    desc: 'Envoyer un SMS simple vers un numéro E.164',
    url: `${API_BASE}/sms/send-single`,
    curl: `curl -X POST ${API_BASE}/sms/send-single \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"+243812345678","message":"Bonjour depuis BIAR!"}'`,
    js: `const res = await fetch('${API_BASE}/sms/send-single', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <VOTRE_CLÉ_API>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '+243812345678',
    message: 'Votre code : 847291. Valide 5 min.',
  }),
})
const { data } = await res.json()
console.log('Message ID:', data.messageId)`,
    py: `import requests

res = requests.post(
  '${API_BASE}/sms/send-single',
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'},
  json={'phone': '+243812345678', 'message': 'Bonjour BIAR!'}
)
print(res.json())`,
  },
  {
    method: 'POST', color: '#22C55E',
    title: 'Créer une campagne',
    desc: 'Créer et envoyer une campagne SMS en masse',
    url: `${API_BASE}/sms/campaigns`,
    curl: `curl -X POST ${API_BASE}/sms/campaigns \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Ma Campagne","message":"Promo -20%","senderId":"BIAR","listIds":[1],"campaignType":"promotional"}'`,
    js: `const res = await fetch('${API_BASE}/sms/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <VOTRE_CLÉ_API>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Ma Campagne',
    message: 'Promo -20% ce weekend !',
    senderId: 'BIARGROUP',
    listIds: [1, 2],
    campaignType: 'promotional',
  }),
})
const { data } = await res.json()
console.log('Campaign ID:', data.id)`,
    py: `import requests

res = requests.post(
  '${API_BASE}/sms/campaigns',
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'},
  json={
    'name': 'Ma Campagne',
    'message': 'Promo -20%',
    'senderId': 'BIARGROUP',
    'listIds': [1],
    'campaignType': 'promotional',
  }
)
print(res.json())`,
  },
  {
    method: 'GET', color: '#3B82F6',
    title: 'Lister les campagnes',
    desc: 'Récupérer la liste paginée de vos campagnes SMS',
    url: `${API_BASE}/sms/campaigns`,
    curl: `curl -X GET "${API_BASE}/sms/campaigns?page=1&limit=20" \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>"`,
    js: `const res = await fetch('${API_BASE}/sms/campaigns?page=1&limit=20', {
  headers: { 'Authorization': 'Bearer <VOTRE_CLÉ_API>' },
})
const { data, meta } = await res.json()
console.log(\`\${meta.total} campagnes\`, data)`,
    py: `import requests

res = requests.get(
  '${API_BASE}/sms/campaigns',
  params={'page': 1, 'limit': 20},
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'}
)
print(res.json())`,
  },
  {
    method: 'POST', color: '#22C55E',
    title: 'Envoyer un OTP',
    desc: 'Générer et envoyer un code OTP à 6 chiffres par SMS',
    url: `${API_BASE}/sms/otp/send`,
    curl: `curl -X POST ${API_BASE}/sms/otp/send \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"+243812345678"}'`,
    js: `const res = await fetch('${API_BASE}/sms/otp/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <VOTRE_CLÉ_API>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone: '+243812345678' }),
})
const { data } = await res.json()
console.log('OTP envoyé, expire dans:', data.expiresIn)`,
    py: `import requests

res = requests.post(
  '${API_BASE}/sms/otp/send',
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'},
  json={'phone': '+243812345678'}
)
print(res.json())`,
  },
  {
    method: 'POST', color: '#8B5CF6',
    title: 'Vérifier un OTP',
    desc: 'Valider le code OTP reçu par le destinataire',
    url: `${API_BASE}/sms/otp/verify`,
    curl: `curl -X POST ${API_BASE}/sms/otp/verify \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"+243812345678","code":"847291"}'`,
    js: `const res = await fetch('${API_BASE}/sms/otp/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <VOTRE_CLÉ_API>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ phone: '+243812345678', code: '847291' }),
})
const { data } = await res.json()
console.log('Valide :', data.valid)`,
    py: `import requests

res = requests.post(
  '${API_BASE}/sms/otp/verify',
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'},
  json={'phone': '+243812345678', 'code': '847291'}
)
print(res.json())`,
  },
  {
    method: 'GET', color: '#3B82F6',
    title: 'Statut d\'un message',
    desc: 'Récupérer le statut de livraison d\'un SMS par son ID',
    url: `${API_BASE}/sms/messages/{id}`,
    curl: `curl -X GET "${API_BASE}/sms/messages/42" \\
  -H "Authorization: Bearer <VOTRE_CLÉ_API>"`,
    js: `const messageId = 42
const res = await fetch(\`${API_BASE}/sms/messages/\${messageId}\`, {
  headers: { 'Authorization': 'Bearer <VOTRE_CLÉ_API>' },
})
const { data } = await res.json()
console.log('Statut:', data.status, '—', data.deliveredAt)`,
    py: `import requests

message_id = 42
res = requests.get(
  f'${API_BASE}/sms/messages/{message_id}',
  headers={'Authorization': 'Bearer <VOTRE_CLÉ_API>'}
)
print(res.json())`,
  },
]

type CodeTab = 'curl' | 'js' | 'py'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsDocumentationApiPage() {
  const toast = useToast()
  const [keys, setKeys]       = useState<SmsApiKey[]>([])
  const [stats, setStats]     = useState<SmsAnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating]     = useState(false)
  const [createdKey, setCreatedKey] = useState<SmsApiKey | null>(null)

  const [visibleIds, setVisibleIds]   = useState<Set<number>>(new Set())
  const [copied, setCopied]           = useState<string | null>(null)
  const [deleting, setDeleting]       = useState<number | null>(null)
  const [activeEndpoint, setEndpoint] = useState(0)
  const [codeTab, setCodeTab]         = useState<CodeTab>('curl')

  // IP Whitelist — configuration locale en attendant l'application côté backend
  const [ipList, setIpList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('sms_api_ip_whitelist') ?? '[]') } catch { return [] }
  })
  const [newIp, setNewIp] = useState('')

  function addIp() {
    const ip = newIp.trim()
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { toast.error('Adresse IP invalide (ex: 192.168.1.1)'); return }
    if (ipList.includes(ip)) { toast.error('Cette IP est déjà dans la liste'); return }
    const next = [...ipList, ip]
    setIpList(next)
    localStorage.setItem('sms_api_ip_whitelist', JSON.stringify(next))
    setNewIp('')
  }

  function removeIp(ip: string) {
    const next = ipList.filter(i => i !== ip)
    setIpList(next)
    localStorage.setItem('sms_api_ip_whitelist', JSON.stringify(next))
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [k, s] = await Promise.all([
        smsService.getApiKeys(),
        smsService.getAnalyticsOverview(),
      ])
      setKeys(k)
      setStats(s)
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  function toggleVisible(id: number) {
    setVisibleIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleCreate() {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const key = await smsService.createApiKey({ name: newKeyName.trim(), module: 'sms' })
      setCreatedKey(key)
      setKeys(prev => [key, ...prev])
      setNewKeyName('')
    } catch {
      toast.error('Erreur lors de la création de la clé')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Supprimer cette clé API ? Les intégrations l\'utilisant cesseront de fonctionner.')) return
    setDeleting(id)
    try {
      await smsService.deleteApiKey(id)
      setKeys(prev => prev.filter(k => k.id !== id))
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  const activeKeys    = keys.filter(k => k.is_active).length
  const totalRequests = keys.reduce((s, k) => s + k.requests_count, 0)
  const firstKey      = keys.find(k => k.is_active) ?? keys[0] ?? null
  const accountId     = firstKey ? `ACC_BIAR_${new Date(firstKey.created_at).getFullYear()}_${String(firstKey.tenant_id).padStart(3, '0')}` : '—'

  // Télécharge la doc des endpoints en fichier texte
  function downloadGuide() {
    const lines = ENDPOINTS.map(e =>
      `${e.method} ${e.title}\n${e.desc}\n${e.url}\n`
    ).join('\n')
    const guide = `BIAR ACTOR HUB — Guide d'intégration API SMS\n${'='.repeat(46)}\n\nAuthentification : header "Authorization: Bearer VOTRE_CLE_API"\nContent-Type : application/json\n\nENDPOINTS\n---------\n${lines}\nLimites de taux : 100 req/min · 5 000 req/heure · 50 000 req/jour\n`
    const blob = new Blob([guide], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'guide-integration-api-sms.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  const ep = ENDPOINTS[activeEndpoint]
  const codeContent = codeTab === 'curl' ? ep.curl : codeTab === 'js' ? ep.js : ep.py

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">
              <span className="mr-2">&lt;/&gt;</span>API SMS — Configuration Complète
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Gérez vos identifiants API, sécurisez l'accès et consultez la documentation d'intégration
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
            <button onClick={() => { setCreatedKey(null); setShowCreate(true) }}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <Plus size={13} /> Créer une clé API
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Key,      bg: '#EFF6FF', color: '#3B82F6', label: 'Clés API actives',   value: loading ? '…' : String(activeKeys) },
            { icon: Activity, bg: '#F0FDF4', color: '#22C55E', label: 'Requêtes (30j)',      value: loading ? '…' : (totalRequests + (stats?.totalSent ?? 0)).toLocaleString('fr-FR') },
            // Uptime : nécessite un monitoring serveur — non affiché tant que non mesuré
            { icon: Zap,      bg: '#F5F3FF', color: '#8B5CF6', label: 'Uptime',              value: '—' },
            { icon: Shield,   bg: '#FFF7ED', color: '#F97316', label: 'IP Whitelist',        value: String(ipList.length) },
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

        {/* Carte compte (maquette) */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#F4511E]">
            <Key size={30} className="text-[#F4511E]" />
          </div>
          <p className="text-[24px] font-bold text-[#F4511E]">{accountId}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button onClick={downloadGuide}
              className="rounded-xl bg-[#EC4899] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#db2777]">
              Télécharger le guide d'intégration
            </button>
            <button disabled title="Bientôt disponible"
              className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-[13px] font-bold text-white opacity-60 cursor-not-allowed">
              Changer le mot de passe API
            </button>
          </div>
        </div>

        {/* Identifiants API Complets (maquette) */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            <Key size={15} className="text-[#3B82F6]" /> Identifiants API Complets
          </h2>
          {[
            { label: 'API Key (Clé publique)', value: firstKey ? (firstKey.raw_key ?? firstKey.key_preview) : 'Créez une clé API pour commencer', secret: true, id: 'full-key' },
            { label: 'API Secret (Clé secrète)', value: firstKey ? 'Visible uniquement à la création de la clé' : '—', secret: true, id: 'full-secret' },
            { label: 'Account ID', value: accountId, secret: false, id: 'full-account' },
          ].map(({ label, value, secret, id }) => (
            <div key={id} className="mb-4">
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">{label}</label>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl bg-[#E0F2FE] px-4 py-3">
                  <code className="flex-1 truncate font-mono text-[12px] text-[#1F2937]">
                    {secret && !visibleIds.has(-1) ? '•'.repeat(42) : value}
                  </code>
                  {secret && (
                    <button onClick={() => toggleVisible(-1)} className="shrink-0 text-gray-400 hover:text-gray-600"
                      aria-label="Afficher / masquer">
                      {visibleIds.has(-1) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
                <button onClick={() => copyText(value, id)}
                  className="shrink-0 rounded-xl border border-gray-200 p-3 text-gray-500 hover:bg-gray-50"
                  aria-label="Copier">
                  {copied === id ? <CheckCircle2 size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { setCreatedKey(null); setShowCreate(true) }}
              className="flex items-center gap-1.5 rounded-xl bg-[#F4511E] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              <RefreshCw size={13} /> Régénérer les clés
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
              ⚠️ La régénération invalidera vos anciennes clés
            </p>
          </div>
        </div>

        {/* Adresses IP Whitelist (maquette) */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
                <Shield size={15} className="text-[#16A34A]" /> Adresses IP Whitelist
              </h2>
              <p className="mt-0.5 text-[11px] text-gray-400">Sécurisez l'accès à votre API en autorisant uniquement certaines IP</p>
            </div>
          </div>
          <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Nouvelle adresse IP</label>
          <div className="mb-4 flex gap-2">
            <input value={newIp} onChange={e => setNewIp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addIp() }}
              placeholder="Entrez une adresse IP (ex: 192.168.1.1)"
              className="flex-1 rounded-xl bg-[#E0F2FE] px-4 py-3 text-[12px] text-[#1F2937] outline-none placeholder-gray-400"
            />
            <button onClick={addIp}
              className="rounded-xl bg-[#F4511E] px-5 py-3 text-[12px] font-bold text-white hover:bg-[#d9400f]">
              Ajouter
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#FFB59B]/60">
                {['#', 'Adresse IP', 'Action'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[12px] font-bold text-[#1F2937]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ipList.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-[12px] text-gray-400">
                  Aucune IP — toutes les adresses sont autorisées
                </td></tr>
              )}
              {ipList.map((ip, i) => (
                <tr key={ip} className="border-b border-gray-50">
                  <td className="px-4 py-3 text-[12px] text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-[#1F2937]">{ip}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeIp(ip)}
                      className="rounded p-1.5 text-[#EF4444] hover:bg-red-50" aria-label={`Supprimer ${ip}`}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[10px] text-gray-400">
            Le filtrage IP sera appliqué côté serveur prochainement — la liste est déjà enregistrée.
          </p>
        </div>

        {/* Section clés API */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
              <Key size={15} className="text-[#3B82F6]" /> Mes clés API
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Ne partagez jamais vos clés. La valeur complète n'est visible qu'à la création.
            </p>
          </div>

          {loading && (
            <div className="flex h-16 items-center justify-center">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          )}

          {!loading && keys.length === 0 && (
            <div className="rounded-xl bg-[#FFEEE6] py-6 text-center">
              <Key size={22} className="mx-auto mb-2 text-[#F4511E]" />
              <p className="text-[12px] font-semibold text-gray-700">Aucune clé API</p>
              <p className="mt-1 text-[11px] text-gray-400">Cliquez sur "Créer une clé API" pour démarrer</p>
            </div>
          )}

          {!loading && keys.length > 0 && (
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                    <Key size={14} className="text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-[#1F2937]">{k.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${k.is_active ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'}`}>
                        {k.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="text-[11px] font-mono text-gray-500 truncate max-w-[220px]">
                        {visibleIds.has(k.id) && k.raw_key ? k.raw_key : k.key_preview}
                      </code>
                      {k.raw_key && (
                        <button onClick={() => toggleVisible(k.id)} className="shrink-0 text-gray-300 hover:text-gray-600">
                          {visibleIds.has(k.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                      <button onClick={() => copyText(k.raw_key ?? k.key_preview, `key-${k.id}`)}
                        className="shrink-0 text-gray-300 hover:text-gray-600">
                        {copied === `key-${k.id}` ? <CheckCircle2 size={12} className="text-[#22C55E]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-400">{k.requests_count.toLocaleString('fr-FR')} req.</p>
                    <p className="text-[10px] text-gray-300">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR') : 'Jamais utilisée'}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(k.id)} disabled={deleting === k.id}
                    className="shrink-0 rounded p-1.5 text-[#EF4444] hover:bg-red-50 transition-colors">
                    {deleting === k.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Endpoints disponibles */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            <span className="text-[#F4511E]">&lt;/&gt;</span> Endpoints API Disponibles
          </h2>

          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Liste endpoints */}
            <div className="w-full space-y-2 lg:w-[240px] lg:shrink-0">
              {ENDPOINTS.map((e, i) => (
                <button key={e.title} onClick={() => { setEndpoint(i); setCodeTab('curl') }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${activeEndpoint === i ? 'bg-[#FFEEE6] ring-1 ring-[#F4511E]/30' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: e.color }}>
                      {e.method}
                    </span>
                    <span className="text-[12px] font-semibold text-[#1F2937]">{e.title}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-gray-400 pl-1 leading-tight">{e.desc}</p>
                </button>
              ))}
            </div>

            {/* Détail endpoint actif */}
            <div className="flex-1 min-w-0">
              {/* URL */}
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: ep.color }}>
                  {ep.method}
                </span>
                <code className="flex-1 text-[11px] font-mono text-gray-700 break-all">{ep.url}</code>
                <button onClick={() => copyText(ep.url, `url-${activeEndpoint}`)}
                  className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors">
                  {copied === `url-${activeEndpoint}` ? <CheckCircle2 size={13} className="text-[#22C55E]" /> : <Copy size={13} />}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-gray-100">
                {([['curl', 'cURL'], ['js', 'JavaScript'], ['py', 'Python']] as [CodeTab, string][]).map(([tab, label]) => (
                  <button key={tab} onClick={() => setCodeTab(tab)}
                    className={`px-4 py-1.5 text-[11px] font-semibold transition-colors ${codeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-400 hover:text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div className="relative rounded-b-xl bg-[#0F172A] p-4">
                <button onClick={() => copyText(codeContent, `code-${activeEndpoint}-${codeTab}`)}
                  className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:text-white transition-colors">
                  {copied === `code-${activeEndpoint}-${codeTab}`
                    ? <CheckCircle2 size={13} className="text-[#4ADE80]" />
                    : <Copy size={13} />}
                </button>
                <pre className="overflow-x-auto text-[10px] leading-relaxed text-[#4ADE80] font-mono whitespace-pre-wrap pr-6">
                  {codeContent}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Auth + Rate Limits */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Auth */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[#1F2937]">
              <Shield size={14} className="text-[#3B82F6]" /> Authentification
            </h3>
            <div className="mb-3 rounded-xl bg-[#0F172A] px-4 py-3">
              <code className="text-[11px] font-mono text-[#4ADE80]">
                Authorization: Bearer &lt;VOTRE_CLÉ_API&gt;
              </code>
            </div>
            <div className="space-y-2">
              {[
                'Passez la clé dans le header HTTP Authorization',
                "Format : Bearer suivi d'un espace et de la clé",
                'Chaque clé est liée à votre compte BIAR uniquement',
              ].map(line => (
                <div key={line} className="flex items-start gap-2">
                  <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-[#22C55E]" />
                  <span className="text-[11px] text-gray-600">{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[#1F2937]">
              <Clock size={14} className="text-[#F97316]" /> Limites de Taux (Rate Limits)
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { period: 'Par minute',  value: '100',    unit: 'req/min',  color: '#3B82F6', bg: '#EFF6FF' },
                { period: 'Par heure',   value: '5 000',  unit: 'req/hour', color: '#8B5CF6', bg: '#F5F3FF' },
                { period: 'Par jour',    value: '50 000', unit: 'req/day',  color: '#F4511E', bg: '#FFEEE6' },
              ].map(({ period, value, unit, color, bg }) => (
                <div key={period} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                  <p className="text-[16px] font-black" style={{ color }}>{value}</p>
                  <p className="text-[9px] font-bold text-gray-500 mt-0.5">{unit}</p>
                  <p className="text-[9px] text-gray-400">{period}</p>
                </div>
              ))}
            </div>
            <div className="mb-2 rounded-xl bg-[#FEF2F2] px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[#EF4444]" />
              <span className="text-[10px] text-[#DC2626]">OTP : limite stricte 5 req / 15 min / IP</span>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />
              <span className="text-[10px] text-amber-700">Dépassement = HTTP 429 — attendez la fenêtre suivante</span>
            </div>
          </div>
        </div>

        {/* Format de réponse */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-[13px] font-bold text-[#1F2937]">📦 Format des réponses</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-[#22C55E]">✅ Succès (200 / 201)</p>
              <pre className="rounded-xl bg-[#0F172A] p-3 text-[10px] font-mono text-[#4ADE80] leading-relaxed">
{`{
  "success": true,
  "data": { ... },
  "message": "SMS envoyé",
  "meta": {
    "page": 1,
    "total": 100
  }
}`}
              </pre>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-[#EF4444]">❌ Erreur (4xx / 5xx)</p>
              <pre className="rounded-xl bg-[#0F172A] p-3 text-[10px] font-mono text-[#F87171] leading-relaxed">
{`{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Numéro invalide",
    "details": []
  }
}`}
              </pre>
            </div>
          </div>
        </div>

      </motion.div>
      <DashboardFooter />

      {/* ── Modal création clé API ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); setCreatedKey(null) } }}>
          <div className="w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-xl relative">
            <button onClick={() => { setShowCreate(false); setCreatedKey(null) }}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-gray-100">
              <X size={16} className="text-gray-500" />
            </button>

            {!createdKey ? (
              <>
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
                  <Plus size={16} className="text-[#F4511E]" /> Créer une clé API
                </h3>
                <div className="mb-4">
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Nom de la clé *</label>
                  <input
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Ex : Intégration site web, App mobile..."
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40 placeholder-orange-300"
                    autoFocus
                  />
                </div>
                <div className="mb-5 rounded-xl bg-amber-50 p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-[11px] text-amber-700">
                    La clé complète sera affichée <strong>une seule fois</strong> à la création. Conservez-la dans un endroit sécurisé.
                  </p>
                </div>
                <button onClick={handleCreate} disabled={!newKeyName.trim() || creating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f] disabled:opacity-50">
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                  Générer la clé API
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#22C55E]" />
                  <h3 className="text-[15px] font-bold text-[#1F2937]">Clé créée avec succès !</h3>
                </div>
                <div className="mb-4 rounded-xl bg-[#F0FDF4] p-4">
                  <p className="mb-2 text-[11px] font-semibold text-[#16A34A]">Clé API — copiez-la maintenant</p>
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#22C55E]/30">
                    <code className="flex-1 text-[11px] font-mono text-[#1F2937] break-all">{createdKey.raw_key}</code>
                    <button onClick={() => copyText(createdKey.raw_key ?? '', 'new-key')}
                      className="shrink-0 text-[#22C55E] hover:text-[#16a34a]">
                      {copied === 'new-key' ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>
                <div className="mb-4 rounded-xl bg-amber-50 p-3 flex items-start gap-2">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-[11px] text-amber-700">
                    Cette clé ne sera plus jamais affichée en clair. Si vous la perdez, vous devrez en créer une nouvelle.
                  </p>
                </div>
                <button onClick={() => { setShowCreate(false); setCreatedKey(null) }}
                  className="w-full rounded-xl bg-[#1F2937] py-3 text-[12px] font-bold text-white hover:bg-gray-700">
                  J'ai copié ma clé — Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
