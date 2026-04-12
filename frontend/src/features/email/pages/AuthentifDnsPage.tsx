import { RefreshCw, Copy, Edit } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const dnsRecords = [
  {
    type: 'SPF',
    icon: '🛡',
    status: 'Configuré',
    desc: "Sender Policy Framework — Vérifie que l'expéditeur est autorisé à envoyer des emails pour ce domaine",
    host: 'biargroup.com',
    recordType: 'TXT',
    value: '••••••••••••••••••••',
    ttl: '3600 secondes',
    lastCheck: 'Il y a 2 heures',
  },
  {
    type: 'DKIM',
    icon: '🔑',
    status: 'Configuré',
    desc: "DomainKeys Identified Mail — Signe cryptographiquement vos emails pour garantir leur authenticité",
    host: 'default._domainkey.biargroup.com',
    recordType: 'TXT',
    value: '••••••••••••••••••••',
    ttl: '3600 secondes',
    lastCheck: 'Il y a 2 heures',
  },
  {
    type: 'DMARC',
    icon: '🔒',
    status: 'Configuré',
    desc: "Domain-based Message Authentication — Définit la politique à appliquer si SPF ou DKIM échouent",
    host: '_dmarc.biargroup.com',
    recordType: 'TXT',
    value: '••••••••••••••••••••',
    ttl: '3600 secondes',
    lastCheck: 'Il y a 2 heures',
  },
]

const setupInstructions = [
  "Connectez-vous au panneau d'administration de votre hébergeur DNS",
  'Accédez à la section "Gestion DNS" ou "Zone DNS"',
  'Ajoutez chaque enregistrement TXT avec les valeurs ci-dessus',
  'Attendez la propagation DNS (peut prendre jusqu\'à 48h)',
  'Utilisez le bouton "Vérifier DNS" pour valider la configuration',
]

const guides = [
  { name: 'Guide OVH', sub: 'Configuration DNS →', icon: '🌐', bg: 'bg-[#F4511E]' },
  { name: 'Guide Cloudflare', sub: 'Configuration DNS →', icon: '☁', bg: 'bg-[#F4511E]' },
  { name: 'Guide GoDaddy', sub: 'Configuration DNS →', icon: '💎', bg: 'bg-[#F4511E]' },
]

export default function AuthentifDnsPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Authentification DNS &amp; Sécurité Email</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Configurez SPF, DKIM et DMARC pour améliorer votre délivrabilité</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
            <RefreshCw size={13} /> Vérifier DNS
          </button>
        </div>

        {/* Domaine configuré */}
        <div className="mb-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1F2937]">Domaine Configuré</p>
            <button className="text-[12px] font-semibold text-[#F4511E] hover:underline">Modifier</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-lg bg-[#F4511E] px-3 py-1.5 text-[12px] font-semibold text-white">biargroup.com</span>
            <span className="text-green-500 text-lg">✓</span>
          </div>
        </div>

        {/* Score de configuration */}
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-gray-500">État de la Configuration</p>
              <p className="text-[22px] font-bold text-[#1F2937]">3/3 Enregistrements</p>
              <p className="mt-0.5 text-[12px] text-green-600">✓ Excellent ! Tous les enregistrements DNS sont correctement configurés.</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Score de Sécurité</p>
              <p className="text-[32px] font-bold text-green-500">100%</p>
            </div>
          </div>
        </div>

        {/* DNS Records */}
        <div className="mb-5 space-y-4">
          {dnsRecords.map(({ type, icon, status, desc, host, recordType, value, ttl, lastCheck }) => (
            <div key={type} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <p className="text-[14px] font-semibold text-[#1F2937]">{type}</p>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">✓ {status}</span>
              </div>
              <p className="mb-4 text-[11px] text-gray-500">{desc}</p>

              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">NOM D'HÔTE / HOST</p>
                  <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                    <span className="text-[12px] font-mono text-white">{host}</span>
                    <button className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white">
                      <Copy size={11} /> Copier
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">TYPE D'ENREGISTREMENT</p>
                  <div className="rounded-lg bg-[#F4511E] px-3 py-2">
                    <span className="text-[12px] font-mono text-white">{recordType}</span>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">VALEUR / VALUE</p>
                  <div className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                    <span className="text-[12px] font-mono text-white">{value}</span>
                    <div className="flex gap-2">
                      <button className="text-[10px] text-white/70 hover:text-white">Afficher</button>
                      <button className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white">
                        <Copy size={11} /> Copier
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                <span>TTL: {ttl}</span>
                <span>Dernière vérification: {lastCheck}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">⚙</span>
            <p className="text-[13px] font-semibold text-[#2563EB]">Instructions de Configuration</p>
          </div>
          <ol className="space-y-1.5">
            {setupInstructions.map((inst, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                <span className="shrink-0 font-semibold text-[#F4511E]">{i + 1}.</span>
                {inst}
              </li>
            ))}
          </ol>
          <button className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:underline">
            📘 Consulter le guide complet de configuration →
          </button>
        </div>

        {/* Guide cards */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {guides.map(({ name, sub, icon, bg }) => (
            <button key={name} className={`flex items-center gap-3 rounded-xl ${bg} px-4 py-3 text-left hover:opacity-90 transition-opacity`}>
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-[12px] font-semibold text-white">{name}</p>
                <p className="text-[11px] text-white/80">{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
