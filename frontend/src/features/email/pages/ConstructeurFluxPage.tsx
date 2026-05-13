import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Play, Pause, Copy, Trash2, Eye,
  Zap, BarChart2, FlaskConical, TrendingUp, Loader2,
} from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import FlowEditorModal, { type EmailFlowItem, type FlowNode, type FlowEdge, type EmailTemplate } from '../components/FlowEditorModal'
import apiFetch from '../../../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Flow {
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'paused'
  trigger_type: string
  node_count: number
  total_contacts: number
  opens: number
  clicks: number
  created_at: string
}

interface FlowStats {
  activeFlows: number
  totalContacts: number
  openRate: number
  totalClics: number
}

// ── Template flows helpers ────────────────────────────────────────────────────

function buildFlow(emails: { name: string; subject: string }[], delayDays: number): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  const edgeStyle = { stroke: '#F4511E', strokeWidth: 1.5 }
  let y = 60

  nodes.push({ id: 't0', type: 'triggerNode', position: { x: 220, y }, data: { nodeType: 'trigger', triggerType: 'subscribe' } })
  y += 130

  let prev = 't0'
  emails.forEach((em, i) => {
    const eid = `em${i}`
    nodes.push({ id: eid, type: 'sendEmailNode', position: { x: 220, y }, data: { nodeType: 'sendEmail', emailName: em.name, subject: em.subject } })
    edges.push({ id: `e_${prev}_${eid}`, source: prev, target: eid, animated: true, style: edgeStyle })
    prev = eid; y += 130

    if (i < emails.length - 1) {
      const did = `d${i}`
      nodes.push({ id: did, type: 'delayNode', position: { x: 220, y }, data: { nodeType: 'delay', delayValue: delayDays, delayUnit: 'jours' } })
      edges.push({ id: `e_${prev}_${did}`, source: prev, target: did, animated: true, style: edgeStyle })
      prev = did; y += 130
    }
  })

  nodes.push({ id: 'end', type: 'endNode', position: { x: 220, y }, data: { nodeType: 'end' } })
  edges.push({ id: `e_${prev}_end`, source: prev, target: 'end', animated: true, style: edgeStyle })

  return { nodes, edges }
}

const TEMPLATES = [
  {
    id: 'lead-b2b', icon: '🚀', name: 'Lead Nurturing B2B',
    description: '7 emails éducatifs sur 21 jours', steps: 12, conversion: 18,
    ...buildFlow([
      { name: 'Email 1', subject: 'Bienvenue dans notre programme B2B' },
      { name: 'Email 2', subject: 'Les 3 erreurs que font vos concurrents' },
      { name: 'Email 3', subject: 'Comment augmenter votre ROI de 40%' },
      { name: 'Email 4', subject: 'Ce que nos clients disent de nous' },
      { name: 'Email 5', subject: 'Une offre spéciale, rien que pour vous' },
      { name: 'Email 6', subject: 'Dernière chance — offre valable 48h' },
      { name: 'Email 7', subject: 'Merci de nous avoir suivis' },
    ], 3),
  },
  {
    id: 'onboarding', icon: '🎓', name: 'Onboarding SaaS',
    description: 'Formation progressive utilisateur', steps: 9, conversion: 65,
    ...buildFlow([
      { name: 'Bienvenue', subject: 'Votre compte est prêt — par où commencer ?' },
      { name: 'Étape 1',   subject: 'Créez votre premier projet en 5 minutes' },
      { name: 'Étape 2',   subject: 'Invitez votre équipe maintenant' },
      { name: 'Check-in',  subject: 'Comment se passe votre démarrage ?' },
    ], 2),
  },
  {
    id: 'reengagement', icon: '🔄', name: 'Réengagement Inactifs',
    description: 'Reconquête avec offres ciblées', steps: 6, conversion: 22,
    ...buildFlow([
      { name: 'Vous nous manquez', subject: 'Cela fait un moment... voici une surprise' },
      { name: 'Offre spéciale',    subject: '30% de réduction — rien que pour vous' },
      { name: 'Dernière chance',   subject: 'Voulez-vous rester abonné ?' },
    ], 5),
  },
  {
    id: 'panier', icon: '🛒', name: 'Panier Abandonné E-commerce',
    description: 'Relance avec urgence et promo', steps: 5, conversion: 35,
    ...buildFlow([
      { name: 'Rappel panier',  subject: 'Vous avez oublié quelque chose !' },
      { name: 'Urgence stock',  subject: 'Stock limité — finalisez votre commande' },
      { name: 'Promo express',  subject: '-10% si vous commandez dans les 2h' },
    ], 1),
  },
  {
    id: 'newsletter', icon: '📰', name: 'Newsletter Automation',
    description: 'Contenu personnalisé hebdo', steps: 8, conversion: 42,
    ...buildFlow([
      { name: 'Newsletter #1', subject: 'Vos actualités de la semaine' },
      { name: 'Newsletter #2', subject: 'Les tendances du marché cette semaine' },
      { name: 'Newsletter #3', subject: 'Ressources exclusives pour vous' },
      { name: 'Newsletter #4', subject: 'Récap mensuel + surprise' },
    ], 7),
  },
  {
    id: 'vip', icon: '🎁', name: 'Programme VIP',
    description: 'Parcours clients premium', steps: 11, conversion: 78,
    ...buildFlow([
      { name: 'Bienvenue VIP',   subject: 'Vous faites maintenant partie du club VIP !' },
      { name: 'Avantages VIP',   subject: 'Vos privilèges exclusifs en détail' },
      { name: 'Offre réservée',  subject: 'Accès prioritaire à notre nouvelle collection' },
      { name: 'Invitation event', subject: 'Vous êtes invité à notre événement privé' },
      { name: 'Anniversaire',    subject: 'Joyeux anniversaire — cadeau à l\'intérieur 🎂' },
    ], 14),
  },
]

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS = {
  active: { label: 'Actif',     color: 'bg-green-100 text-green-700' },
  draft:  { label: 'Brouillon', color: 'bg-gray-100 text-gray-600'   },
  paused: { label: 'En pause',  color: 'bg-amber-100 text-amber-700' },
}

