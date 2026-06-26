import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, ChevronLeft, Eye, EyeOff, Copy, CheckCircle2, Upload, ShieldCheck, Radio } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { motion } from 'framer-motion'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function SmsConfigurationRcsPage() {
  const navigate = useNavigate()

  const [showKey, setShowKey]     = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [apiKey, setApiKey]       = useState('sk_live_xxxxxxxxxxxx')
  const [apiSecret, setApiSecret] = useState('••••••••••••••••')
  const [serviceId, setServiceId] = useState('brand_xxxxxxxxx')
  const [webhook, setWebhook]     = useState('')
  const [opts, setOpts]           = useState({ fallback: true, delivery: true, read: true })

  const [brandNom, setBrandNom]   = useState('BIAR GROUP AFRICA')
  const [brandColor, setBColor]   = useState('#7C3AED')
  const [brandLogo, setBLogo]     = useState('')
  const [brandDesc, setBDesc]     = useState('Solutions de communication cloud professionnelles')
  const [brandSite, setBSite]     = useState('https://biargroup.com')
  const [brandTel, setBTel]       = useState('+243 978 979 898')
  const [brandEmail, setBEmail]   = useState('contact@biargroup.com')

  const copyText = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-4 sm:px-6 py-5" variants={fadeUp} initial="initial" animate="animate">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Settings size={22} className="text-[#F4511E]" />
            <div>
              <h1 className="text-[22px] font-bold text-[#1F2937]">Configuration RCS</h1>
              <p className="text-[13px] text-gray-500">Configurez votre intégration Rich Communication Services</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
            <ChevronLeft size={14} /> Retour
          </button>
        </div>

        {/* Banner Marque Vérifiée */}
        <div className="mb-5 rounded-2xl bg-[#F0FDF4] border border-[#86EFAC] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#22C55E]">
              <CheckCircle2 size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#15803D]">✅ Marque Vérifiée - RCS Activé</p>
              <p className="text-[12px] text-[#16A34A]">Votre marque est vérifiée et approuvée pour l'envoi de messages RCS.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: CheckCircle2, label: "Vérification d'identité", value: 'Validée',  color: '#16A34A' },
              { icon: ShieldCheck,  label: 'Conformité',               value: 'Conforme', color: '#16A34A' },
              { icon: Radio,        label: 'Statut du service',         value: 'Actif',    color: '#16A34A' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} style={{ color }} className="shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-500">{label}</p>
                  <p className="text-[12px] font-bold" style={{ color }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Fournisseur */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">Configuration du Fournisseur</h2>
              <p className="text-[12px] text-gray-500">Paramètres d'intégration RCS</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#1d4ed8]">
              ⚡ Test de Connexion
            </button>
          </div>

          <div className="space-y-4">
            {/* Fournisseur */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Fournisseur RCS *</label>
              <div className="flex items-center justify-between rounded-xl bg-[#F4511E] px-4 py-3 text-[13px] font-semibold text-white">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  Google RCS Business Messaging
                </div>
                <ChevronLeft size={14} className="-rotate-90" />
              </div>
            </div>

            {/* API Key + Secret */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">API Key *</label>
                <div className="flex items-center gap-1 rounded-xl bg-[#FFEEE6] px-3 ring-1 ring-orange-200">
                  <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 text-[12px] text-[#1F2937] outline-none"
                  />
                  <button onClick={() => setShowKey(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copyText(apiKey)} className="p-1 text-gray-400 hover:text-gray-600"><Copy size={14} /></button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">API Secret *</label>
                <div className="flex items-center gap-1 rounded-xl bg-[#FFEEE6] px-3 ring-1 ring-orange-200">
                  <input type={showSecret ? 'text' : 'password'} value={apiSecret} onChange={e => setApiSecret(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 text-[12px] text-[#1F2937] outline-none"
                  />
                  <button onClick={() => setShowSecret(v => !v)} className="p-1 text-gray-400 hover:text-gray-600">
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Service ID + Webhook */}
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Service ID / Brand ID *</label>
              <input value={serviceId} onChange={e => setServiceId(e.target.value)}
                className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Webhook URL</label>
              <input value={webhook} onChange={e => setWebhook(e.target.value)} placeholder="https://votresite.com/webhook/rcs"
                className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
              />
            </div>

            {/* Options avancées */}
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-3 text-[12px] font-bold text-gray-700">⚙ Options Avancées</p>
              <div className="space-y-2">
                {[
                  { key: 'fallback', label: 'Basculer vers SMS si RCS non supporté', sub: 'Envoi automatique par SMS à la destination non RCS' },
                  { key: 'delivery', label: 'Activer les accusés de livraison', sub: 'Recevez des notifications pour chaque livraison' },
                  { key: 'read',     label: 'Activer les accusés de lecture', sub: 'Recevez des notifications quand le message est lu' },
                ].map(({ key, label, sub }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={opts[key as keyof typeof opts]}
                      onChange={e => setOpts(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="mt-0.5 rounded accent-[#F4511E]"
                    />
                    <div>
                      <p className="text-[12px] font-medium text-[#1F2937]">{label}</p>
                      <p className="text-[10px] text-gray-400">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f]">
              💾 Enregistrer la Configuration
            </button>
          </div>
        </div>

        {/* Profil de Marque */}
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[#1F2937]">🏢 Profil de Marque</h2>
              <p className="text-[12px] text-gray-500">Informations affichées aux destinataires de vos messages RCS</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-semibold text-[#16A34A]">
              <CheckCircle2 size={11} /> Vérifié
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Nom de la Marque *</label>
              <input value={brandNom} onChange={e => setBrandNom(e.target.value)}
                className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Couleur de Marque *</label>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: brandColor }} />
                <input value={brandColor} onChange={e => setBColor(e.target.value)}
                  className="flex-1 rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] font-mono text-[#1F2937] outline-none ring-1 ring-orange-200"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Logo de Marque (URL) *</label>
              <div className="flex items-center gap-2">
                {brandLogo ? (
                  <img src={brandLogo} alt="logo" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                    <Upload size={14} className="text-gray-400" />
                  </div>
                )}
                <input value={brandLogo} onChange={e => setBLogo(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                />
                <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                  <Upload size={13} /> Upload
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Format recommandé : PNG/JPG 512x512px, maximum 100KB</p>
            </div>

            <div className="col-span-2">
              <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Description de la Marque *</label>
              <textarea value={brandDesc} onChange={e => setBDesc(e.target.value)} rows={3}
                className="w-full resize-none rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200"
              />
              <p className="mt-1 text-right text-[10px] text-gray-400">{brandDesc.length}/200 caractères</p>
            </div>

            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Site Web',   value: brandSite,  onChange: setBSite,  icon: '🌐', placeholder: 'https://biargroup.com' },
                { label: 'Téléphone', value: brandTel,   onChange: setBTel,   icon: '📞', placeholder: '+243 978 979 898' },
                { label: 'Email',      value: brandEmail, onChange: setBEmail, icon: '✉',  placeholder: 'contact@biargroup.com' },
              ].map(({ label, value, onChange, icon, placeholder }) => (
                <div key={label}>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">{icon} {label}</label>
                  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 placeholder-orange-300"
                  />
                </div>
              ))}
            </div>
          </div>

          <button className="mt-5 w-full rounded-xl bg-[#F4511E] py-3 text-[13px] font-bold text-white hover:bg-[#d9400f]">
            💾 Enregistrer le Profil de Marque
          </button>
        </div>

        {/* Documentation & Ressources */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#1F2937]">
            📄 Documentation &amp; Ressources
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '<>', title: 'Documentation API',    sub: "Guide d'intégration RCS",  color: '#2563EB', bg: '#EFF6FF' },
              { icon: '📱', title: 'Best Practices',        sub: 'Bonnes pratiques RCS',     color: '#16A34A', bg: '#F0FDF4' },
              { icon: '🎨', title: 'Design Guidelines',     sub: 'Lignes directrices de design', color: '#7C3AED', bg: '#F5F3FF' },
              { icon: '🛡', title: 'Compliance & Security', sub: 'Conformité et sécurité',   color: '#EA580C', bg: '#FFF7ED' },
            ].map(({ icon, title, sub, bg }) => (
              <button key={title} className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-left hover:shadow-sm transition-shadow">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[16px]" style={{ backgroundColor: bg }}>
                  {icon}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#1F2937]">{title}</p>
                  <p className="text-[10px] text-gray-500">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
