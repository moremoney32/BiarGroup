import { Plus, Edit, Trash2, Play } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const summaryStats = [
  { label: 'Serveurs Actifs', value: '3', sub: 'Sur 4 configurés', icon: '✉', color: 'text-[#F4511E]' },
  { label: "Emails Aujourd'hui", value: '24 846', sub: '+18.3% vs hier', icon: '📈', color: 'text-green-500' },
  { label: "Taux d'Ouvert.", value: '42.8%', sub: 'Excellent', icon: '⚡', color: 'text-purple-500' },
  { label: 'Taux de Bounce', value: '0.9%', sub: 'Très bon', icon: '✅', color: 'text-green-500' },
]

const smtpServers = [
  {
    name: 'Office 365 Primary',
    status: 'Actif',
    host: 'smtp.office365.com:587',
    username: 'noreply@biargroup...',
    bounce: '1.2%',
    uptime: '99.9%',
    dailyUsed: 3456,
    dailyMax: 10000,
    dailyPct: 34.6,
    monthlyUsed: 98234,
    monthlyMax: 300000,
    monthlyPct: 32.7,
  },
  {
    name: 'SendGrid Marketing',
    status: 'Actif',
    host: 'smtp.sendgrid.net:587',
    username: 'apikey',
    bounce: '0.8%',
    uptime: '99.95%',
    dailyUsed: 12456,
    dailyMax: 50000,
    dailyPct: 24.9,
    monthlyUsed: 456789,
    monthlyMax: 1500000,
    monthlyPct: 30.5,
  },
  {
    name: 'Amazon SES Production',
    status: 'Actif',
    host: 'email-smtp.eu-west-1.amazonaws.com:587',
    username: 'AKIAIOSFONN7EXAMPLE',
    bounce: '0.5%',
    uptime: '99.98%',
    dailyUsed: 8934,
    dailyMax: 100000,
    dailyPct: 8.9,
    monthlyUsed: 234567,
    monthlyMax: 3000000,
    monthlyPct: 7.8,
  },
  {
    name: 'Gmail Backup',
    status: 'Inactif',
    host: 'smtp.gmail.com:587',
    username: 'backup@biargroup.c...',
    bounce: '0%',
    uptime: 'N/A',
    dailyUsed: 0,
    dailyMax: 500,
    dailyPct: 0,
    monthlyUsed: 0,
    monthlyMax: 15000,
    monthlyPct: 0,
  },
]

const providers = [
  { name: 'SendGrid', sub: 'Deliverability de pointe', badge: 'Recommandé', badgeColor: 'text-[#F4511E]' },
  { name: 'Amazon SES', sub: 'Scalabilité AWS', badge: 'Recommandé', badgeColor: 'text-[#F4511E]' },
  { name: 'Mailgun', sub: 'Pour développeurs', badge: '', badgeColor: '' },
  { name: 'Office 365', sub: 'Intégration Microsoft', badge: '', badgeColor: '' },
]

