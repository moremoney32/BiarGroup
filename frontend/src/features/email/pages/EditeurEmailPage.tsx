import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Monitor, Smartphone, Eye, Save, Send, BookMarked,
  Type, Image as ImageIcon, Square, Share2, Code2,
  Trash2, AlertCircle, CheckCircle2, Upload, X, Loader2,
  Bold, Italic, Underline as UnderlineIcon, Link, AlignLeft, AlignCenter, AlignRight, List,
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import ContactGestionModal, { type ContactGroup } from '../components/ContactGestionModal'
import PlanificationModal from '../components/PlanificationModal'
import apiFetch from '../../../services/api'
import PreviewEmailModal from '../components/PreviewEmailModal'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlockType = 'texte' | 'image' | 'bouton' | 'separateur' | 'reseaux' | 'html'

export interface EmailBlock {
  id: string
  type: BlockType
  content: string
  imageUrl: string
  imageAlt: string
  buttonLabel: string
  buttonUrl: string
  buttonColor: string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const BLOCK_DEFS: { type: BlockType; label: string; Icon: React.ElementType; tip: string }[] = [
  { type: 'texte',      label: 'Texte',          Icon: Type,      tip: 'Paragraphe de texte' },
  { type: 'image',      label: 'Image',           Icon: ImageIcon, tip: 'Photo ou bannière' },
  { type: 'bouton',     label: 'Bouton (CTA)',    Icon: Square,    tip: 'Lien cliquable : "Acheter", "S\'inscrire"...' },
  // { type: 'separateur', label: 'Séparateur',   Icon: Minus,     tip: 'Ligne de séparation' },
  { type: 'reseaux',    label: 'Réseaux sociaux', Icon: Share2,    tip: 'Icônes Facebook, LinkedIn...' },
  { type: 'html',       label: 'HTML',            Icon: Code2,     tip: 'Bloc HTML personnalisé' },
]

const VARS = ['{{prenom}}', '{{nom}}', '{{email}}', '{{entreprise}}']

const SOCIAL = [
  { label: 'f',  color: '#1877f2' },
  { label: 'in', color: '#0077b5' },
  { label: 'tw', color: '#1da1f2' },
  { label: 'ig', color: '#e1306c' },
]

const BTN_COLORS = ['#F4511E', '#1a73e8', '#34a853', '#9334e9', '#1F2937']

const makeBlock = (type: BlockType): EmailBlock => ({
  id: `${Date.now()}${Math.random().toString(36).slice(2)}`,
  type,
  content:     type === 'texte' ? 'Nouveau texte...' : type === 'html' ? '<p>Contenu HTML</p>' : '',
  imageUrl:    '',
  imageAlt:    '',
  buttonLabel: 'Cliquez ici',
  buttonUrl:   'https://',
  buttonColor: '#F4511E',
})

const inputCls = 'w-full rounded-lg border border-[#F4511E]/40 bg-[#FFF7F5] px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]'
const editInputCls = 'w-full rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-[#1a73e8]'

// ── Éditeur rich text (TipTap) ────────────────────────────────────────────────

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const ToolBtn = ({
    active, onClick, children, title,
  }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
        active ? 'bg-[#F4511E] text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  const handleSetLink = () => {
    const url = window.prompt('URL du lien :', editor.getAttributes('link').href ?? 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white" onClick={e => e.stopPropagation()}>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
        <ToolBtn title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn title="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={13} />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolBtn title="Aligner à gauche" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn title="Centrer" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn title="Aligner à droite" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={13} />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-gray-200" />

        <ToolBtn title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Lien" active={editor.isActive('link')} onClick={handleSetLink}>
          <Link size={13} />
        </ToolBtn>
      </div>

      {/* Zone de saisie */}
      <EditorContent
        editor={editor}
        className="min-h-[100px] px-3 py-2 text-[13px] text-gray-700 outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_a]:text-[#F4511E] [&_.ProseMirror_a]:underline"
      />
    </div>
  )
}

// ── Composant Image avec upload ────────────────────────────────────────────────

function ImageBlock({ block, sel, onUpdate, onStopPropagation }: {
  block: EmailBlock
  sel: boolean
  onUpdate: (patch: Partial<EmailBlock>) => void
  onStopPropagation: (e: React.MouseEvent) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  // preview base64 local — séparé de block.imageUrl (URL serveur)
  // garantit l'affichage immédiat sans dépendre du réseau
  const [localPreview, setLocalPreview] = useState('')

  // Ce qu'on affiche dans l'éditeur : base64 local en priorité, sinon URL serveur
  const displaySrc = localPreview || block.imageUrl

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileRef.current) fileRef.current.value = ''

    // Validation taille : message immédiat, aucun upload lancé
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(`Image trop lourde — ${(file.size / 1024 / 1024).toFixed(1)} Mo (max 2 Mo). Choisissez une image plus légère.`)
      return
    }

