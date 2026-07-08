import { useState } from 'react'
import { Send, Image, Video, Plus, X, MessageSquare, Eye, BookOpen, MousePointerClick, ThumbsUp, Settings } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { motion } from 'framer-motion'

const TABS = ['Composer', 'Templates', 'Analytics'] as const
type Tab = typeof TABS[number]

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
}

export default function SmsMessagesRcsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Composer')
  const [titre, setTitre]         = useState('')
  const [description, setDesc]    = useState('')
  const [brandColor, setBrand]    = useState('#FE3829')
  const [buttons, setButtons]     = useState([{ label: 'En savoir plus', type: 'Lien URL' }])
  const [suggestions, setSug]     = useState(['Oui', 'Non', 'Plus tard'])

  const removeButton = (i: number) => setButtons(prev => prev.filter((_, idx) => idx !== i))
  const removeSug    = (s: string) => setSug(prev => prev.filter(x => x !== s))

  return (
    <div className="min-h-full bg-white">
      <motion.div className="px-6 py-5" variants={stagger} initial="initial" animate="animate">

        {/* Header */}
        <motion.div className="mb-5" variants={fadeUp}>
          <h1 className="text-[22px] font-bold text-[#1F2937]">Messages RCS (Rich Communication Services)</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Envoyez des messages enrichis avec : images, vidéos, boutons interactifs et bien plus encore</p>
        </motion.div>

        {/* KPIs */}
        <motion.div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4" variants={stagger}>
          {[
            { icon: Send,               label: 'Messages envoyés',   value: '2 456', color: '#3B82F6', bg: '#EFF6FF' },
            { icon: BookOpen,           label: 'Taux de lecture',    value: '89%',   color: '#22C55E', bg: '#F0FDF4' },
            { icon: MessageSquare,      label: "Taux d'interaction", value: '34%',   color: '#8B5CF6', bg: '#F5F3FF' },
            { icon: MousePointerClick,  label: 'Clics boutons',      value: '1 234', color: '#F97316', bg: '#FFF7ED' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <motion.div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" variants={fadeUp}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-[20px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="mb-5 flex gap-0 border-b border-gray-200">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-[13px] font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-[#F4511E] text-[#F4511E]' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Composer' && (
          <div className="flex flex-col gap-5 lg:flex-row">

            {/* Left — Formulaire */}
            <div className="flex-1 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-[15px] font-bold text-[#1F2937]">Créer un message RCS</h2>

                {/* Titre */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Titre du message</label>
                  <input value={titre} onChange={e => setTitre(e.target.value)}
                    placeholder="Nouvelle promotion exclusive"
                    className="w-full rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-700">Description</label>
                  <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
                    placeholder="Découvrez nos nouvelles offres avec -50% sur tous nos produits..."
                    className="w-full resize-none rounded-xl bg-[#FFEEE6] px-4 py-2.5 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200 focus:ring-2 focus:ring-[#F4511E]/40"
                  />
                </div>

                {/* Médias enrichis */}
                <div className="mb-4">
                  <label className="mb-2 block text-[12px] font-semibold text-gray-700">Médias enrichis</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Image,        label: 'Image' },
                      { icon: Video,        label: 'Vidéo' },
                      { icon: MessageSquare,label: 'Gif' },
                      { icon: Eye,          label: 'Carrousel' },
                    ].map(({ icon: Icon, label }) => (
                      <button key={label} className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-3 text-gray-500 hover:border-[#F4511E] hover:text-[#F4511E] transition-colors">
                        <Icon size={18} />
                        <span className="text-[10px] font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-gray-700">Boutons d'action</label>
                    <button onClick={() => setButtons(prev => [...prev, { label: 'Nouveau bouton', type: 'Lien URL' }])}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#F4511E] hover:underline">
                      <Plus size={12} /> Ajouter un bouton
                    </button>
                  </div>
                  {buttons.map((btn, i) => (
                    <div key={i} className="mb-2 flex items-center gap-2">
                      <input value={btn.label} onChange={e => setButtons(prev => prev.map((b, idx) => idx === i ? { ...b, label: e.target.value } : b))}
                        className="flex-1 rounded-xl bg-[#FFEEE6] px-3 py-2 text-[12px] text-[#1F2937] outline-none ring-1 ring-orange-200"
                      />
                      <select value={btn.type} onChange={e => setButtons(prev => prev.map((b, idx) => idx === i ? { ...b, type: e.target.value } : b))}
                        className="rounded-xl border border-gray-200 bg-white px-2 py-2 text-[11px] text-gray-700 outline-none">
                        <option>Lien URL</option><option>Appel</option><option>Localisation</option>
                      </select>
                      <button onClick={() => removeButton(i)} className="rounded p-1 text-gray-400 hover:text-red-400"><X size={13} /></button>
                    </div>
                  ))}
                </div>

                {/* Suggestions */}
                <div className="mb-4">
                  <label className="mb-2 block text-[12px] font-semibold text-gray-700">Suggestions de réponses rapides</label>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map(s => (
                      <span key={s} className="flex items-center gap-1 rounded-full bg-[#FFEEE6] px-2.5 py-1 text-[11px] font-semibold text-[#F4511E]">
                        {s}
                        <button onClick={() => removeSug(s)} className="hover:text-red-500"><X size={10} /></button>
                      </span>
                    ))}
                    <button className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[11px] text-gray-400 hover:border-[#F4511E] hover:text-[#F4511E]">
                      <Plus size={10} /> Ajouter
                    </button>
                  </div>
                </div>

                {/* Couleur de marque */}
                <div className="mb-5">
                  <label className="mb-2 block text-[12px] font-semibold text-gray-700">Couleur de marque</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brandColor} onChange={e => setBrand(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border-0 p-0.5"
                    />
                    <span className="rounded-lg bg-[#FFEEE6] px-3 py-1.5 text-[12px] font-mono font-semibold text-[#F4511E]">
                      {brandColor.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50">
                    <Eye size={14} /> Prévisualiser
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F4511E] py-2.5 text-[12px] font-bold text-white hover:bg-[#d9400f]">
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </div>
            </div>

            {/* Right — Fonctionnalités */}
            <div className="w-full lg:w-[280px] space-y-3">

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-[13px] font-bold text-[#1F2937]">Fonctionnalités RCS</p>
                <div className="space-y-2">
                  {[
                    { icon: '🖼', title: 'Multimédias riches', sub: 'Images, GIFs, vidéos jusqu\'à 10MB', color: '#3B82F6', bg: '#EFF6FF' },
                    { icon: '👁', title: 'Accusés de lecture',  sub: 'Suivi de livraison et lecture',     color: '#22C55E', bg: '#F0FDF4' },
                    { icon: '👆', title: 'Boutons Interactifs', sub: 'Call-to-action pour vos clients',   color: '#F97316', bg: '#FFF7ED' },
                  ].map(({ icon, title, sub, color, bg }) => (
                    <div key={title} className="flex items-start gap-2.5 rounded-xl p-3" style={{ backgroundColor: bg }}>
                      <span className="text-[16px] shrink-0">{icon}</span>
                      <div>
                        <p className="text-[11px] font-bold" style={{ color }}>{title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F5F3FF] p-4">
                <p className="mb-1 text-[12px] font-bold text-[#7C3AED]">🎨 Branding personnalisé</p>
                <p className="text-[11px] text-[#6D28D9]">Personnalisez l'apparence de vos messages avec votre marque</p>
              </div>

              <div className="rounded-2xl bg-[#FFF7ED] p-4">
                <p className="mb-1 text-[12px] font-bold text-[#EA580C]">💡 Astuce</p>
                <p className="text-[11px] text-[#C2410C]">Les messages RCS ont un taux d'ouverture 3x supérieur aux SMS classiques et permettent une interaction directe avec vos clients.</p>
              </div>

            </div>
          </div>
        )}

        {/* ── Onglet Templates (maquette) — démo RCS ── */}
        {activeTab === 'Templates' && (
          <div>
            <button className="mb-5 flex items-center gap-2 rounded-xl bg-[#F4511E]/80 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#F4511E]">
              <Plus size={14} /> Nouveau template
            </button>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { name: 'Promotion Produit',      desc: 'Template pour promotion',  medias: 2, boutons: 3 },
                { name: 'Confirmation Commande',  desc: 'Accusé de réception',      medias: 1, boutons: 2 },
                { name: 'Newsletter',             desc: 'Communication régulière',  medias: 1, boutons: 4 },
              ].map(t => (
                <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-[16px] font-bold text-[#1F2937]">{t.name}</h3>
                  <p className="mt-2 text-[13px] text-gray-600">{t.desc}</p>
                  <div className="mt-3 flex items-center gap-4 text-[12px] text-gray-600">
                    <span className="flex items-center gap-1.5"><Image size={14} /> {t.medias} médias</span>
                    <span className="flex items-center gap-1.5"><ThumbsUp size={14} /> {t.boutons} boutons</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 rounded-xl bg-[#F4511E] py-2.5 text-[13px] font-bold text-white hover:bg-[#d9400f]">
                      Utiliser
                    </button>
                    <button className="rounded-xl p-2 text-gray-500 hover:bg-gray-100" aria-label="Paramètres du template">
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Onglet Analytics (maquette) — démo RCS ── */}
        {activeTab === 'Analytics' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-[16px] font-bold text-[#1F2937]">Taux d'engagement</h3>
              <div className="space-y-5">
                {[
                  { label: 'Taux de livraison', value: 98, color: '#BFDBFE' },
                  { label: 'Taux de lecture',   value: 89, color: '#3B82F6' },
                  { label: 'Taux de clic',      value: 34, color: '#8B5CF6' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[13px] text-gray-700">{label}</span>
                      <span className="text-[15px] font-bold text-[#1F2937]">{value}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-[16px] font-bold text-[#1F2937]">Performances</h3>
              <div className="space-y-3">
                {[
                  { label: 'Meilleur template',      value: 'Newsletter',     color: '#16A34A' },
                  { label: 'Bouton le plus cliqué',  value: 'En savoir plus', color: '#2563EB' },
                  { label: 'Heure optimale',         value: '10h-12h',        color: '#7C3AED' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-[#F8A583]/60 px-4 py-4">
                    <span className="text-[13px] text-[#1F2937]">{label}</span>
                    <span className="text-[14px] font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </motion.div>
      <DashboardFooter />
    </div>
  )
}
