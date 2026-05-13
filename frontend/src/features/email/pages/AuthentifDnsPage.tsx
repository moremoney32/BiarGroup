import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Copy, Plus, Trash2, CheckCircle, XCircle, Clock, ExternalLink, Globe } from 'lucide-react'
import { emailService, EmailDomain } from '../../../services/email.service'
import DashboardFooter from '../../../components/layout/DashboardFooter'
import { useToast } from '../../../hooks/useToast'

// ─── Types DNS ────────────────────────────────────────────────────────────────

type DnsStatus = 'unknown' | 'ok' | 'fail'
type Provider = 'brevo' | 'sendgrid' | 'custom'

interface DnsRecord {
  type: 'SPF' | 'DKIM' | 'DMARC'
  host: string
  recordType: string
  value: string | null
  note?: string
  dashboardUrl?: string
  dashboardLabel?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDnsRecords(domain: string, provider: Provider): DnsRecord[] {
  if (provider === 'brevo') {
    return [
      {
        type: 'SPF',
        host: '@',
        recordType: 'TXT',
        value: 'v=spf1 include:spf.brevo.com mx ~all',
      },
      {
        type: 'DKIM',
        host: 'brevo._domainkey',
        recordType: 'TXT',
        value: null,
        note: 'La valeur DKIM est générée par Brevo. Récupérez-la dans votre tableau de bord Brevo.',
        dashboardUrl: 'https://app.brevo.com/senders/domain',
        dashboardLabel: 'Ouvrir dashboard Brevo →',
      },
      {
        type: 'DMARC',
        host: '_dmarc',
        recordType: 'TXT',
        value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      },
    ]
  }

  if (provider === 'sendgrid') {
    return [
      {
        type: 'SPF',
        host: '@',
        recordType: 'TXT',
        value: 'v=spf1 include:sendgrid.net ~all',
      },
      {
        type: 'DKIM',
        host: 's1._domainkey',
        recordType: 'CNAME',
        value: null,
        note: 'SendGrid génère des enregistrements CNAME uniques à votre compte. Récupérez-les dans votre dashboard.',
        dashboardUrl: 'https://app.sendgrid.com/settings/sender_auth',
        dashboardLabel: 'Ouvrir Sender Authentication →',
      },
      {
        type: 'DMARC',
        host: '_dmarc',
        recordType: 'TXT',
        value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
      },
    ]
  }

  return [
    {
      type: 'SPF',
      host: '@',
      recordType: 'TXT',
      value: 'v=spf1 include:VOTRE_FOURNISSEUR mx ~all',
      note: 'Remplacez VOTRE_FOURNISSEUR par la valeur SPF indiquée par votre prestataire email.',
    },
    {
      type: 'DKIM',
      host: 'default._domainkey',
      recordType: 'TXT',
      value: null,
      note: 'Récupérez la clé publique DKIM dans le dashboard de votre prestataire email.',
    },
    {
      type: 'DMARC',
      host: '_dmarc',
      recordType: 'TXT',
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    },
  ]
}

function getScore(d: EmailDomain) {
  return [d.spf_status, d.dkim_status, d.dmarc_status].filter(s => s === 'ok').length
}

function scoreColor(score: number) {
  if (score === 3) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 1) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-gray-400 bg-gray-50 border-gray-200'
}

function providerLabel(p: Provider) {
  if (p === 'brevo') return { label: 'Brevo', color: 'bg-blue-100 text-blue-700' }
  if (p === 'sendgrid') return { label: 'SendGrid', color: 'bg-indigo-100 text-indigo-700' }
  return { label: 'Personnalisé', color: 'bg-gray-100 text-gray-600' }
}

// ─── Messages contextuels par type + statut ───────────────────────────────────

interface StatusMessage {
  variant: 'success' | 'error' | 'pending'
  text: string
  tip?: string
}