    setUploadError('')

    // Affichage instantané via FileReader (base64) — indépendant du serveur
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      if (b64) {
        setLocalPreview(b64)
        // met aussi à jour l'alt pour la cohérence
        onUpdate({ imageAlt: file.name })
      }
    }
    reader.readAsDataURL(file)

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      const { store } = await import('../../../store/index')
      const token = store.getState().auth.accessToken
      const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
      const res = await fetch(`${baseUrl}/upload/image`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Erreur upload')
      // Upload réussi → URL serveur dans le bloc (pour l'email final)
      // On garde localPreview (base64) pour l'affichage dans l'éditeur
      onUpdate({ imageUrl: json.data.url, imageAlt: file.name })
    } catch (err) {
      // Upload échoué → on garde le localPreview pour afficher quand même
      setUploadError(err instanceof Error ? err.message : 'Erreur upload — aperçu conservé localement')
    } finally {
      setUploading(false)
    }
  }, [onUpdate])

  const openDialog = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalPreview('')
    setUploadError('')
    onUpdate({ imageUrl: '', imageAlt: '' })
  }

  return (
    <div onClick={onStopPropagation}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />

      {displaySrc ? (
        /* Image visible — survol : Changer / Supprimer */
        <div className="group relative">
          <img
            src={displaySrc}
            alt={block.imageAlt}
            className="max-h-60 w-full rounded object-cover"
          />
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
              <span className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700">
                <Upload size={13} className="animate-bounce text-[#F4511E]" /> Envoi en cours...
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 hidden items-center justify-center gap-2 rounded bg-black/30 group-hover:flex">
              <button
                onClick={openDialog}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <Upload size={12} /> Changer
              </button>
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-red-600"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Aucune image — zone de dépôt cliquable */
        <button
          type="button"
          onClick={openDialog}
          disabled={uploading}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-[#F4511E] hover:bg-orange-50 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-[#F4511E]" />
              <p className="text-[12px] font-medium text-[#F4511E]">Upload en cours...</p>
            </>
          ) : (
            <>
              <ImageIcon size={24} className="text-gray-300" />
              <p className="text-[12px] font-medium text-gray-500">Cliquez pour ajouter une image</p>
              <p className="text-[10px] text-gray-400">JPG · PNG · GIF · WEBP · max 2 Mo</p>
            </>
          )}
        </button>
      )}

      {uploadError && (
        <div className="mt-1 flex items-start gap-1.5 rounded bg-red-50 px-2 py-1.5">
          <AlertCircle size={11} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-[10px] leading-snug text-red-500">{uploadError}</p>
        </div>
      )}

      {sel && displaySrc && (
        <div className="mt-2">
          <input
            type="text"
            placeholder="Texte alternatif (accessibilité)"
            value={block.imageAlt}
            onChange={e => onUpdate({ imageAlt: e.target.value })}
            className={editInputCls}
          />
        </div>
      )}
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────

const INITIAL_BLOCKS: EmailBlock[] = [{
  ...makeBlock('texte'),
  id: 'init',
  content: 'Bonjour {{prenom}},\n\nVous recevez cet email car vous êtes inscrit à notre newsletter.',
}]

const CAMPAIGN_CATEGORIES = ['Newsletter', 'Marketing', 'Promotionnel', 'Événement', 'Transactionnel', 'Relationnel']
const TEMPLATE_CATEGORIES = ['Général', ...CAMPAIGN_CATEGORIES]

