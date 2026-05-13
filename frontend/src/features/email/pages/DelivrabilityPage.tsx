import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { emailService, EmailStats, EmailDomain, SmtpConfig } from '../../../services/email.service'
import DashboardFooter from '../../../components/layout/DashboardFooter'

// ─── Calcul du score de réputation ────────────────────────────────────────────

function computeScore(stats: EmailStats | null, dnsScore: number, dnsMax: number): number {
  if (!stats) return 0
  let score = 0
  // Délivrabilité — 40 pts
  score += Math.min(40, (stats.deliverRate / 100) * 40)
  // Rebond — 30 pts (0% = 30pts, 5%+ = 0pts)
  score += Math.max(0, 30 - (stats.bounceRate / 5) * 30)
  // Spam — 20 pts (0% = 20pts, 0.5%+ = 0pts)
  score += Math.max(0, 20 - (stats.spamRate / 0.5) * 20)
  // DNS — 10 pts
  score += dnsMax > 0 ? (dnsScore / dnsMax) * 10 : 0
  return Math.round(score)
}

function scoreLabel(score: number): { label: string; color: string; border: string; bg: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600', border: 'border-green-400', bg: 'bg-green-50 border-green-100' }
  if (score >= 60) return { label: 'Bon', color: 'text-amber-500', border: 'border-amber-400', bg: 'bg-amber-50 border-amber-100' }
  if (score >= 40) return { label: 'Moyen', color: 'text-orange-500', border: 'border-orange-400', bg: 'bg-orange-50 border-orange-100' }
  return { label: 'Faible', color: 'text-red-500', border: 'border-red-400', bg: 'bg-red-50 border-red-100' }
}

// ─── Recommandations dynamiques ───────────────────────────────────────────────

interface Reco {
  ok: boolean
  text: string
  sub: string
}

