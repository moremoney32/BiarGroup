import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow, ReactFlowProvider, addEdge,
  useNodesState, useEdgesState, Controls, Background, BackgroundVariant,
  Handle, Position, useReactFlow,
  type Connection, type Edge, type Node, type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  X, Eye, Save, Zap, Mail, GitBranch, Clock,
  FlaskConical, Settings, CheckCircle2, Loader2, ChevronDown,
} from 'lucide-react'
import apiFetch from '../../../services/api'

// ── Types ────────────────────────────────────────────────────────────────────

type FlowNodeType = 'trigger' | 'sendEmail' | 'condition' | 'delay' | 'abTest' | 'action' | 'end'

export interface FlowNodeData extends Record<string, unknown> {
  nodeType: FlowNodeType
  triggerType?: string
  emailName?: string
  subject?: string
  templateId?: number
  templateName?: string
  conditionLabel?: string
  delayValue?: number
  delayUnit?: string
  actionType?: string
  actionValue?: string
}

export type FlowNode = Node<FlowNodeData>
export type FlowEdge = Edge

// ── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS = [
  { value: 'subscribe',  label: "Contact s'inscrit à la newsletter" },
  { value: 'purchase',   label: 'Effectue un achat' },
  { value: 'open_email', label: 'Ouvre un email' },
  { value: 'click_link', label: 'Clique un lien' },
  { value: 'tag_added',  label: 'Tag ajouté au contact' },
]

const TRIGGER_LABELS = Object.fromEntries(TRIGGER_OPTIONS.map(o => [o.value, o.label]))

const COMPONENT_DEFS = [
  { type: 'triggerNode',   label: 'Déclencheur',  Icon: Zap,          b: 'border-green-300',  bg: 'bg-green-50',  t: 'text-green-700' },
  { type: 'sendEmailNode', label: 'Envoyer Email', Icon: Mail,         b: 'border-blue-300',   bg: 'bg-blue-50',   t: 'text-blue-700' },
  { type: 'conditionNode', label: 'Condition',     Icon: GitBranch,    b: 'border-purple-300', bg: 'bg-purple-50', t: 'text-purple-700' },
  { type: 'delayNode',     label: 'Délai',         Icon: Clock,        b: 'border-orange-300', bg: 'bg-orange-50', t: 'text-orange-700' },
  { type: 'abTestNode',    label: 'A/B Test',      Icon: FlaskConical, b: 'border-pink-300',   bg: 'bg-pink-50',   t: 'text-pink-700' },
  { type: 'actionNode',    label: 'Action',        Icon: Settings,     b: 'border-red-300',    bg: 'bg-red-50',    t: 'text-red-700' },
  { type: 'endNode',       label: 'Fin',           Icon: CheckCircle2, b: 'border-gray-300',   bg: 'bg-gray-50',   t: 'text-gray-600' },
] as const

const DEFAULT_DATA: Record<string, FlowNodeData> = {
  triggerNode:   { nodeType: 'trigger',   triggerType: 'subscribe' },
  sendEmailNode: { nodeType: 'sendEmail', emailName: 'Nouvel email', subject: '' },
  conditionNode: { nodeType: 'condition', conditionLabel: 'A ouvert le dernier email ?' },
  delayNode:     { nodeType: 'delay',     delayValue: 3, delayUnit: 'jours' },
  abTestNode:    { nodeType: 'abTest',    emailName: 'A/B Test' },
  actionNode:    { nodeType: 'action',    actionType: 'add_tag', actionValue: '' },
  endNode:       { nodeType: 'end' },
}

// ── Custom nodes (outside component for stable ref) ──────────────────────────

function Wrap({ children, border, selected }: { children: React.ReactNode; border: string; selected?: boolean }) {
  return (
    <div className={`rounded-xl border-2 bg-white shadow-sm min-w-[220px] transition-shadow ${border} ${selected ? 'shadow-lg ring-2 ring-offset-1 ring-[#F4511E]/30' : ''}`}>
      {children}
    </div>
  )
}

function TriggerNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  return (
    <Wrap border="border-green-400" selected={selected}>
      <div className="flex items-center gap-2 rounded-t-xl border-b border-green-100 bg-green-50 px-4 py-2.5">
        <Zap size={13} className="text-green-600" />
        <span className="text-[12px] font-semibold text-green-700">Déclencheur</span>
      </div>
      <div className="px-4 py-2.5">
        <p className="text-[11px] text-gray-600">{TRIGGER_LABELS[String(d.triggerType ?? 'subscribe')] ?? 'Non configuré'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-green-400" />
    </Wrap>
  )
}

function SendEmailNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  return (
    <Wrap border="border-blue-400" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-blue-400" />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-blue-100 bg-blue-50 px-4 py-2.5">
        <Mail size={13} className="text-blue-600" />
        <span className="text-[12px] font-semibold text-blue-700">{String(d.emailName || 'Envoyer Email')}</span>
      </div>
      <div className="px-4 py-2.5">
        {d.subject
          ? <p className="text-[11px] text-gray-600">Sujet : {String(d.subject)}</p>
          : <p className="text-[11px] italic text-gray-400">Sujet non configuré</p>}
        {d.templateName && <p className="mt-0.5 text-[10px] text-gray-400">{String(d.templateName)}</p>}
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-blue-400" />
    </Wrap>
  )
}

function ConditionNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  return (
    <Wrap border="border-purple-400" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-purple-400" />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-purple-100 bg-purple-50 px-4 py-2.5">
        <GitBranch size={13} className="text-purple-600" />
        <span className="text-[12px] font-semibold text-purple-700">Condition</span>
      </div>
      <div className="px-4 py-2.5">
        <p className="text-[11px] text-gray-600">{String(d.conditionLabel || 'Condition non configurée')}</p>
        <div className="mt-2 flex gap-2">
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">OUI → Email 2</span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">NON → Relance</span>
        </div>
      </div>
      <Handle type="source" id="yes" position={Position.Bottom} style={{ left: '30%' }} className="!h-3 !w-3 !border-2 !border-white !bg-green-400" />
      <Handle type="source" id="no"  position={Position.Bottom} style={{ left: '70%' }} className="!h-3 !w-3 !border-2 !border-white !bg-red-400" />
    </Wrap>
  )
}

function DelayNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  return (
    <Wrap border="border-orange-400" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-orange-400" />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-orange-100 bg-orange-50 px-4 py-2.5">
        <Clock size={13} className="text-orange-600" />
        <span className="text-[12px] font-semibold text-orange-700">Délai</span>
      </div>
      <div className="px-4 py-2.5">
        <p className="text-[11px] font-medium text-orange-600">
          Attendre {String(d.delayValue ?? 3)} {String(d.delayUnit ?? 'jours')}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-orange-400" />
    </Wrap>
  )
}

function AbTestFlowNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  return (
    <Wrap border="border-pink-400" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-pink-400" />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-pink-100 bg-pink-50 px-4 py-2.5">
        <FlaskConical size={13} className="text-pink-600" />
        <span className="text-[12px] font-semibold text-pink-700">A/B Test</span>
      </div>
      <div className="px-4 py-2.5">
        <p className="text-[11px] italic text-gray-400">{d.emailName ? String(d.emailName) : 'Non configuré'}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-pink-400" />
    </Wrap>
  )
}

function ActionNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData
  const labels: Record<string, string> = { add_tag: 'Ajouter tag', remove_tag: 'Supprimer tag', unsubscribe: 'Désabonner' }
  return (
    <Wrap border="border-red-400" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-red-400" />
      <div className="flex items-center gap-2 rounded-t-xl border-b border-red-100 bg-red-50 px-4 py-2.5">
        <Settings size={13} className="text-red-600" />
        <span className="text-[12px] font-semibold text-red-700">Action</span>
      </div>
      <div className="px-4 py-2.5">
        <p className="text-[11px] text-gray-600">
          {labels[String(d.actionType ?? 'add_tag')]}{d.actionValue ? ` : ${d.actionValue}` : ''}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-white !bg-red-400" />
    </Wrap>
  )
}