// Blocs de départ selon le type de campagne
const uid = () => `s${Date.now()}${Math.random().toString(36).slice(2, 5)}`
const makeStarterBlocks = (category: string): EmailBlock[] => {
  switch (category) {
    case 'Newsletter':
      return [
        { id: uid(), type: 'image',   content: '', imageUrl: '', imageAlt: 'Bannière newsletter', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',   content: 'Bonjour {{prenom}},\n\nVoici votre newsletter du mois. Nous avons sélectionné pour vous les meilleures actualités.', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',   content: 'ACTUALITÉ DU MOIS\n\nRédigez ici votre première section...', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',   content: 'À NE PAS MANQUER\n\nRédigez ici votre deuxième section...', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'reseaux', content: '', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
      ]

    case 'Marketing':
    case 'Promotionnel':
      return [
        { id: uid(), type: 'image',  content: '', imageUrl: '', imageAlt: 'Image produit / bannière', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',  content: 'Offre exceptionnelle !\n\nProfitez de notre promotion exclusive — durée limitée.', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'bouton', content: '', imageUrl: '', imageAlt: '', buttonLabel: "Profiter de l'offre →", buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',  content: 'Offre valable jusqu\'au [date]. Conditions générales applicables.', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
      ]

    case 'Événement':
      return [
        { id: uid(), type: 'image',  content: '', imageUrl: '', imageAlt: "Bannière de l'événement", buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',  content: 'NOM DE L\'ÉVÉNEMENT\n\n📅 Date : [jour mois année]\n📍 Lieu : [adresse]\n🕐 Heure : [heure de début]', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'bouton', content: '', imageUrl: '', imageAlt: '', buttonLabel: "Je m'inscris", buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',  content: 'PROGRAMME\n\nDécrivez ici le déroulement de votre événement...', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
      ]

    case 'Transactionnel':
      return [
        { id: uid(), type: 'texte',  content: 'Bonjour {{prenom}},\n\nNous confirmons la bonne réception de votre demande. Voici le récapitulatif :', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#1a73e8' },
        { id: uid(), type: 'texte',  content: 'Référence : [numéro]\nDate : [date]\nMontant : [montant]', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#1a73e8' },
        { id: uid(), type: 'bouton', content: '', imageUrl: '', imageAlt: '', buttonLabel: 'Voir les détails', buttonUrl: 'https://', buttonColor: '#1a73e8' },
        { id: uid(), type: 'texte',  content: 'Une question ? Contactez notre support : support@biargroup.com', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#1a73e8' },
      ]

    case 'Relationnel':
      return [
        { id: uid(), type: 'texte',  content: 'Bonjour {{prenom}},\n\nNous pensons à vous et souhaitons partager ce message avec vous.', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'texte',  content: 'Rédigez ici votre message personnalisé...', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: 'https://', buttonColor: '#F4511E' },
        { id: uid(), type: 'bouton', content: '', imageUrl: '', imageAlt: '', buttonLabel: 'En savoir plus', buttonUrl: 'https://', buttonColor: '#F4511E' },
      ]

    default:
      return INITIAL_BLOCKS
  }
}

export default function EditeurEmailPage() {
  const location = useLocation()

  const [nomCampagne, setNomCampagne] = useState('')
  const [category,    setCategory]    = useState('Marketing')
  const [sujet,      setSujet]      = useState('')
  const [preheader,  setPreheader]  = useState('')
  const [expediteur, setExpediteur] = useState('BIAR GROUP AFRICA')
  const [viewMode,   setViewMode]   = useState<'desktop' | 'mobile'>('desktop')

  const [blocks,        setBlocks]        = useState<EmailBlock[]>(INITIAL_BLOCKS)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [lastCaret,     setLastCaret]     = useState<{ blockId: string; start: number; end: number } | null>(null)
  const [lastAddedId,   setLastAddedId]   = useState<string | null>(null)
  const canvasRef   = useRef<HTMLDivElement>(null)
  const blockRefs   = useRef<Record<string, HTMLDivElement | null>>({})

  const [selectedGroups, setSelectedGroups] = useState<ContactGroup[]>([])

  const [showContacts, setShowContacts] = useState(false)
  const [showPlanif,   setShowPlanif]   = useState(false)
  const [showPreview,  setShowPreview]  = useState(false)

  const [sendError,  setSendError]  = useState('')
  const [savedMsg,   setSavedMsg]   = useState(false)


  // ── Template save ─────────────────────────────────────────────────────────────
  const [showTemplateSave,  setShowTemplateSave]  = useState(false)
  const [templateName,      setTemplateName]      = useState('')
  const [templateCategory,  setTemplateCategory]  = useState('Général')
  const [savingTemplate,    setSavingTemplate]    = useState(false)
  const [templateSaved,     setTemplateSaved]     = useState(false)
  const [templateError,     setTemplateError]     = useState('')

  // ── Chargement depuis location.state (template ou groupe pré-sélectionné) ────
  // Scroll vers le bloc nouvellement ajouté
  useLayoutEffect(() => {
    if (!lastAddedId) return
    const el = blockRefs.current[lastAddedId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [lastAddedId])

  useEffect(() => {
    const state = location.state as { template?: { name: string; sujet: string | null; blocs_json: EmailBlock[] }; preselectedGroup?: ContactGroup } | null
    if (!state) return
    if (state.template) {
      const t = state.template
      setSujet(t.sujet ?? '')
      if (Array.isArray(t.blocs_json) && t.blocs_json.length > 0) setBlocks(t.blocs_json)
    }
    if (state.preselectedGroup) {
      setSelectedGroups([state.preselectedGroup])
    }
    // Nettoie le state pour éviter de recharger à chaque re-render
    window.history.replaceState({}, '')
  }, [])

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) { setTemplateError('Le nom est requis'); return }
    setSavingTemplate(true)
    setTemplateError('')
    try {
      await apiFetch.post('/email/templates', {
        name:      templateName,
        category:  templateCategory,
        sujet:     sujet || null,
        blocsJson: blocks,
      })
      setTemplateSaved(true)
      setShowTemplateSave(false)
      setTemplateName('')
      setTimeout(() => setTemplateSaved(false), 3000)
    } catch (err: unknown) {
      setTemplateError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSavingTemplate(false)
    }
  }

  const resetEditor = () => {
    setNomCampagne('')
    setCategory('Marketing')
    setSujet('')
    setPreheader('')
    setExpediteur('BIAR GROUP AFRICA')
    setBlocks(INITIAL_BLOCKS)
    setSelectedBlock(null)
    setSelectedGroups([])
    setLastCaret(null)
    setSendError('')
    setSavedMsg(false)
  }

  // ── Changement de type de campagne → charge la structure adaptée ────────────

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    const isVirgin = blocks.length === 1 && blocks[0].id === 'init'
    if (isVirgin) {
      setBlocks(makeStarterBlocks(newCategory))
      setSelectedBlock(null)
    } else {
      if (window.confirm(`Charger la structure "${newCategory}" ?\n\nVos blocs actuels seront remplacés.`)) {
        setBlocks(makeStarterBlocks(newCategory))
        setSelectedBlock(null)
      }
    }
  }

  // ── Block helpers ────────────────────────────────────────────────────────────

  const addBlock = (type: BlockType) => {
    const b = makeBlock(type)
    setBlocks(prev => [...prev, b])
    setSelectedBlock(b.id)
    setLastAddedId(b.id)
  }

  const updateBlock = (id: string, patch: Partial<EmailBlock>) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedBlock === id) setSelectedBlock(null)
  }

  // ── Variable insertion ────────────────────────────────────────────────────────

  const insertVariable = (v: string) => {
    if (lastCaret) {
      const { blockId, start, end } = lastCaret
      setBlocks(prev => prev.map(b => {
        if (b.id !== blockId) return b
        return { ...b, content: b.content.slice(0, start) + v + b.content.slice(end) }
      }))
      setLastCaret(c => c ? { ...c, start: c.start + v.length, end: c.start + v.length } : null)
    } else {
      const last = [...blocks].reverse().find(b => b.type === 'texte' || b.type === 'html')
      if (last) updateBlock(last.id, { content: last.content + v })
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!sujet.trim()) {
      setSendError("Veuillez renseigner l'objet avant d'enregistrer.")
      return
    }
    setSendError('')
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  }

  const handleSend = () => {
    if (!nomCampagne.trim()) {
      setSendError('Veuillez renseigner le nom de la campagne avant d\'envoyer.')
      return
    }
    if (!sujet.trim()) {
      setSendError("Veuillez renseigner l'objet de l'email avant d'envoyer.")
      return
    }
    setSendError('')
    setShowPlanif(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-5">

        {/* ── Header ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-[18px] font-bold text-[#1F2937]">Ma nouvelle campagne</h1>

          <div className="flex flex-wrap items-center gap-2">
            {savedMsg && (
              <span className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-[11px] text-green-700">
                <CheckCircle2 size={13} />
                Sauvegardé — {blocks.length} bloc{blocks.length > 1 ? 's' : ''}
                {selectedGroups.length > 0 && ` · ${selectedGroups.length} groupe${selectedGroups.length > 1 ? 's' : ''}`}
              </span>
            )}
            {templateSaved && (
              <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-[11px] text-blue-700">
                <CheckCircle2 size={13} /> Template sauvegardé !
              </span>
            )}

            {/* Desktop / Mobile toggle */}
            <div className="flex rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('desktop')}
                className={`rounded-l-lg border-r border-gray-200 p-2 transition-colors ${viewMode === 'desktop' ? 'bg-[#F4511E]' : 'hover:bg-gray-50'}`}
              >
                <Monitor size={14} className={viewMode === 'desktop' ? 'text-white' : 'text-gray-400'} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`rounded-r-lg p-2 transition-colors ${viewMode === 'mobile' ? 'bg-[#F4511E]' : 'hover:bg-gray-50'}`}
              >
                <Smartphone size={14} className={viewMode === 'mobile' ? 'text-white' : 'text-gray-400'} />
              </button>
            </div>

            <button onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Eye size={13} /> Aperçu
            </button>
            <button onClick={() => setShowTemplateSave(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <BookMarked size={13} /> Template
            </button>
            <button onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
              <Save size={13} /> Enregistrer
            </button>
            <button onClick={handleSend}
              className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]">
              <Send size={13} /> Envoyer
            </button>
          </div>
        </div>

        {/* Erreur envoi */}
        {sendError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] text-red-600">
            <AlertCircle size={13} /> {sendError}
          </div>
        )}

        {/* Modal — Sauvegarder comme template */}
        {showTemplateSave && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#1F2937]">Sauvegarder comme template</p>
              <button onClick={() => { setShowTemplateSave(false); setTemplateError('') }}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <input
                  value={templateName}
                  onChange={e => { setTemplateName(e.target.value); setTemplateError('') }}
                  placeholder="Nom du template (ex: Newsletter Mensuelle)"
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-blue-400"
                />
                <select
                  value={templateCategory}
                  onChange={e => setTemplateCategory(e.target.value)}
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-blue-400"
                >
                  {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {templateError && <p className="text-[11px] text-red-500">{templateError}</p>}
              </div>
              <button
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                className="flex items-center gap-1.5 rounded-lg bg-[#1a73e8] px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingTemplate ? <Loader2 size={13} className="animate-spin" /> : <BookMarked size={13} />}
                Sauvegarder
              </button>
            </div>
          </div>
        )}

        {/* ── Champs campagne ── */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Nom de la campagne *</label>
            <input value={nomCampagne} onChange={e => { setNomCampagne(e.target.value); setSendError('') }}
              className={inputCls} placeholder="Ex: Newsletter Avril 2026" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Type de campagne</label>
            <select value={category} onChange={e => handleCategoryChange(e.target.value)} className={inputCls}>
              {CAMPAIGN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Objet de l'email *</label>
            <input value={sujet} onChange={e => { setSujet(e.target.value); setSendError('') }}
              className={inputCls} placeholder="Ex: Découvrez nos nouveautés" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Preheader (texte d'aperçu)</label>
            <input value={preheader} onChange={e => setPreheader(e.target.value)}
              className={inputCls} placeholder="Texte visible dans la boîte de réception" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Nom de l'expéditeur</label>
            <input value={expediteur} onChange={e => setExpediteur(e.target.value)}
              className={inputCls} />
          </div>
        </div>

        {/* ── Layout 3 colonnes ── */}
        <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-[640px]">

          {/* ── Colonne gauche — Blocs ── */}
          <div className="w-44 shrink-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-[12px] font-semibold text-[#1F2937]">Blocs disponibles</p>
            <div className="space-y-2">
              {BLOCK_DEFS.map(({ type, label, Icon, tip }) => (
                <button key={type} onClick={() => addBlock(type)} title={tip}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-left text-[12px] text-gray-600 hover:border-[#F4511E]/30 hover:bg-orange-50">
                  <Icon size={13} className="shrink-0 text-gray-400" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <p className="mb-1 mt-4 text-[12px] font-semibold text-[#1F2937]">Variables dynamiques</p>
            <p className="mb-2 text-[10px] leading-relaxed text-gray-400">
              Personnalise l'email par destinataire. Ex : "Bonjour {'{{prenom}}'}," devient "Bonjour Jean," pour Jean et "Bonjour Marie," pour Marie.
            </p>
            <div className="space-y-1.5">
              {VARS.map(v => (
                <button key={v} onClick={() => insertVariable(v)}
                  className="w-full rounded-lg bg-[#F4511E] px-3 py-1.5 text-left font-mono text-[11px] font-medium text-white hover:bg-[#d9400f]">
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* ── Centre — Canvas email ── */}
          <div ref={canvasRef} className="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50"
            onClick={() => setSelectedBlock(null)}>
            <div className={`mx-auto my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all ${viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'}`}>

              {/* Header email */}
              <div className="bg-[#F4511E] px-6 py-5 text-center">
                <p className="text-[18px] font-bold text-white">{expediteur || 'BIAR GROUP AFRICA'}</p>
                {sujet && <p className="mt-1 text-[12px] text-white/80">{sujet}</p>}
              </div>

              {/* Blocs */}
              <div className="space-y-1 px-4 py-4">
                {blocks.length === 0 && (
                  <p className="py-10 text-center text-[12px] italic text-gray-300">
                    Cliquez sur un bloc à gauche pour commencer
                  </p>
                )}

                {blocks.map(block => {
                  const sel = selectedBlock === block.id
                  return (
                    <div key={block.id}
                      ref={el => { blockRefs.current[block.id] = el }}
                      className={`group relative rounded-lg border-2 transition-all ${sel ? 'border-[#1a73e8] bg-blue-50/20' : 'border-transparent hover:border-gray-200'}`}
                      onClick={e => { e.stopPropagation(); setSelectedBlock(block.id) }}
                    >
                      {/* Delete btn */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteBlock(block.id) }}
                        className="absolute -right-2 -top-2 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white group-hover:flex">
                        <Trash2 size={9} />
                      </button>

                      <div className="p-2">

                        {/* TEXTE */}
                        {block.type === 'texte' && (
                          <textarea
                            value={block.content}
                            onChange={e => updateBlock(block.id, { content: e.target.value })}
                            onFocus={() => setSelectedBlock(block.id)}
                            onBlur={e => setLastCaret({ blockId: block.id, start: e.target.selectionStart, end: e.target.selectionEnd })}
                            onClick={e => e.stopPropagation()}
                            className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-gray-700 outline-none"
                            rows={Math.max(2, block.content.split('\n').length + 1)}
                          />
                        )}

                        {/* IMAGE */}
                        {block.type === 'image' && (
                          <ImageBlock
                            block={block}
                            sel={sel}
                            onUpdate={patch => updateBlock(block.id, patch)}
                            onStopPropagation={e => e.stopPropagation()}
                          />
                        )}

                        {/* BOUTON */}
                        {block.type === 'bouton' && (
                          <div>
                            <div className="py-1 text-center">
                              <span style={{ backgroundColor: block.buttonColor }}
                                className="inline-block rounded-lg px-5 py-2 text-[13px] font-semibold text-white">
                                {block.buttonLabel || 'Cliquez ici'}
                              </span>
                            </div>
                            {sel && (
                              <div className="mt-2 space-y-1" onClick={e => e.stopPropagation()}>
                                <input type="text" placeholder="Texte du bouton"
                                  value={block.buttonLabel}
                                  onChange={e => updateBlock(block.id, { buttonLabel: e.target.value })}
                                  className={editInputCls} />
                                <input type="url" placeholder="URL du lien (https://...)"
                                  value={block.buttonUrl}
                                  onChange={e => updateBlock(block.id, { buttonUrl: e.target.value })}
                                  className={editInputCls} />
                                <div className="flex items-center gap-2 pt-0.5">
                                  <span className="text-[10px] text-gray-400">Couleur :</span>
                                  {BTN_COLORS.map(c => (
                                    <button key={c}
                                      onClick={() => updateBlock(block.id, { buttonColor: c })}
                                      style={{ backgroundColor: c }}
                                      className={`h-5 w-5 rounded-full border-2 transition-all ${block.buttonColor === c ? 'border-gray-700 scale-110' : 'border-transparent'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SÉPARATEUR */}
                        {block.type === 'separateur' && (
                          <hr className="border-gray-200" />
                        )}

                        {/* RÉSEAUX SOCIAUX */}
                        {block.type === 'reseaux' && (
                          <div className="flex justify-center gap-3 py-1">
                            {SOCIAL.map(s => (
                              <div key={s.label} style={{ backgroundColor: s.color }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white">
                                {s.label}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* HTML */}
                        {block.type === 'html' && (
                          <RichTextEditor
                            value={block.content}
                            onChange={html => updateBlock(block.id, { content: html })}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer email */}
              <div className="border-t border-gray-100 px-6 py-4 text-center">
                <p className="text-[11px] font-medium text-gray-600">{expediteur || 'BIAR GROUP AFRICA'}</p>
                <p className="text-[10px] text-gray-400">SARLU — Kinshasa, RDC</p>
                <div className="mt-2 flex justify-center gap-3">
                  <span className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Se désabonner</span>
                  <span className="text-gray-300">|</span>
                  <span className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Gérer mes préférences</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Colonne droite — Panneaux ── */}
          <div className="w-52 shrink-0 space-y-3">

            {/* Test A/B */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">🔬</span>
                <p className="text-[12px] font-semibold text-[#F4511E]">Test A/B</p>
              </div>
              <p className="mb-2 text-[11px] text-gray-500">Testez différents objets ou contenus</p>
              <button className="w-full rounded-lg bg-[#F4511E] py-1.5 text-[11px] font-semibold text-white opacity-60 cursor-not-allowed">
                Configurer Test A/B
              </button>
            </div>

            {/* Segmentation */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">🎯</span>
                <p className="text-[12px] font-semibold text-[#F4511E]">Segmentation</p>
              </div>
              <p className="mb-2 text-[11px] text-gray-500">Choisissez vos destinataires</p>
              <button onClick={() => setShowContacts(true)}
                className="w-full rounded-lg bg-green-500 py-1.5 text-[11px] font-semibold text-white hover:bg-green-600">
                Sélectionner segments
              </button>
            </div>

            {/* Planification */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">📅</span>
                <p className="text-[12px] font-semibold text-[#F4511E]">Planification</p>
              </div>
              <p className="mb-2 text-[11px] text-gray-500">Envoi immédiat ou programmé</p>
              <button onClick={() => setShowPlanif(true)}
                className="w-full rounded-lg bg-[#F4511E] py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f]">
                Programmer envoi
              </button>
            </div>

            {/* RGPD */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">✅</span>
                <p className="text-[12px] font-semibold text-[#F4511E]">Conformité RGPD</p>
              </div>
              <div className="space-y-1">
                <p className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Lien désinscription</p>
                <p className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Adresse postale</p>
              </div>
            </div>
          </div>
        </div>
        </div> {/* overflow-x-auto */}
      </div>

      <DashboardFooter />

      <ContactGestionModal
        open={showContacts}
        onClose={() => setShowContacts(false)}
        onApply={groups => setSelectedGroups(groups)}
      />
      <PlanificationModal
        open={showPlanif}
        onClose={() => setShowPlanif(false)}
        onSuccess={() => {
          setShowPlanif(false)
          resetEditor()
          // Notifie la Navbar pour qu'elle rafraîchisse le compteur
          window.dispatchEvent(new CustomEvent('email-credits-updated'))
        }}
        nomCampagne={nomCampagne}
        category={category}
        sujet={sujet}
        preheader={preheader}
        expediteur={expediteur}
        blocs={blocks}
        groupesSelectionnes={selectedGroups}
      />
      <PreviewEmailModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        sujet={sujet}
        expediteur={expediteur}
        blocks={blocks}
        isMobile={viewMode === 'mobile'}
      />
    </div>
  )
}