function getStatusMessage(
  type: 'SPF' | 'DKIM' | 'DMARC',
  status: DnsStatus,
  domain: string,
  provider: Provider
): StatusMessage | null {
  if (status === 'ok') {
    const labels: Record<string, string> = {
      SPF: 'Les serveurs destinataires reconnaissent votre autorisation d\'envoi.',
      DKIM: 'Vos emails sont signés cryptographiquement — authenticité garantie.',
      DMARC: 'La politique DMARC est en place — protection contre l\'usurpation active.',
    }
    return { variant: 'success', text: labels[type] }
  }

  if (status === 'unknown') {
    return {
      variant: 'pending',
      text: 'Non encore vérifié. Configurez cet enregistrement chez votre registrar puis cliquez "Vérifier".',
    }
  }

  // fail — message précis selon le type
  if (type === 'SPF') {
    const expected = provider === 'brevo'
      ? 'v=spf1 include:spf.brevo.com mx ~all'
      : provider === 'sendgrid'
      ? 'v=spf1 include:sendgrid.net ~all'
      : 'v=spf1 include:VOTRE_FOURNISSEUR mx ~all'
    return {
      variant: 'error',
      text: `Enregistrement SPF introuvable sur "${domain}".`,
      tip: `Vérifiez que vous avez bien ajouté un TXT sur "@" avec la valeur : ${expected}. Si un SPF existe déjà, ajoutez le include sans créer un second enregistrement TXT.`,
    }
  }

  if (type === 'DKIM') {
    const dkimHost = provider === 'brevo'
      ? `brevo._domainkey.${domain}`
      : provider === 'sendgrid'
      ? `s1._domainkey.${domain}`
      : `default._domainkey.${domain}`
    const provLabel = provider === 'brevo' ? 'Brevo' : provider === 'sendgrid' ? 'SendGrid' : 'votre fournisseur'
    return {
      variant: 'error',
      text: `Enregistrement DKIM introuvable sur "${dkimHost}".`,
      tip: `Vérifiez que la valeur est correctement copiée depuis votre dashboard ${provLabel}. Attention : certains registrars (OVH, GoDaddy) ajoutent ".${domain}" automatiquement — dans ce cas entrez uniquement le préfixe sans répéter le domaine.`,
    }
  }

  if (type === 'DMARC') {
    return {
      variant: 'error',
      text: `Enregistrement DMARC introuvable sur "_dmarc.${domain}".`,
      tip: `Ajoutez un TXT sur "_dmarc" (certains registrars : entrez "_dmarc" sans ".${domain}") avec la valeur : v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
    }
  }

  return null
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatusDot({ status }: { status: DnsStatus }) {
  if (status === 'ok')
    return <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600"><CheckCircle size={12} /> Vérifié</span>
  if (status === 'fail')
    return <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500"><XCircle size={12} /> Échec</span>
  return <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400"><Clock size={12} /> En attente</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
    >
      <Copy size={10} />
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}

interface DnsRecordRowProps {
  record: DnsRecord
  status: DnsStatus
  domain: string
  provider: Provider
}

function DnsRecordRow({ record, status, domain, provider }: DnsRecordRowProps) {
  const msg = getStatusMessage(record.type, status, domain, provider)

  const borderColor = status === 'ok'
    ? 'border-green-100'
    : status === 'fail'
    ? 'border-red-100'
    : 'border-gray-100'

  return (
    <div className={`rounded-lg border bg-white overflow-hidden ${borderColor}`}>
      {/* Header row */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${borderColor} ${
        status === 'ok' ? 'bg-green-50/50' : status === 'fail' ? 'bg-red-50/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#1F2937]">{record.type}</span>
          <span className="text-[10px] text-gray-400 font-medium">{record.recordType}</span>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Fields */}
      <div className="p-3 space-y-2">
        {/* Host */}
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">Nom d'hôte (Host)</p>
          <div className="flex items-center justify-between rounded-md bg-[#1F2937] px-3 py-1.5">
            <span className="text-[11px] font-mono text-white">{record.host}</span>
            <CopyButton text={record.host} />
          </div>
        </div>

        {/* Value */}
        <div>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {record.value ? 'Valeur' : 'Valeur (à récupérer)'}
          </p>
          {record.value ? (
            <div className="flex items-center justify-between rounded-md bg-[#F4511E] px-3 py-1.5">
              <span className="text-[11px] font-mono text-white truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[260px]">{record.value}</span>
              <CopyButton text={record.value} />
            </div>
          ) : (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <p className="text-[11px] text-amber-700">{record.note}</p>
              {record.dashboardUrl && (
                <a
                  href={record.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#F4511E] hover:underline"
                >
                  <ExternalLink size={10} />
                  {record.dashboardLabel}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Note si value existe */}
        {record.value && record.note && (
          <p className="text-[10px] text-gray-400 italic">{record.note}</p>
        )}

        {/* Message contextuel statut */}
        {msg && (
          <div className={`rounded-md px-3 py-2 text-[11px] leading-relaxed ${
            msg.variant === 'success'
              ? 'bg-green-50 text-green-700'
              : msg.variant === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-gray-50 text-gray-500'
          }`}>
            <p className="font-semibold">{msg.text}</p>
            {msg.tip && <p className="mt-0.5 text-[10px] opacity-80">{msg.tip}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AuthentifDnsPage() {
  const [domains, setDomains] = useState<EmailDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newProvider, setNewProvider] = useState<Provider>('brevo')
  const [adding, setAdding] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await emailService.getDomains()
      setDomains(data)
    } catch {
      toast.error('Impossible de charger les domaines')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleVerify(id: number) {
    setVerifying(id)
    try {
      const updated = await emailService.verifyDomain(id)
      setDomains(prev => prev.map(d => d.id === id ? updated : d))
      const score = getScore(updated)
      if (score === 3) toast.success('Excellent ! Les 3 enregistrements sont valides.')
      else toast.info(`Vérification terminée — ${score}/3 enregistrement(s) valide(s)`)
    } catch {
      toast.error('Erreur lors de la vérification DNS')
    } finally {
      setVerifying(null)
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id)
    try {
      await emailService.deleteDomain(id)
      setDomains(prev => prev.filter(d => d.id !== id))
      toast.success('Domaine supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  async function handleAdd() {
    const trimmed = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!trimmed) return
    setAdding(true)
    try {
      await emailService.addDomain({ domain: trimmed, provider: newProvider })
      await load()
      setShowAdd(false)
      setNewDomain('')
      setNewProvider('brevo')
      toast.success(`Domaine ${trimmed} ajouté — configurez maintenant vos enregistrements DNS`)
    } catch {
      toast.error("Ce domaine existe déjà ou une erreur s'est produite")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-4 sm:px-6 sm:py-5">

        {/* ── Header ── */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-[#1F2937] sm:text-[22px]">Authentification DNS &amp; Délivrabilité</h1>
            <p className="mt-0.5 text-[12px] text-gray-500 sm:text-[13px]">
              Configurez SPF, DKIM et DMARC pour que vos emails arrivent en boîte de réception, pas en spam
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex w-fit items-center gap-2 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] transition-colors"
          >
            <Plus size={13} /> Ajouter un domaine
          </button>
        </div>

        {/* ── Explications ── */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-[12px] font-semibold text-blue-700 mb-1">Comment ça fonctionne ?</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Ajoutez votre nom de domaine d'envoi, choisissez votre fournisseur SMTP (Brevo ou SendGrid),
            puis copiez les enregistrements DNS indiqués chez votre registrar (GoDaddy, OVH, Cloudflare, cPanel…).
            Une fois configurés, cliquez <strong>Vérifier</strong> — nous testons en temps réel que les enregistrements sont détectés.
          </p>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex justify-center py-16 text-gray-400 text-[13px]">
            <RefreshCw size={16} className="animate-spin mr-2" /> Chargement des domaines…
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && domains.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Globe size={24} className="text-gray-400" />
            </div>
            <p className="text-[14px] font-semibold text-[#1F2937]">Aucun domaine configuré</p>
            <p className="mt-1 text-[12px] text-gray-500 max-w-xs">
              Ajoutez votre premier domaine d'envoi pour commencer à configurer SPF, DKIM et DMARC.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] transition-colors"
            >
              <Plus size={13} /> Ajouter un domaine
            </button>
          </div>
        )}

        {/* ── Liste des domaines ── */}
        {!loading && domains.length > 0 && (
          <div className="space-y-6">
            {domains.map(domain => {
              const score = getScore(domain)
              const records = getDnsRecords(domain.domain, domain.provider)
              const prov = providerLabel(domain.provider)

              return (
                <div key={domain.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-[#1F2937] sm:text-[15px]">{domain.domain}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${prov.color}`}>
                        {prov.label}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold sm:hidden ${scoreColor(score)}`}>
                        {score}/3
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Score badge — desktop seulement */}
                      <span className={`hidden rounded-full border px-2.5 py-0.5 text-[11px] font-bold sm:inline ${scoreColor(score)}`}>
                        {score}/3
                        {score === 3 ? ' ✓ Parfait' : score === 0 ? ' — Non vérifié' : ' — Incomplet'}
                      </span>
                      <button
                        onClick={() => handleVerify(domain.id)}
                        disabled={verifying === domain.id}
                        className="flex items-center gap-1.5 rounded-lg bg-[#F4511E] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60 transition-colors"
                      >
                        <RefreshCw size={11} className={verifying === domain.id ? 'animate-spin' : ''} />
                        {verifying === domain.id ? 'Vérification…' : 'Vérifier'}
                      </button>
                      <button
                        onClick={() => handleDelete(domain.id)}
                        disabled={deleting === domain.id}
                        className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-100 disabled:opacity-60 transition-colors"
                      >
                        <Trash2 size={11} />
                        {deleting === domain.id ? '…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>

                  {/* Statuts rapides */}
                  <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    {[
                      { label: 'SPF', status: domain.spf_status },
                      { label: 'DKIM', status: domain.dkim_status },
                      { label: 'DMARC', status: domain.dmarc_status },
                    ].map(({ label, status }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[12px] font-semibold text-[#1F2937]">{label}</span>
                        <StatusDot status={status as DnsStatus} />
                      </div>
                    ))}
                  </div>

                  {/* Enregistrements DNS */}
                  <div className="p-4 space-y-3">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Enregistrements à ajouter chez votre registrar
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {records.map(record => (
                        <DnsRecordRow
                          key={record.type}
                          record={record}
                          domain={domain.domain}
                          provider={domain.provider}
                          status={
                            record.type === 'SPF' ? domain.spf_status as DnsStatus
                            : record.type === 'DKIM' ? domain.dkim_status as DnsStatus
                            : domain.dmarc_status as DnsStatus
                          }
                        />
                      ))}
                    </div>

                    {/* Dernière vérif */}
                    {domain.last_checked_at && (
                      <p className="text-[10px] text-gray-400 text-right mt-1">
                        Dernière vérification : {new Date(domain.last_checked_at).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Instructions générales ── */}
        {!loading && (
          <div className="mt-6 mb-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-semibold text-[#1F2937] mb-2">Où ajouter ces enregistrements ?</p>
            <ol className="space-y-1.5">
              {[
                "Connectez-vous au panneau d'administration de votre registrar (GoDaddy, OVH, Cloudflare, cPanel…)",
                'Cherchez la section "Gestion DNS", "Zone DNS" ou "Enregistrements DNS"',
                'Ajoutez chaque enregistrement avec le type, le nom d\'hôte et la valeur indiqués',
                "La propagation DNS peut prendre de quelques minutes à 48 heures",
                'Une fois configuré, revenez ici et cliquez "Vérifier" sur votre domaine',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                  <span className="shrink-0 font-bold text-[#F4511E]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* ── Modal Ajouter domaine ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-[16px] font-bold text-[#1F2937] mb-1">Ajouter un domaine</h2>
            <p className="text-[12px] text-gray-500 mb-4">
              Entrez le domaine depuis lequel vous enverrez vos emails (ex : monentreprise.com)
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Nom de domaine</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="monentreprise.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-[#1F2937] placeholder-gray-400 focus:border-[#F4511E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fournisseur SMTP associé</label>
                <select
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value as Provider)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-[#1F2937] focus:border-[#F4511E] focus:outline-none"
                >
                  <option value="brevo">Brevo</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => { setShowAdd(false); setNewDomain(''); setNewProvider('brevo') }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || !newDomain.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#F4511E] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d9400f] disabled:opacity-60 transition-colors"
              >
                {adding ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                {adding ? 'Ajout…' : 'Ajouter le domaine'}
              </button>
            </div>
          </div>
        </div>
      )}

      <DashboardFooter />
    </div>
  )
}