function generateRecos(stats: EmailStats | null, dnsScore: number, dnsMax: number, smtp: SmtpConfig[]): Reco[] {
  const list: Reco[] = []

  if (!stats || stats.totalSent === 0) {
    list.push({ ok: false, text: 'Aucune campagne envoyée', sub: 'Créez et envoyez votre première campagne pour obtenir des statistiques.' })
    return list
  }

  // Rebond
  if (stats.bounceRate > 5) {
    list.push({ ok: false, text: `Taux de rebond critique (${stats.bounceRate}%)`, sub: 'Nettoyez immédiatement votre liste. Au-dessus de 5%, votre réputation est en danger.' })
  } else if (stats.bounceRate > 2) {
    list.push({ ok: false, text: `Taux de rebond élevé (${stats.bounceRate}%)`, sub: 'Retirez les adresses invalides. Objectif : rester sous 2%.' })
  } else {
    list.push({ ok: true, text: `Taux de rebond maîtrisé (${stats.bounceRate}%)`, sub: 'Vous êtes sous le seuil de 2% — bonne hygiène de liste.' })
  }

  // Spam
  if (stats.spamRate > 0.1) {
    list.push({ ok: false, text: `Plaintes spam trop élevées (${stats.spamRate}%)`, sub: 'Vérifiez votre contenu et vos pratiques d\'opt-in. Seuil critique : 0.1%.' })
  } else {
    list.push({ ok: true, text: `Plaintes spam sous contrôle (${stats.spamRate}%)`, sub: 'Vos contacts apprécient vos emails — taux de plaintes dans la norme.' })
  }

  // DNS
  if (dnsMax === 0) {
    list.push({ ok: false, text: 'Aucun domaine DNS configuré', sub: 'Configurez SPF, DKIM et DMARC pour améliorer votre délivrabilité.' })
  } else if (dnsScore < dnsMax) {
    list.push({ ok: false, text: `Configuration DNS incomplète (${dnsScore}/${dnsMax})`, sub: 'Certains enregistrements SPF/DKIM/DMARC sont manquants ou invalides.' })
  } else {
    list.push({ ok: true, text: 'Authentification DNS complète', sub: 'SPF, DKIM et DMARC sont correctement configurés sur tous vos domaines.' })
  }

  // SMTP
  const hasVerifiedSmtp = smtp.some(c => c.is_default && c.is_verified)
  if (!hasVerifiedSmtp) {
    list.push({ ok: false, text: 'Aucun SMTP vérifié configuré', sub: 'Vos emails utilisent le serveur de secours. Configurez votre propre SMTP.' })
  } else {
    const def = smtp.find(c => c.is_default && c.is_verified)!
    list.push({ ok: true, text: `SMTP actif : ${def.name}`, sub: `Envoi via ${def.from_email} (${def.provider})` })
  }

  return list
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function DnsStatusIcon({ status }: { status: string }) {
  if (status === 'ok') return <CheckCircle size={13} className="text-green-500" />
  if (status === 'fail') return <XCircle size={13} className="text-red-400" />
  return <Clock size={13} className="text-gray-300" />
}

function domainScore(d: EmailDomain) {
  return [d.spf_status, d.dkim_status, d.dmarc_status].filter(s => s === 'ok').length
}

function StatCard({
  icon, label, value, sub, trend
}: {
  icon: string
  label: string
  value: string
  sub: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-gray-300'
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <TrendIcon size={14} className={trendColor} />
      </div>
      <p className="text-[18px] font-bold text-[#1F2937]">{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{label}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function DelivrabilityPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [domains, setDomains] = useState<EmailDomain[]>([])
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      emailService.getStats(),
      emailService.getDomains(),
      emailService.getSmtpConfigs(),
    ])
      .then(([s, d, c]) => { setStats(s); setDomains(d); setSmtpConfigs(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const dnsScore = domains.reduce((acc, d) => acc + domainScore(d), 0)
  const dnsMax   = domains.length * 3
  const allDnsOk = domains.length > 0 && dnsScore === dnsMax

  const repScore = computeScore(stats, dnsScore, dnsMax)
  const repLabel = scoreLabel(repScore)
  const recos    = generateRecos(stats, dnsScore, dnsMax, smtpConfigs)

  const hasSent = stats && stats.totalSent > 0

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 py-4 sm:px-6 sm:py-5">

        {/* ── Header ── */}
        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-[#1F2937]">Délivrabilité &amp; Réputation</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Suivez la santé de votre envoi et agissez sur les points à améliorer
          </p>
        </div>

        {/* ── Score de réputation ── */}
        <div className={`mb-5 rounded-xl border p-4 sm:p-5 ${repLabel.bg}`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[18px] font-bold text-[#1F2937]">
                Score de réputation : {loading ? '…' : repLabel.label}
              </p>
              <p className={`mt-1 text-[12px] font-medium ${repLabel.color}`}>
                {loading
                  ? 'Chargement…'
                  : repScore >= 80
                  ? 'Excellente réputation d\'expéditeur — continuez ainsi.'
                  : repScore >= 60
                  ? 'Bonne réputation, quelques points à améliorer.'
                  : repScore >= 40
                  ? 'Réputation moyenne — des actions correctives sont nécessaires.'
                  : 'Réputation faible — agissez rapidement pour ne pas être blacklisté.'}
              </p>
              {!hasSent && !loading && (
                <p className="mt-1 text-[11px] text-gray-400">Envoyez vos premières campagnes pour obtenir un score précis.</p>
              )}
            </div>
            <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 ${repLabel.border}`}>
              <div className="text-center">
                <p className="text-[22px] font-bold text-[#1F2937]">{loading ? '–' : repScore}</p>
                <p className="text-[9px] text-gray-400">/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPIs campagnes ── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon="✉"
            label="Taux de délivrabilité"
            value={loading ? '–' : hasSent ? `${stats!.deliverRate}%` : 'N/A'}
            sub={hasSent ? `${stats!.totalSent.toLocaleString('fr-FR')} emails envoyés` : 'Aucun envoi'}
            trend={!hasSent ? 'neutral' : stats!.deliverRate >= 95 ? 'up' : 'down'}
          />
          <StatCard
            icon="↩"
            label="Taux de rebond"
            value={loading ? '–' : hasSent ? `${stats!.bounceRate}%` : 'N/A'}
            sub={hasSent ? `${stats!.hardBounces} hard · ${stats!.softBounces} soft` : 'Aucun envoi'}
            trend={!hasSent ? 'neutral' : stats!.bounceRate <= 2 ? 'up' : 'down'}
          />
          <StatCard
            icon="🚫"
            label="Plaintes spam"
            value={loading ? '–' : hasSent ? `${stats!.spamRate}%` : 'N/A'}
            sub={hasSent ? `${stats!.spamComplaints} plainte(s)` : 'Aucun envoi'}
            trend={!hasSent ? 'neutral' : stats!.spamRate <= 0.1 ? 'up' : 'down'}
          />
          <StatCard
            icon="📊"
            label="Taux d'ouverture"
            value={loading ? '–' : hasSent ? `${stats!.openRate}%` : 'N/A'}
            sub={hasSent ? `${stats!.opens.toLocaleString('fr-FR')} ouvertures · ${stats!.clicks} clics` : 'Aucun envoi'}
            trend={!hasSent ? 'neutral' : stats!.openRate >= 20 ? 'up' : stats!.openRate >= 10 ? 'neutral' : 'down'}
          />
        </div>

        {/* ── Widget DNS ── */}
        <div
          onClick={() => navigate('/email/dns')}
          className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm cursor-pointer hover:border-[#F4511E]/40 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <p className="text-[14px] font-semibold text-[#1F2937]">Authentification DNS</p>
              <span className="text-[10px] text-gray-400">(SPF · DKIM · DMARC)</span>
            </div>
            <div className="flex items-center gap-2">
              {domains.length > 0 && (
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                  allDnsOk
                    ? 'border-green-200 bg-green-50 text-green-600'
                    : dnsScore === 0
                    ? 'border-gray-200 bg-gray-50 text-gray-400'
                    : 'border-amber-200 bg-amber-50 text-amber-600'
                }`}>
                  {dnsScore}/{dnsMax}
                  {allDnsOk ? ' ✓ Parfait' : dnsScore === 0 ? ' — Non configuré' : ' — Incomplet'}
                </span>
              )}
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#F4511E] transition-colors" />
            </div>
          </div>

          {domains.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[12px] font-semibold text-amber-700">Aucun domaine configuré</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                Configurez SPF, DKIM et DMARC pour éviter que vos emails arrivent en spam.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map(d => {
                const score = domainScore(d)
                return (
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-[12px] font-medium text-[#1F2937] truncate max-w-[140px] sm:max-w-none">{d.domain}</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {[
                        { label: 'SPF', status: d.spf_status },
                        { label: 'DKIM', status: d.dkim_status },
                        { label: 'DMARC', status: d.dmarc_status },
                      ].map(({ label, status }) => (
                        <div key={label} className="flex items-center gap-1">
                          <DnsStatusIcon status={status} />
                          <span className="text-[10px] text-gray-400">{label}</span>
                        </div>
                      ))}
                      <span className={`text-[11px] font-bold ${score === 3 ? 'text-green-500' : score === 0 ? 'text-gray-300' : 'text-amber-500'}`}>
                        {score}/3
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-3 text-[11px] text-[#F4511E] font-semibold group-hover:underline">
            Gérer la configuration DNS →
          </p>
        </div>

        {/* ── Recommandations dynamiques ── */}
        <div className="mb-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-4 text-[14px] font-semibold text-[#1F2937]">
            Recommandations pour optimiser votre délivrabilité
          </p>
          {loading ? (
            <p className="text-[12px] text-gray-400">Analyse en cours…</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recos.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 ${r.ok ? 'bg-[#F4511E]' : 'bg-orange-400'}`}
                >
                  {r.ok
                    ? <CheckCircle size={16} className="mt-0.5 shrink-0 text-white" />
                    : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-white" />
                  }
                  <div>
                    <p className="text-[12px] font-semibold text-white">{r.text}</p>
                    <p className="text-[10px] text-white/80">{r.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Détail campagnes ── */}
        {hasSent && (
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-4 text-[13px] font-semibold text-[#1F2937]">Résumé global des campagnes</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Campagnes totales', value: stats!.totalCampaigns.toLocaleString('fr-FR') },
                { label: 'Emails envoyés', value: stats!.totalSent.toLocaleString('fr-FR') },
                { label: 'Destinataires uniques', value: stats!.totalRecipients.toLocaleString('fr-FR') },
                { label: 'Ouvertures', value: stats!.opens.toLocaleString('fr-FR') },
                { label: 'Clics', value: stats!.clicks.toLocaleString('fr-FR') },
                { label: 'Désinscriptions', value: stats!.unsubscribes.toLocaleString('fr-FR') },
                { label: 'Rebonds durs', value: stats!.hardBounces.toLocaleString('fr-FR') },
                { label: 'Rebonds légers', value: stats!.softBounces.toLocaleString('fr-FR') },
                { label: 'Taux de clic', value: `${stats!.clickRate}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-gray-50 px-3 py-2.5">
                  <p className="text-[11px] text-gray-500">{label}</p>
                  <p className="text-[15px] font-bold text-[#1F2937]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <DashboardFooter />
    </div>
  )
}
