import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ShieldCheck, Star, X, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { emailService, type SmtpConfig, type SmtpConfigPayload } from '../../../services/email.service'

// ── Données fournisseurs ──────────────────────────────────────────────────────

const PROVIDERS = [
  {
    key: 'brevo' as const,
    label: 'Brevo',
    sub: 'smtp-relay.brevo.com',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    usernamePlaceholder: 'votre-email@domain.com',
    passwordLabel: 'Clé SMTP Brevo',
    passwordHint: 'Brevo → Paramètres → Clés SMTP & API → Clés SMTP',
    badge: 'Recommandé',
    color: 'bg-blue-600',
  },
  {
    key: 'sendgrid' as const,
    label: 'SendGrid',
    sub: 'smtp.sendgrid.net',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    usernamePlaceholder: 'apikey',
    passwordLabel: 'Clé API SendGrid',
    passwordHint: 'SendGrid → Settings → API Keys → Create API Key',
    badge: '',
    color: 'bg-indigo-600',
  },
  {
    key: 'custom' as const,
    label: 'SMTP Custom',
    sub: 'Votre propre serveur',
    host: '',
    port: 587,
    secure: false,
    usernamePlaceholder: 'username',
    passwordLabel: 'Mot de passe SMTP',
    passwordHint: '',
    badge: '',
    color: 'bg-gray-600',
  },
]

const PROVIDER_COMING_SOON = ['Mailgun', 'Amazon SES', 'Office 365']

// ── Formulaire vide ───────────────────────────────────────────────────────────

