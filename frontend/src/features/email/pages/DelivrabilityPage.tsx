import { Settings, CheckCircle2, AlertTriangle } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const healthStats = [
  { icon: '✉', label: 'Taux de délivrabilité', value: '98.2%', ok: true },
  { icon: '↩', label: 'Taux de rebond', value: '1.8%', ok: true },
  { icon: '🚫', label: 'Plaintes spam', value: '0.08%', ok: true },
  { icon: '🔒', label: 'Blacklist', value: '0', ok: true },
]

const authItems = [
  {
    type: 'SPF (Sender Policy Framework)',
    status: 'Configuré',
    desc: 'Autorise vos serveurs à envoyer des emails',
    value: 'v=spf1 include:_spf.biargroup.com ~all',
    valueColor: 'bg-[#F4511E]',
  },
  {
    type: 'DKIM (DomainKeys Identified Mail)',
    status: 'Configuré',
    desc: 'Signature cryptographique de vos emails',
    value: 'Clé publique installée sur biargroup._domainkey',
    valueColor: 'bg-[#F4511E]',
  },
  {
    type: 'DMARC (Domain-based Authentication)',
    status: 'Configuré',
    desc: "Politique d'authentification du domaine",
    value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@biargroup.com',
    valueColor: 'bg-[#F4511E]',
  },
]

const blacklists = [
  { name: 'Spamhaus', status: 'Clean' },
  { name: 'Barracuda', status: 'Clean' },
  { name: 'SORBS', status: 'Clean' },
  { name: 'SpamCop', status: 'Clean' },
  { name: 'URIBL', status: 'Clean' },
  { name: 'SURBL', status: 'Clean' },
]

const recommendations = [
  { icon: CheckCircle2, text: 'Nettoyez votre liste', sub: 'Retirez les contacts inactifs depuis 6+ mois', ok: true },
  { icon: AlertTriangle, text: 'Surveillez le taux de rebond', sub: 'Maintenez-le sous 2% pour une bonne réputation', ok: false },
  { icon: CheckCircle2, text: 'Double opt-in activé', sub: 'Tous vos contacts ont confirmé leur inscription', ok: true },
  { icon: CheckCircle2, text: 'Lien de désinscription', sub: 'Présent dans tous vos emails', ok: true },
]

export default function DelivrabilityPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Délivrabilité &amp; Réputation</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Optimisez votre délivrabilité et maintenez une excellente réputation d'expéditeur</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
            <Settings size={13} /> Configurer SPF/DKIM
          </button>
        </div>

        {/* Score de réputation */}
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[18px] font-bold text-[#1F2937]">Score de réputation : Excellent</p>
              <p className="mt-1 text-[12px] text-green-600">Votre domaine maintient une excellente réputation d'expéditeur</p>
            </div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-400">
              <div className="text-center">
                <p className="text-[22px] font-bold text-[#1F2937]">90</p>
                <p className="text-[9px] text-gray-400">/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Health stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {healthStats.map(({ icon, label, value, ok }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xl">{icon}</span>
                <span className={`text-lg ${ok ? 'text-green-500' : 'text-red-400'}`}>✓</span>
              </div>
              <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Auth Email */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <p className="text-[14px] font-semibold text-[#1F2937]">Authentification Email</p>
          </div>
          <div className="space-y-3">
            {authItems.map(({ type, status, desc, value, valueColor }) => (
              <div key={type} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#1F2937]">{type}</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">✓ {status}</span>
                </div>
                <p className="mb-2 text-[11px] text-gray-500">{desc}</p>
                <div className={`rounded-lg ${valueColor} px-3 py-2`}>
                  <p className="text-[11px] font-mono text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* IP + Blacklist */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          {/* IP Dédiée */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🖥</span>
              <p className="text-[13px] font-semibold text-[#1F2937]">Adresses IP</p>
            </div>
            <div className="mb-3 rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-gray-700">IP Dédiée</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">Active</span>
              </div>
              <p className="mb-2 text-[11px] text-gray-500">192.168.1.45 — Score: 95/100</p>
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-green-500" style={{ width: '100%' }} />
              </div>
              <p className="text-[10px] text-green-600">Warm-up complété à 100%</p>
            </div>
            <div className="rounded-xl border border-blue-50 bg-blue-50 p-3">
              <p className="mb-1 text-[11px] font-semibold text-[#2563EB]">Avantages IP dédiée :</p>
              <ul className="space-y-0.5 text-[10px] text-gray-600">
                <li>✓ Réputation indépendante</li>
                <li>✓ Meilleur contrôle de la délivrabilité</li>
                <li>✓ Priorité dans les files d'attente</li>
              </ul>
            </div>
          </div>

          {/* Blacklist */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🚫</span>
              <p className="text-[13px] font-semibold text-[#1F2937]">Surveillance Blacklist</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blacklists.map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                  <span className="text-[12px] font-medium text-white">{name}</span>
                  <span className="rounded bg-green-400 px-1.5 py-0.5 text-[9px] font-bold text-white">{status}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-400">Dernière vérification : Aujourd'hui à 14:30</p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Recommandations pour optimiser votre délivrabilité</p>
          <div className="grid grid-cols-2 gap-3">
            {recommendations.map(({ icon: Icon, text, sub, ok }) => (
              <div key={text} className={`flex items-start gap-3 rounded-xl px-4 py-3 ${ok ? 'bg-[#F4511E]' : 'bg-orange-400'}`}>
                <Icon size={16} className="mt-0.5 shrink-0 text-white" />
                <div>
                  <p className="text-[12px] font-semibold text-white">{text}</p>
                  <p className="text-[10px] text-white/80">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Évolution du score */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Évolution du score de réputation</p>
          <div className="flex items-end gap-1 h-24">
            {[70, 72, 75, 73, 78, 80, 82, 79, 85, 87, 88, 90, 89, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-[#F4511E]/80 transition-all hover:bg-[#F4511E]" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400">
            <span>14 jours</span>
            <span>Aujourd'hui</span>
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
