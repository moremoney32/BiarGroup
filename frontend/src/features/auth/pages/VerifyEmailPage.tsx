import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { authService } from '../../../services/auth.service'

const COUNTDOWN = 60

const perks = [
  'Centre d\'appels cloud complet',
  'SMS Bulk & Marketing',
  'WhatsApp Business intégré',
  'Email Marketing professionnel',
  'Support multi-langue (10 langues)',
  'Sécurité & conformité RGPD',
]

export default function VerifyEmailPage() {
  const { state } = useLocation() as { state: { email?: string } | null }
  const { verifyOtp } = useAuth()
  const email = state?.email ?? ''

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(COUNTDOWN)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  const handleChange = (idx: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = char
    setOtp(next)
    setError('')
    if (char && idx < 5) inputsRef.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = Array(6).fill('')
    text.split('').forEach((c, i) => { next[i] = c })
    setOtp(next)
    inputsRef.current[Math.min(text.length, 5)]?.focus()
  }

  const handleResend = async () => {
    if (countdown > 0 || resending) return
    if (!email) { setError('Email manquant. Veuillez recommencer l\'inscription.'); return }
    setResending(true)
    setError('')
    try {
      await authService.resendOtp(email)
      setCountdown(COUNTDOWN)
      setOtp(Array(6).fill(''))
      inputsRef.current[0]?.focus()
    } catch {
      setError('Impossible d\'envoyer le code. Réessayez dans quelques secondes.')
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('Veuillez saisir les 6 chiffres du code.'); return }
    if (!email) { setError('Email manquant. Veuillez recommencer l\'inscription.'); return }
    setLoading(true)
    setError('')
    try {
      await verifyOtp(email, code)
      // navigation gérée dans useAuth.verifyOtp
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Code incorrect ou expiré.'
      setError(msg)
      setOtp(Array(6).fill(''))
      inputsRef.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const filled = otp.filter(Boolean).length

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#EDE5F9] via-[#E8DFF7] to-[#DDD4F2] px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-8 shadow-xl">
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F]">
              <ShieldCheck size={22} className="text-white" />
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-center text-[26px] font-bold text-[#1a0033]">Vérification</h1>
            <p className="mt-1 text-center text-[14px] text-[#5a5a7a]">Un code a été envoyé à votre boite mail</p>
          </motion.div>

          {/* Email display */}
          {email && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
              className="mt-5 flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8f5ff] px-4 py-2.5"
            >
              <Mail size={15} className="shrink-0 text-[#E91E8C]" />
              <span className="truncate text-[13px] font-medium text-[#3B2F8F]">{email}</span>
            </motion.div>
          )}

          {/* OTP inputs */}
          <div className="mt-6">
            <p className="mb-3 text-[13px] font-medium text-[#1a0033]">Entrez le code de vérification</p>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((val, idx) => (
                <input
                  key={idx}
                  ref={el => { inputsRef.current[idx] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`h-12 w-12 rounded-xl border text-center text-[18px] font-bold outline-none transition-all
                    ${val
                      ? 'border-[#E91E8C] bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F] text-white shadow-md'
                      : 'border-[#e2e8f0] bg-white text-[#1a0033] focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10'
                    }`}
                />
              ))}
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-red-500">
                {error}
              </motion.p>
            )}
          </div>

          {/* Verify button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleVerify}
            disabled={loading || filled < 6}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[15px] font-semibold text-white shadow-md disabled:opacity-50 transition-opacity"
          >
            {loading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : 'Vérifier'}
          </motion.button>

          {/* Resend + countdown */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[13px]">
            <span className="text-[#5a5a7a]">Vous n'avez pas reçu le code ?</span>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="flex items-center gap-1 font-semibold text-[#E91E8C] disabled:cursor-not-allowed disabled:opacity-40 hover:underline"
            >
              <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Envoi...' : 'Renvoyer'}
            </button>
            {countdown > 0 && (
              <span className="min-w-[40px] rounded-md bg-[#f0ebff] px-2 py-0.5 text-center text-[12px] font-bold text-[#5906ae]">
                {fmt(countdown)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#5B3FAA] px-12 py-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <span className="text-sm font-black text-white">B</span>
          </div>
          <span className="text-lg font-bold text-white">Actor Hub</span>
        </div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <h2 className="text-[28px] font-bold text-white">Pourquoi B-SMSBulk ?</h2>
          <ul className="mt-8 space-y-3">
            {perks.map((p, i) => (
              <motion.li key={p}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <ShieldCheck size={17} className="shrink-0 text-white" />
                <span className="text-[15px] font-medium text-white">{p}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <p className="text-[13px] text-white/60">© 2026 BIAR GROUP AFRICA SARLU. Tous droits réservés.</p>
      </div>
    </div>
  )
}