const EMPTY_FORM: SmtpConfigPayload & { id?: number } = {
  name: '',
  provider: 'brevo',
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromName: '',
  fromEmail: '',
  replyTo: '',
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function ConfigSmtpPage() {
  const [configs, setConfigs]             = useState<SmtpConfig[]>([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [form, setForm]                   = useState({ ...EMPTY_FORM })
  const [editId, setEditId]               = useState<number | null>(null)
  const [showPassword, setShowPassword]   = useState(false)
  const [saving, setSaving]               = useState(false)
  const [verifyingId, setVerifyingId]     = useState<number | null>(null)
  const [deletingId, setDeletingId]       = useState<number | null>(null)
  const [defaultingId, setDefaultingId]   = useState<number | null>(null)
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null)

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await emailService.getSmtpConfigs()
      setConfigs(data)
    } catch {
      notify('Impossible de charger les configurations', false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Ouvrir modal ajout / édition ──────────────────────────────────────────

  const openAdd = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setShowPassword(false)
    setShowModal(true)
  }

  const openEdit = (cfg: SmtpConfig) => {
    setEditId(cfg.id)
    setForm({
      id: cfg.id,
      name: cfg.name,
      provider: cfg.provider,
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      username: cfg.username,
      password: '',
      fromName: cfg.from_name,
      fromEmail: cfg.from_email,
      replyTo: cfg.reply_to ?? '',
    })
    setShowPassword(false)
    setShowModal(true)
  }

  // ── Sélection provider dans le modal ─────────────────────────────────────

  const selectProvider = (key: 'brevo' | 'sendgrid' | 'custom') => {
    const p = PROVIDERS.find(x => x.key === key)!
    setForm(f => ({
      ...f,
      provider: key,
      host: p.host || f.host,
      port: p.port,
      secure: p.secure,
      username: key === 'sendgrid' ? 'apikey' : f.username,
    }))
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim() || !form.host.trim() || !form.username.trim() || !form.fromEmail.trim() || !form.fromName.trim()) {
      notify('Remplissez tous les champs obligatoires', false)
      return
    }
    if (!editId && !form.password.trim()) {
      notify('Le mot de passe / clé est requis', false)
      return
    }
    setSaving(true)
    try {
      const payload: SmtpConfigPayload = {
        name:      form.name.trim(),
        provider:  form.provider,
        host:      form.host.trim(),
        port:      form.port,
        secure:    form.secure,
        username:  form.username.trim(),
        password:  form.password,
        fromName:  form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
        replyTo:   form.replyTo?.trim() || null,
      }
      if (editId) {
        await emailService.updateSmtpConfig(editId, payload)
        notify('Configuration mise à jour')
      } else {
        await emailService.createSmtpConfig(payload)
        notify('Configuration créée')
      }
      setShowModal(false)
      load()
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde', false)
    } finally {
      setSaving(false)
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleVerify = async (id: number) => {
    setVerifyingId(id)
    try {
      const res = await emailService.verifySmtpConfig(id)
      if (res.verified) {
        notify('Connexion vérifiée ✅')
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_verified: true } : c))
      } else {
        notify('Échec de connexion — vérifiez vos identifiants', false)
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, is_verified: false } : c))
      }
    } catch {
      notify('Erreur lors de la vérification', false)
    } finally {
      setVerifyingId(null)
    }
  }

  const handleSetDefault = async (id: number) => {
    setDefaultingId(id)
    try {
      await emailService.setSmtpDefault(id)
      setConfigs(prev => prev.map(c => ({ ...c, is_default: c.id === id })))
      notify('Configuration définie par défaut')
    } catch {
      notify('Erreur', false)
    } finally {
      setDefaultingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cette configuration SMTP ?')) return
    setDeletingId(id)
    try {
      await emailService.deleteSmtpConfig(id)
      setConfigs(prev => prev.filter(c => c.id !== id))
      notify('Configuration supprimée')
    } catch {
      notify('Erreur lors de la suppression', false)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Infos provider courant dans le modal ─────────────────────────────────

  const currentProvider = PROVIDERS.find(p => p.key === form.provider)!

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalConfigs   = configs.length
  const verifiedCount  = configs.filter(c => c.is_verified).length
  const defaultConfig  = configs.find(c => c.is_default)
  const hasFallback    = !defaultConfig

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-4 sm:px-6 sm:py-5">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white shadow-lg transition-all ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
            {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#1F2937] sm:text-[22px]">Configuration SMTP</h1>
            <p className="mt-0.5 text-[12px] text-gray-500 sm:text-[13px]">Gérez vos serveurs d'envoi email par tenant</p>
          </div>
          <button
            onClick={openAdd}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
          >
            <Plus size={14} /> Nouveau Serveur SMTP
          </button>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Serveurs configurés',
              value: loading ? '—' : String(totalConfigs),
              sub: totalConfigs === 0 ? 'Aucun pour l\'instant' : `${totalConfigs} config${totalConfigs > 1 ? 's' : ''}`,
              color: 'text-[#F4511E]',
              icon: '✉',
            },
            {
              label: 'Serveurs vérifiés',
              value: loading ? '—' : String(verifiedCount),
              sub: totalConfigs > 0 ? `${totalConfigs - verifiedCount} non vérifiés` : '—',
              color: 'text-green-500',
              icon: '✅',
            },
            {
              label: 'Serveur par défaut',
              value: loading ? '—' : (defaultConfig ? defaultConfig.name.split(' ')[0] : 'Aucun'),
              sub: defaultConfig ? `via ${defaultConfig.provider}` : 'Fallback .env actif',
              color: defaultConfig ? 'text-purple-500' : 'text-orange-400',
              icon: '⭐',
            },
            {
              label: 'Fallback système',
              value: hasFallback ? 'Actif' : 'Inactif',
              sub: hasFallback ? 'SMTP .env utilisé' : 'Config tenant active',
              color: hasFallback ? 'text-orange-400' : 'text-green-500',
              icon: '🔄',
            },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <span className={`text-xl ${color}`}>{icon}</span>
              <p className="mt-1 text-[22px] font-bold text-[#1F2937]">{value}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
              <p className={`mt-0.5 text-[10px] font-medium ${color}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Liste des configs */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">Serveurs SMTP Configurés</p>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Chargement...
            </div>
          ) : configs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
              <p className="text-[13px] text-gray-400 mb-3">Aucune configuration SMTP</p>
              <p className="text-[12px] text-gray-400 mb-4">Les emails utilisent actuellement le SMTP système (.env)</p>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f]"
              >
                <Plus size={13} /> Ajouter un serveur SMTP
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map(cfg => {
                const p = PROVIDERS.find(x => x.key === cfg.provider)
                return (
                  <div key={cfg.id} className={`rounded-xl border p-4 ${cfg.is_default ? 'border-[#F4511E]/40 bg-orange-50/30' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${p?.color ?? 'bg-gray-500'}`}>
                          {p?.label ?? cfg.provider}
                        </span>
                        <p className="text-[13px] font-semibold text-[#1F2937]">{cfg.name}</p>
                        {cfg.is_default && (
                          <span className="flex items-center gap-1 rounded-full bg-[#F4511E] px-2 py-0.5 text-[10px] font-semibold text-white">
                            <Star size={9} fill="white" /> Par défaut
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.is_verified ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {cfg.is_verified ? '✓ Vérifié' : '⚠ Non vérifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleVerify(cfg.id)}
                          disabled={verifyingId === cfg.id}
                          title="Tester la connexion"
                          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {verifyingId === cfg.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <ShieldCheck size={11} />
                          }
                          Vérifier
                        </button>
                        {!cfg.is_default && (
                          <button
                            onClick={() => handleSetDefault(cfg.id)}
                            disabled={defaultingId === cfg.id}
                            title="Définir par défaut"
                            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-orange-500 hover:bg-orange-50 disabled:opacity-50"
                          >
                            {defaultingId === cfg.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Star size={11} />
                            }
                            Défaut
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(cfg)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100"
                          title="Modifier"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cfg.id)}
                          disabled={deletingId === cfg.id}
                          className="rounded p-1.5 text-red-300 hover:bg-red-50 disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingId === cfg.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] sm:grid-cols-4">
                      <div><p className="text-gray-400">Serveur</p><p className="font-medium text-gray-700">{cfg.host}:{cfg.port}</p></div>
                      <div><p className="text-gray-400">Identifiant</p><p className="font-medium text-gray-700 truncate">{cfg.username}</p></div>
                      <div><p className="text-gray-400">Expéditeur</p><p className="font-medium text-gray-700 truncate">{cfg.from_name}</p></div>
                      <div><p className="text-gray-400">Email expéditeur</p><p className="font-medium text-gray-700 truncate">{cfg.from_email}</p></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Fournisseurs disponibles */}
        <div className="mb-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[13px] font-semibold text-[#1F2937]">Fournisseurs disponibles (v1)</p>
            <div className="space-y-2">
              {PROVIDERS.map(p => (
                <div key={p.key} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${p.color}`} />
                    <div>
                      <p className="text-[12px] font-semibold text-[#1F2937]">{p.label}</p>
                      <p className="text-[10px] text-gray-400">{p.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.badge && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-[#F4511E]">{p.badge}</span>
                    )}
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-600">Actif</span>
                  </div>
                </div>
              ))}
              {PROVIDER_COMING_SOON.map(name => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-3 py-2.5 opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <p className="text-[12px] font-medium text-gray-500">{name}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">Bientôt</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[13px] font-semibold text-[#1F2937]">Comment ça fonctionne</p>
            <div className="space-y-3 text-[12px] text-gray-600">
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">1</span>
                <p>Ajoutez un serveur SMTP avec vos credentials Brevo ou SendGrid</p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">2</span>
                <p>Cliquez <strong>Vérifier</strong> pour tester la connexion en temps réel</p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F4511E] text-[10px] font-bold text-white">3</span>
                <p>Définissez-le comme <strong>Par défaut</strong> — toutes vos campagnes l'utiliseront automatiquement</p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-[10px] font-bold text-orange-600">!</span>
                <p className="text-orange-600">Sans config active, la plateforme utilise le SMTP système en fallback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guide */}
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📘</span>
            <p className="text-[13px] font-semibold text-[#2563EB]">Webhooks de tracking</p>
          </div>
          <p className="text-[12px] text-gray-600">
            Pour activer le tracking avancé (ouvertures, clics, bounces), configurez les webhooks dans votre dashboard Brevo ou SendGrid
            en pointant vers <code className="rounded bg-blue-100 px-1 text-[11px]">/api/v1/email/webhook/brevo</code> ou <code className="rounded bg-blue-100 px-1 text-[11px]">/api/v1/email/webhook/sendgrid</code>
          </p>
        </div>
      </div>

      <DashboardFooter />

      {/* ── Modal Ajout / Édition ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className="text-[15px] font-bold text-[#1F2937]">
                {editId ? 'Modifier la configuration SMTP' : 'Nouveau serveur SMTP'}
              </p>
              <button onClick={() => setShowModal(false)} className="rounded-full p-1 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Sélection provider */}
              {!editId && (
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-gray-700">Fournisseur</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PROVIDERS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => selectProvider(p.key)}
                        className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                          form.provider === p.key
                            ? 'border-[#F4511E] bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-[12px] font-semibold text-[#1F2937]">{p.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.sub}</p>
                        {p.badge && <span className="mt-1 inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#F4511E]">{p.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">Nom de la configuration <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={`ex: ${currentProvider.label} Principal`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              {/* Host + Port + Secure — seulement pour custom */}
              {form.provider === 'custom' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-[12px] font-semibold text-gray-700">Serveur SMTP <span className="text-red-400">*</span></label>
                    <input
                      value={form.host}
                      onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                      placeholder="smtp.example.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-gray-700">Port</label>
                    <input
                      type="number"
                      value={form.port}
                      onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Info host pour Brevo / SendGrid */}
              {form.provider !== 'custom' && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                  Serveur : <strong>{currentProvider.host}:{currentProvider.port}</strong> (STARTTLS — configuré automatiquement)
                </div>
              )}

              {/* Username */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                  {form.provider === 'sendgrid' ? 'Identifiant (fixe : apikey)' : 'Identifiant / Login'} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder={currentProvider.usernamePlaceholder}
                  readOnly={form.provider === 'sendgrid'}
                  className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-[#F4511E] focus:outline-none ${form.provider === 'sendgrid' ? 'bg-gray-50 text-gray-400' : ''}`}
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">
                  {currentProvider.passwordLabel} {!editId && <span className="text-red-400">*</span>}
                  {editId && <span className="text-[10px] font-normal text-gray-400 ml-1">(laisser vide pour conserver)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={editId ? '••••••••' : 'Entrez votre clé / mot de passe'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-[13px] focus:border-[#F4511E] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {currentProvider.passwordHint && (
                  <p className="mt-1 text-[10px] text-gray-400">💡 {currentProvider.passwordHint}</p>
                )}
              </div>

              {/* From name + From email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-gray-700">Nom expéditeur <span className="text-red-400">*</span></label>
                  <input
                    value={form.fromName}
                    onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))}
                    placeholder="Mon Entreprise"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-gray-700">Email expéditeur <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    value={form.fromEmail}
                    onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))}
                    placeholder="noreply@domain.com"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Reply-to */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-gray-700">Adresse de réponse <span className="text-[10px] font-normal text-gray-400">(optionnel)</span></label>
                <input
                  type="email"
                  value={form.replyTo ?? ''}
                  onChange={e => setForm(f => ({ ...f, replyTo: e.target.value }))}
                  placeholder="support@domain.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#F4511E] focus:outline-none"
                />
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#F4511E] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                {editId ? 'Mettre à jour' : 'Créer la configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