function EndNode({ selected }: NodeProps) {
  return (
    <Wrap border="border-gray-300" selected={selected}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-white !bg-gray-400" />
      <div className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
        <CheckCircle2 size={13} className="text-gray-500" />
        <span className="text-[12px] font-semibold text-gray-600">Fin du flow</span>
      </div>
    </Wrap>
  )
}

const nodeTypes = {
  triggerNode:   TriggerNode,
  sendEmailNode: SendEmailNode,
  conditionNode: ConditionNode,
  delayNode:     DelayNode,
  abTestNode:    AbTestFlowNode,
  actionNode:    ActionNode,
  endNode:       EndNode,
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EmailFlowItem {
  id?: number
  name: string
  description?: string
  nodes_json?: FlowNode[]
  edges_json?: FlowEdge[]
  group_ids_json?: number[]
}

export interface EmailTemplate {
  id: number
  name: string
  sujet: string | null
}

interface Props {
  flow?: EmailFlowItem | null
  onClose: () => void
  onSaved: () => void
  templates: EmailTemplate[]
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inp = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]/40'
const sel = 'w-full appearance-none rounded-lg border border-gray-200 px-3 py-2 pr-7 text-[12px] text-gray-700 outline-none focus:border-[#F4511E]/40'

// ── Inner component ───────────────────────────────────────────────────────────

function FlowEditorContent({ flow, onClose, onSaved, templates }: Props) {
  const { screenToFlowPosition } = useReactFlow()

  const startNodes: FlowNode[] = flow?.nodes_json?.length
    ? flow.nodes_json
    : [{ id: 'trigger-1', type: 'triggerNode', position: { x: 220, y: 60 }, data: { nodeType: 'trigger', triggerType: 'subscribe' } }]

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(startNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(flow?.edges_json ?? [])
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [flowName,   setFlowName]       = useState(flow?.name ?? 'Nouveau Flow')
  const [saving,     setSaving]         = useState(false)
  const [saveErr,    setSaveErr]        = useState('')
  const [groups,     setGroups]         = useState<{ id: number; name: string }[]>([])
  const [groupIds,   setGroupIds]       = useState<number[]>(flow?.group_ids_json ?? [])
  const [showPreview, setShowPreview]   = useState(false)

  useEffect(() => {
    apiFetch.get<{ data: { id: number; name: string }[] }>('/contacts/groups')
      .then(r => setGroups(r.data ?? []))
      .catch(() => {})
  }, [])

  const toggleGroup = (id: number) =>
    setGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  const selected = nodes.find(n => n.id === selectedId) ?? null

  const onConnect = useCallback((c: Connection) => {
    const src = nodes.find(n => n.id === c.source)
    const label = src?.type === 'conditionNode'
      ? (c.sourceHandle === 'yes' ? 'OUI' : 'NON')
      : undefined
    setEdges(eds => addEdge({
      ...c,
      animated: true,
      label,
      labelStyle: { fontSize: 10, fontWeight: 600 },
      style: { stroke: '#F4511E', strokeWidth: 1.5 },
    }, eds))
  }, [nodes, setEdges])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/reactflow')
    if (!type) return
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const id = `${type}-${Date.now()}`
    setNodes(ns => [...ns, { id, type, position: pos, data: DEFAULT_DATA[type] ?? { nodeType: 'end' } }])
    setSelectedId(id)
  }, [screenToFlowPosition, setNodes])

  const update = useCallback((patch: Partial<FlowNodeData>) => {
    if (!selectedId) return
    setNodes(ns => ns.map(n => n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n))
  }, [selectedId, setNodes])

  const save = async () => {
    if (!flowName.trim()) { setSaveErr('Donnez un nom au flow'); return }
    setSaving(true); setSaveErr('')
    try {
      const body = {
        name:        flowName,
        description: flow?.description ?? '',
        nodesJson:   nodes,
        edgesJson:   edges,
        triggerType: nodes.find(n => n.type === 'triggerNode')?.data?.triggerType ?? 'subscribe',
        groupIds,
      }
      if (flow?.id) await apiFetch.put(`/email/flows/${flow.id}`, body)
      else           await apiFetch.post('/email/flows', body)
      onSaved(); onClose()
    } catch {
      setSaveErr('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const renderProps = () => {
    if (!selected) return null
    const d = selected.data

    if (selected.type === 'triggerNode') return (
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-600">Type de déclencheur</label>
        <div className="relative">
          <select value={String(d.triggerType ?? 'subscribe')} onChange={e => update({ triggerType: e.target.value })} className={sel}>
            {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
    )

    if (selected.type === 'sendEmailNode') return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Nom interne</label>
          <input value={String(d.emailName ?? '')} onChange={e => update({ emailName: e.target.value })} className={inp} placeholder="Email de bienvenue" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Sujet</label>
          <input value={String(d.subject ?? '')} onChange={e => update({ subject: e.target.value })} className={inp} placeholder="Bienvenue {{first_name}} !" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Template</label>
          <div className="relative">
            <select
              value={Number(d.templateId ?? 0)}
              onChange={e => {
                const tid = Number(e.target.value)
                const tpl = templates.find(t => t.id === tid)
                update({ templateId: tid, templateName: tpl?.name ?? '' })
              }}
              className={sel}
            >
              <option value={0}>— Sélectionner —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}{t.sujet ? ` — ${t.sujet}` : ''}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="mt-2 w-full rounded-lg border border-[#F4511E]/30 py-1.5 text-[11px] font-medium text-[#F4511E] hover:bg-orange-50">
            Modifier le template
          </button>
        </div>
      </div>
    )

    if (selected.type === 'conditionNode') return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Condition</label>
          <div className="relative">
            <select value={String(d.conditionLabel ?? 'A ouvert le dernier email ?')} onChange={e => update({ conditionLabel: e.target.value })} className={sel}>
              <option value="A ouvert le dernier email ?">A ouvert le dernier email ?</option>
              <option value="A cliqué un lien ?">A cliqué un lien ?</option>
              <option value="Possède un tag spécifique ?">Possède un tag spécifique ?</option>
              <option value="A effectué un achat ?">A effectué un achat ?</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-700">
          💡 Utilisez les conditions pour créer des parcours adaptatifs basés sur l'engagement (ouverture, clic, téléchargement).
        </div>
      </div>
    )

    if (selected.type === 'delayNode') return (
      <div>
        <label className="mb-1 block text-[11px] font-semibold text-gray-600">Durée d'attente</label>
        <div className="flex gap-2">
          <input
            type="number" min={1} max={365}
            value={Number(d.delayValue ?? 3)}
            onChange={e => update({ delayValue: Number(e.target.value) })}
            className={`${inp} w-20`}
          />
          <div className="relative flex-1">
            <select value={String(d.delayUnit ?? 'jours')} onChange={e => update({ delayUnit: e.target.value })} className={sel}>
              <option value="heures">Heures</option>
              <option value="jours">Jours</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
    )

    if (selected.type === 'actionNode') return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Action</label>
          <div className="relative">
            <select value={String(d.actionType ?? 'add_tag')} onChange={e => update({ actionType: e.target.value })} className={sel}>
              <option value="add_tag">Ajouter un tag</option>
              <option value="remove_tag">Supprimer un tag</option>
              <option value="unsubscribe">Désabonner le contact</option>
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        {d.actionType !== 'unsubscribe' && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-gray-600">Valeur du tag</label>
            <input value={String(d.actionValue ?? '')} onChange={e => update({ actionValue: e.target.value })} className={inp} placeholder="Ex: client_vip" />
          </div>
        )}
      </div>
    )

    if (selected.type === 'abTestNode') return (
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-600">Nom interne</label>
          <input value={String(d.emailName ?? '')} onChange={e => update({ emailName: e.target.value })} className={inp} placeholder="A/B Test bienvenue" />
        </div>
        <div className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-2.5 text-[11px] text-pink-700">
          💡 Configure les objets A et B via le module A/B Testing dans Campagnes Email.
        </div>
      </div>
    )

    return <p className="text-[11px] italic text-gray-400">Aucune configuration nécessaire.</p>
  }

  // Parcourt le graphe depuis le déclencheur et retourne les étapes dans l'ordre
  const buildPreviewSteps = () => {
    type Step = { id: string; type: string; data: FlowNodeData; totalDelay: number; branch?: string }
    const steps: Step[] = []
    const visited = new Set<string>()
    let totalDelay = 0

    const trigger = nodes.find(n => n.type === 'triggerNode')
    if (!trigger) return steps

    const traverse = (nodeId: string, delay: number, branch?: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return
      if (node.type === 'delayNode') delay += Number(node.data.delayValue ?? 0)
      steps.push({ id: nodeId, type: node.type ?? '', data: node.data, totalDelay: delay, branch })
      const outgoing = edges.filter(e => e.source === nodeId)
      outgoing.forEach(e => traverse(e.target, delay, e.label ? String(e.label) : undefined))
    }

    traverse(trigger.id, 0)
    return steps
  }

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-3">
        <div>
          <input
            value={flowName}
            onChange={e => setFlowName(e.target.value)}
            className="-ml-1 rounded border border-transparent bg-transparent px-1 text-[17px] font-bold text-[#1F2937] outline-none hover:border-gray-200 focus:border-[#F4511E]/40"
          />
          <p className="mt-0.5 text-[11px] text-gray-400">Glissez-déposez les éléments pour créer votre parcours email</p>
        </div>
        <div className="flex items-center gap-2">
          {saveErr && <span className="text-[11px] text-red-500">{saveErr}</span>}
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-[12px] font-medium transition-colors ${
              showPreview ? 'border-[#F4511E] bg-[#FFF7F5] text-[#F4511E]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Eye size={13} /> Prévisualiser
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="w-48 shrink-0 overflow-y-auto border-r border-gray-100 bg-white p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Composants</p>
          <div className="space-y-1.5">
            {COMPONENT_DEFS.map(({ type, label, Icon, b, bg, t }) => (
              <div
                key={type}
                draggable
                onDragStart={e => { e.dataTransfer.setData('application/reactflow', type); e.dataTransfer.effectAllowed = 'move' }}
                className={`flex cursor-grab select-none items-center gap-2.5 rounded-xl border-2 ${b} ${bg} px-3 py-2 active:cursor-grabbing`}
              >
                <Icon size={13} className={t} />
                <span className={`text-[12px] font-medium ${t}`}>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Variables</p>
            {['{{first_name}}', '{{last_name}}', '{{company}}', '{{email}}'].map(v => (
              <div key={v} className="mb-1.5 cursor-default select-all rounded-lg bg-[#F4511E] px-3 py-1.5 font-mono text-[10px] font-medium text-white">
                {v}
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Groupe cible</p>
            <p className="mb-2 text-[9px] text-gray-400 leading-relaxed">Les contacts ajoutés à ce groupe démarreront ce flow automatiquement.</p>
            {groups.length === 0 ? (
              <p className="text-[10px] italic text-gray-400">Aucun groupe disponible — créez d'abord un groupe dans Contacts.</p>
            ) : (
              <div className="space-y-1.5">
                {groups.map(g => (
                  <label key={g.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={groupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                      className="h-3 w-3 accent-[#F4511E] shrink-0"
                    />
                    <span className="truncate text-[11px] text-gray-700">{g.name}</span>
                  </label>
                ))}
              </div>
            )}
            {groupIds.length > 0 && (
              <p className="mt-2 text-[10px] font-semibold text-[#F4511E]">
                {groupIds.length} groupe{groupIds.length > 1 ? 's' : ''} sélectionné{groupIds.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            className="!bg-[#FFF0EC]"
          >
            <Background color="#F4511E" gap={32} size={1} variant={BackgroundVariant.Dots} style={{ opacity: 0.12 }} />
            <Controls className="!shadow-sm" />
          </ReactFlow>
        </div>

        {/* Right panel — propriétés du nœud sélectionné */}
        {selected && !showPreview && (
          <div className="w-64 shrink-0 overflow-y-auto border-l border-gray-100 bg-white p-5">
            <p className="mb-5 text-[13px] font-bold text-[#1F2937]">Propriétés</p>
            {renderProps()}
          </div>
        )}

        {/* Right panel — prévisualisation du flow */}
        {showPreview && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-100 bg-white p-5">
            <p className="mb-1 text-[13px] font-bold text-[#1F2937]">Aperçu du flow</p>
            <p className="mb-4 text-[10px] text-gray-400">Ordre d'exécution basé sur vos connexions</p>
            {(() => {
              const steps = buildPreviewSteps()
              if (steps.length === 0) return (
                <p className="text-[11px] italic text-gray-400">Aucun nœud connecté. Glissez des composants et reliez-les.</p>
              )
              const icons: Record<string, string> = {
                triggerNode:   '⚡',
                sendEmailNode: '📧',
                delayNode:     '⏱',
                conditionNode: '🔀',
                abTestNode:    '🧪',
                actionNode:    '⚙️',
                endNode:       '✅',
              }
              const labels: Record<string, string> = {
                triggerNode:   'Déclencheur',
                sendEmailNode: 'Envoyer Email',
                delayNode:     'Délai',
                conditionNode: 'Condition',
                abTestNode:    'A/B Test',
                actionNode:    'Action',
                endNode:       'Fin',
              }
              return (
                <div className="space-y-0">
                  {steps.map((step, i) => {
                    const isDelay = step.type === 'delayNode'
                    const isEnd   = step.type === 'endNode'
                    return (
                      <div key={step.id} className="flex gap-3">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] ${
                            isEnd ? 'bg-green-100' : isDelay ? 'bg-orange-100' : 'bg-[#FFF7F5] border border-[#F4511E]/20'
                          }`}>
                            {icons[step.type] ?? '•'}
                          </div>
                          {i < steps.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 my-1" style={{ minHeight: '16px' }} />
                          )}
                        </div>
                        {/* Contenu */}
                        <div className="pb-3 pt-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#1F2937]">{labels[step.type] ?? step.type}</span>
                            {step.branch && (
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${step.branch === 'OUI' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {step.branch}
                              </span>
                            )}
                            {step.totalDelay > 0 && step.type !== 'delayNode' && (
                              <span className="text-[9px] text-gray-400">J+{step.totalDelay}</span>
                            )}
                          </div>
                          {step.type === 'triggerNode' && (
                            <p className="text-[10px] text-gray-500">{TRIGGER_LABELS[String(step.data.triggerType ?? 'subscribe')]}</p>
                          )}
                          {step.type === 'sendEmailNode' && (
                            <p className="text-[10px] text-gray-500 truncate">{String(step.data.subject || step.data.emailName || '—')}</p>
                          )}
                          {step.type === 'delayNode' && (
                            <p className="text-[10px] font-medium text-orange-600">Attendre {String(step.data.delayValue ?? 3)} {String(step.data.delayUnit ?? 'jours')}</p>
                          )}
                          {step.type === 'conditionNode' && (
                            <p className="text-[10px] text-gray-500">{String(step.data.conditionLabel ?? '')}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Exported component ────────────────────────────────────────────────────────

export default function FlowEditorModal(props: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <ReactFlowProvider>
        <FlowEditorContent {...props} />
      </ReactFlowProvider>
    </div>
  )
}
