import { Undo2, Redo2, Monitor, Smartphone, Eye, Save, Send, Type, Image, Square, Minus, Share2, Code2 } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'

const blocks = ['Texte', 'Image', 'Bouton', 'Séparateur', 'Réseaux sociaux', 'HTML']
const blockIcons = [Type, Image, Square, Minus, Share2, Code2]

const dynamicVars = ['{{prenom}}', '{{nom}}', '{{email}}', '{{entreprise}}']

const properties = [
  { icon: '🔬', label: 'Test A/B', sub: 'Testez différents objets ou contenus', btn: 'Configurer Test A/B', btnColor: 'bg-[#F4511E]' },
  { icon: '🎯', label: 'Segmentation', sub: 'Choisissez vos destinataires', btn: 'Sélectionner segments', btnColor: 'bg-green-500' },
  { icon: '📅', label: 'Planification', sub: 'Envoi immédiat ou programmé', btn: 'Programmer envoi', btnColor: 'bg-[#F4511E]' },
  { icon: '✅', label: 'Conformité RGPD', sub: '', links: ['Lien désinscription', 'Adresse postale'] },
]

export default function EditeurEmailPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-bold text-[#1F2937]">Ma nouvelle campagne</h1>
            <div className="flex gap-1">
              <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Undo2 size={14} /></button>
              <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100"><Redo2 size={14} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200">
              <button className="rounded-l-lg border-r border-gray-200 bg-[#F4511E] p-2">
                <Monitor size={14} className="text-white" />
              </button>
              <button className="rounded-r-lg p-2 text-gray-400 hover:bg-gray-50">
                <Smartphone size={14} />
              </button>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Eye size={13} /> Aperçu
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Save size={13} /> Enregistrer
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
              <Send size={13} /> Envoyer
            </button>
          </div>
        </div>

        {/* Fields row */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Objet de l'email *</label>
            <input
              className="w-full rounded-lg border border-[#F4511E]/40 bg-[#FFF7F5] px-3 py-2 text-[12px] text-gray-700 outline-none"
              placeholder="Ex: Découvrez nos nouveautés"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Preheader (texte d'aperçu)</label>
            <input
              className="w-full rounded-lg border border-[#F4511E]/40 bg-[#FFF7F5] px-3 py-2 text-[12px] text-gray-700 outline-none"
              placeholder="Texte visible dans la boîte de réception"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Nom de l'expéditeur</label>
            <input
              className="w-full rounded-lg border border-[#F4511E]/40 bg-[#FFF7F5] px-3 py-2 text-[12px] text-gray-700 outline-none"
              defaultValue="BIAR GROUP AFRICA"
            />
          </div>
        </div>

        {/* Editor layout */}
        <div className="flex gap-4">
          {/* Left — Blocs */}
          <div className="w-44 shrink-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[12px] font-semibold text-[#1F2937]">Blocs disponibles</p>
            <div className="space-y-2">
              {blocks.map((b, i) => {
                const Icon = blockIcons[i]
                return (
                  <div key={b} className="flex cursor-grab items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-[12px] text-gray-600 hover:border-[#F4511E]/30 hover:bg-orange-50">
                    <Icon size={13} className="text-gray-400" />
                    {b}
                  </div>
                )
              })}
            </div>
            <p className="mt-4 mb-2 text-[12px] font-semibold text-[#1F2937]">Variables dynamiques</p>
            <div className="space-y-1.5">
              {dynamicVars.map(v => (
                <div key={v} className="rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-mono font-medium text-white cursor-pointer">
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* Center — Preview */}
          <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50">
            <div className="rounded-xl overflow-hidden shadow-sm max-w-sm mx-auto mt-6 mb-6 bg-white border border-gray-200">
              <div className="bg-[#F4511E] px-6 py-5 text-center">
                <p className="text-[18px] font-bold text-white">BIAR GROUP AFRICA</p>
                <p className="text-[12px] text-white/80 mt-1">Objet de votre email</p>
              </div>
              <div className="px-6 py-5 text-[13px] text-gray-700">
                <p className="mb-3">Bonjour {'{{prenom}}'},</p>
                <p className="mb-4 leading-relaxed text-[12px] text-gray-500">
                  Vous recevez cet email car vous êtes inscrit à notre newsletter
                </p>
                <div className="border-t border-gray-100 pt-4 text-center text-[11px] text-gray-400">
                  <p className="font-medium text-gray-600">BIAR GROUP AFRICA</p>
                  <p>SARLU — Kinshasa, RDC</p>
                  <div className="mt-2 flex justify-center gap-3">
                    <span className="text-[#F4511E] cursor-pointer hover:underline">Se désabonner</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[#F4511E] cursor-pointer hover:underline">Gérer mes préférences</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Properties */}
          <div className="w-52 shrink-0 space-y-3">
            {properties.map(({ icon, label, sub, btn, btnColor, links }) => (
              <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base">{icon}</span>
                  <p className="text-[12px] font-semibold text-[#F4511E]">{label}</p>
                </div>
                {sub && <p className="mb-2 text-[11px] text-gray-500">{sub}</p>}
                {btn && (
                  <button className={`w-full rounded-lg py-1.5 text-[11px] font-semibold text-white ${btnColor}`}>
                    {btn}
                  </button>
                )}
                {links && (
                  <div className="space-y-1">
                    {links.map(l => (
                      <p key={l} className="text-[11px] text-[#F4511E] hover:underline cursor-pointer">{l}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  )
}