function fmt(n: number) { return n.toLocaleString('fr-FR') }

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConstructeurFluxPage() {
  const [flows,     setFlows]     = useState<Flow[]>([])
  const [stats,     setStats]     = useState<FlowStats | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading,   setLoading]   = useState(true)

  // Editor modal
  const [editorFlow,   setEditorFlow]   = useState<EmailFlowItem | null | undefined>(undefined)
  const [showEditor,   setShowEditor]   = useState(false)

  // In-flight actions
  const [acting, setActing] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, sRes, tRes] = await Promise.all([
        apiFetch.get<{ data: Flow[] }>('/email/flows'),
        apiFetch.get<{ data: FlowStats }>('/email/flows/stats'),
        apiFetch.get<{ data: EmailTemplate[] }>('/email/templates'),
      ])
      setFlows(fRes.data ?? [])
      setStats(sRes.data ?? null)
      setTemplates(tRes.data ?? [])
    } catch { /* empty state */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditorFlow(null); setShowEditor(true) }

  const openFromTemplate = (tpl: typeof TEMPLATES[0]) => {
    setEditorFlow({ name: tpl.name, description: tpl.description, nodes_json: tpl.nodes as FlowNode[], edges_json: tpl.edges as FlowEdge[] })
    setShowEditor(true)
  }

  const openEdit = async (flow: Flow) => {
    try {
      const res = await apiFetch.get<{ data: EmailFlowItem }>(`/email/flows/${flow.id}`)
      setEditorFlow(res.data)
      setShowEditor(true)
    } catch { /* ignore */ }
  }

  const handleStatus = async (flow: Flow) => {
    const next = flow.status === 'active' ? 'paused' : 'active'
    setActing(flow.id)
    try {
      await apiFetch.put(`/email/flows/${flow.id}/status`, { status: next })
      setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, status: next } : f))
    } finally { setActing(null) }
  }

  const handleDuplicate = async (id: number) => {
    setActing(id)
    try {
      await apiFetch.post(`/email/flows/${id}/duplicate`, {})
      await load()
    } finally { setActing(null) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce flow ?')) return
    setActing(id)
    try {
      await apiFetch.delete(`/email/flows/${id}`)
      setFlows(prev => prev.filter(f => f.id !== id))
    } finally { setActing(null) }
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 py-5 sm:px-6 sm:py-6">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4511E]/10 sm:h-10 sm:w-10">
              <Zap size={16} className="text-[#F4511E] sm:text-[18px]" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold text-[#1F2937] sm:text-[22px]">Email Flow Builder</h1>
              <p className="text-[12px] text-gray-500 sm:text-[13px]">Créez des campagnes email automatisées intelligentes avec l'éditeur visuel</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="flex w-fit items-center gap-2 rounded-xl bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#d9400f] transition-colors sm:px-5 sm:py-2.5 sm:text-[13px]"
          >
            <Plus size={14} /> Créer un Flow
          </button>
        </div>

        {/* ── Pourquoi les Email Flows ── */}
        <div className="mb-6 rounded-2xl border border-[#F4511E]/15 bg-gradient-to-br from-orange-50/60 to-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <p className="text-[14px] font-bold text-[#1F2937]">Pourquoi utiliser les Email Flows ?</p>
          </div>
          <p className="mb-4 text-[12px] text-gray-500">
            Les Email Flows automatisent vos campagnes marketing et augmentent drastiquement vos conversions grâce à des parcours personnalisés.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { Icon: Zap,          color: 'text-blue-600',   bg: 'bg-blue-50',   title: 'Email Drip',      sub: 'Séquence goutte-à-goutte' },
              { Icon: TrendingUp,   color: 'text-purple-600', bg: 'bg-purple-50', title: 'Comportemental',  sub: 'Basé sur les actions' },
              { Icon: FlaskConical, color: 'text-pink-600',   bg: 'bg-pink-50',   title: 'A/B Testing',     sub: 'Optimisation continue' },
              { Icon: BarChart2,    color: 'text-green-600',  bg: 'bg-green-50',  title: 'Analytics',       sub: 'Suivi en temps réel' },
            ].map(({ Icon, color, bg, title, sub }) => (
              <div key={title} className={`flex items-start gap-3 rounded-xl ${bg} p-3`}>
                <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                <div>
                  <p className="text-[12px] font-semibold text-[#1F2937]">{title}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Flows actifs',      value: loading ? '—' : String(stats?.activeFlows ?? 0) },
            { label: 'Total contacts',    value: loading ? '—' : fmt(stats?.totalContacts ?? 0) },
            { label: "Taux d'ouverture",  value: loading ? '—' : `${stats?.openRate ?? 0}%` },
            { label: 'Total clics',       value: loading ? '—' : fmt(stats?.totalClics ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] text-gray-500">{label}</p>
              <p className="mt-1 text-[22px] font-bold text-[#1F2937]">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Templates prédéfinis ── */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Templates de Flow Email prédéfinis</h2>
            <p className="mt-0.5 text-[12px] text-gray-400">Démarrez en un clic avec des séquences éprouvées</p>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="rounded-xl border border-gray-100 p-4 hover:border-[#F4511E]/30 hover:shadow-sm transition-all">
                <div className="mb-3 flex items-start gap-3">
                  <span className="text-2xl">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1F2937] truncate">{tpl.name}</p>
                    <p className="text-[11px] text-gray-500">{tpl.description}</p>
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {tpl.steps} étapes
                  </span>
                  <span className="text-[11px] font-semibold text-green-600">{tpl.conversion}% conversion</span>
                </div>
                <button
                  onClick={() => openFromTemplate(tpl)}
                  className="w-full rounded-lg border border-[#F4511E]/30 bg-[#FFF7F5] py-2 text-[12px] font-semibold text-[#F4511E] hover:bg-[#F4511E] hover:text-white transition-colors"
                >
                  Utiliser ce template
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mes Flows Email ── */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-50 px-5 py-4 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#1F2937]">Mes Flows Email</h2>
            <span className="text-[11px] text-gray-400">{flows.length} flow{flows.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 size={22} className="animate-spin text-[#F4511E]" />
            </div>
          ) : flows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Zap size={20} className="text-gray-400" />
              </div>
              <p className="text-[13px] font-semibold text-gray-500">Aucun flow créé</p>
              <p className="mt-1 text-[12px] text-gray-400">Cliquez sur "Créer un Flow" ou utilisez un template</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {flows.map(flow => {
                const st = STATUS[flow.status]
                const openRate = flow.total_contacts > 0 ? Math.round((flow.opens / flow.total_contacts) * 100 * 10) / 10 : 0
                return (
                  <div key={flow.id} className="px-4 py-4 hover:bg-gray-50/50 transition-colors sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap sm:gap-4">
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[14px] font-bold text-[#1F2937] truncate">{flow.name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                        </div>
                        {flow.description && (
                          <p className="text-[12px] text-gray-500 truncate">{flow.description}</p>
                        )}
                        {/* Stats row */}
                        <div className="mt-2 flex flex-wrap gap-4">
                          {[
                            { label: 'Étapes',       value: `${flow.node_count} nœuds` },
                            { label: 'Contacts',     value: fmt(flow.total_contacts) },
                            { label: 'Ouvertures',   value: fmt(flow.opens),  color: 'text-blue-500' },
                            { label: 'Clics',        value: fmt(flow.clicks), color: 'text-green-500' },
                            { label: 'Taux ouverture', value: `${openRate}%` },
                          ].map(({ label, value, color }) => (
                            <div key={label}>
                              <p className="text-[10px] text-gray-400">{label}</p>
                              <p className={`text-[13px] font-bold ${color ?? 'text-[#1F2937]'}`}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1.5">
                        {acting === flow.id
                          ? <Loader2 size={16} className="animate-spin text-gray-400" />
                          : <>
                            <button
                              onClick={() => openEdit(flow)}
                              className="rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f] transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => {/* preview */}}
                              title="Prévisualiser"
                              className="rounded-full border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(flow.id)}
                              title="Dupliquer"
                              className="rounded-full border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleStatus(flow)}
                              title={flow.status === 'active' ? 'Mettre en pause' : 'Activer'}
                              className={`rounded-full border p-1.5 transition-colors ${
                                flow.status === 'active'
                                  ? 'border-amber-200 text-amber-500 hover:bg-amber-50'
                                  : 'border-green-200 text-green-500 hover:bg-green-50'
                              }`}
                            >
                              {flow.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                            </button>
                            <button
                              onClick={() => handleDelete(flow.id)}
                              title="Supprimer"
                              className="rounded-full border border-red-100 p-1.5 text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <DashboardFooter />

      {showEditor && (
        <FlowEditorModal
          flow={editorFlow}
          templates={templates}
          onClose={() => setShowEditor(false)}
          onSaved={load}
        />
      )}
    </div>
  )
}