export default function ConfigSmtpPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1F2937]">Configuration SMTP</h1>
            <p className="mt-0.5 text-[13px] text-gray-500">Gérez vos serveurs SMTP et paramètres d'emailing</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
            <Plus size={14} /> Nouveau Serveur SMTP
          </button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-4 gap-3">
          {summaryStats.map(({ label, value, sub, icon, color }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xl ${color}`}>{icon}</span>
              </div>
              <p className="text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
              <p className={`mt-0.5 text-[10px] font-medium ${color}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* SMTP Servers */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Serveurs SMTP Configurés</p>
          <div className="space-y-4">
            {smtpServers.map(({ name, status, host, username, bounce, uptime, dailyUsed, dailyMax, dailyPct, monthlyUsed, monthlyMax, monthlyPct }) => (
              <div key={name} className="rounded-xl border border-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[#1F2937]">{name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === 'Actif' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      ● {status}
                    </span>
                    <button className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-[#F4511E]">STARTTLS</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Play size={12} /></button>
                    <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Edit size={12} /></button>
                    <button className="rounded p-1.5 text-red-300 hover:bg-red-50"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="mb-3 grid grid-cols-4 gap-4 text-[11px]">
                  <div><p className="text-gray-400">Host</p><p className="font-medium text-gray-700 break-all">{host}</p></div>
                  <div><p className="text-gray-400">Username</p><p className="font-medium text-gray-700">{username}</p></div>
                  <div><p className="text-gray-400">Bounce Rate</p><p className="font-bold text-green-500">{bounce}</p></div>
                  <div><p className="text-gray-400">Uptime</p><p className="font-bold text-green-500">{uptime}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-gray-400">Utilisation Quotidienne</span>
                      <span className="text-gray-600">{dailyPct}%</span>
                    </div>
                    <p className="mb-1 text-[10px] text-gray-500">{dailyUsed.toLocaleString()} / {dailyMax.toLocaleString()}</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-[#F4511E]" style={{ width: `${dailyPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-[10px]">
                      <span className="text-gray-400">Utilisation Mensuelle</span>
                      <span className="text-gray-600">{monthlyPct}%</span>
                    </div>
                    <p className="mb-1 text-[10px] text-gray-500">{monthlyUsed.toLocaleString()} / {monthlyMax.toLocaleString()}</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${monthlyPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Params généraux + Auth sécurité */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          {/* Paramètres Généraux */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-base">⚙</span>
              <p className="text-[13px] font-semibold text-[#1F2937]">Paramètres Généraux</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email Expéditeur par Défaut', value: 'noreply@biargroup.com' },
                { label: "Nom de l'Expéditeur", value: 'Biar Group Africa' },
                { label: 'Adresse de Réponse', value: 'support@biargroup.com' },
                { label: 'Adresse Bounce', value: 'bounce@biargroup.com' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="mb-1 text-[11px] text-gray-500">{label}</p>
                  <div className="rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-medium text-white">{value}</div>
                </div>
              ))}
              <div className="space-y-1.5 pt-1">
                {["Activer le suivi des ouvertures", "Activer le suivi des clics", "Inclure lien de désinscription"].map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-[11px] text-gray-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-[#F4511E]" />
                    {opt}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="mb-1 text-[10px] text-gray-500">Tentatives de Retry</p>
                  <div className="rounded-lg bg-[#F4511E] px-3 py-2 text-center text-[13px] font-bold text-white">3</div>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-gray-500">Intervalle (sec)</p>
                  <div className="rounded-lg bg-[#F4511E] px-3 py-2 text-center text-[13px] font-bold text-white">300</div>
                </div>
              </div>
              <button className="w-full rounded-lg bg-[#F4511E] py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
                💾 Enregistrer les Paramètres
              </button>
            </div>
          </div>

          {/* Authentification & Sécurité */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-base">🛡</span>
              <p className="text-[13px] font-semibold text-[#1F2937]">Authentification &amp; Sécurité</p>
            </div>
            <div className="mb-4 rounded-xl border border-gray-100 p-4">
              <p className="mb-2 text-[12px] font-semibold text-[#1F2937]">Authentification Email</p>
              {['DKIM', 'SPF', 'DMARC'].map(item => (
                <div key={item} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                    <span className="text-green-500">✓</span> {item}
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">Configuré</span>
                </div>
              ))}
            </div>
            <div className="mb-4 rounded-xl border border-gray-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-[#1F2937]">Score de Délivrabilité</p>
              </div>
              <div className="mb-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-green-500" style={{ width: '94%' }} />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-green-600">Excellent! Votre réputation d'expéditeur est optimale.</span>
                <span className="font-bold text-[#1F2937]">94/100</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold text-[#1F2937]">Fournisseurs Recommandés</p>
              <div className="space-y-1.5">
                {providers.map(({ name, sub, badge, badgeColor }) => (
                  <div key={name} className="flex items-center justify-between rounded-lg bg-[#F4511E] px-3 py-2">
                    <div>
                      <p className="text-[12px] font-semibold text-white">{name}</p>
                      <p className="text-[10px] text-white/70">{sub}</p>
                    </div>
                    {badge && <span className={`text-[10px] font-semibold ${badgeColor} bg-white px-2 py-0.5 rounded`}>{badge}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Guide SMTP */}
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📘</span>
            <p className="text-[13px] font-semibold text-[#2563EB]">Guide de Configuration SMTP</p>
          </div>
          <p className="text-[12px] text-gray-600">Apprenez à configurer SPF, DKIM, et DMARC pour améliorer votre délivrabilité</p>
          <button className="mt-2 text-[12px] font-semibold text-[#2563EB] hover:underline">Accéder au guide →</button>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
