import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schemas'
import { authService } from '../../../services/auth.service'
import { useToast } from '../../../hooks/useToast'

type FormData = ForgotPasswordFormData

const securityPoints = [
  'Lien sécurisé à usage unique',
  'Expiration automatique 30 minutes',
  'Notification de connexion',
  'Support disponible 24/7',
]

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const toast = useToast()

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data)
      setSent(true)
    } catch {
      // Réponse volontairement identique pour ne pas révéler si l'email existe
      setSent(true)
      toast.info('Vérifiez votre email pour activer votre compte')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — lavender background */}
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#EDE5F9] via-[#E8DFF7] to-[#DDD4F2] px-6 py-12 lg:w-1/2">
        {/* White card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-xl"
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F]">
              <span className="text-base font-black text-white">B</span>
            </div>
          </div>

          {!sent ? (
            <>
              <h1 className="text-center text-[26px] font-bold text-[#1a0033]">Mot de passe oublié ?</h1>
              <p className="mt-2 text-center text-[14px] text-[#5a5a7a]">
                Entrez votre email, nous vous enverrons un lien de réinitialisation.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-[#1a0033]">Adresse email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-4 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all"
                      placeholder="vous@entreprise.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[16px] font-semibold text-white shadow-md transition-shadow hover:shadow-[#E91E8C]/30 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Envoi en cours...
                    </span>
                  ) : (
                    'Envoyer le lien'
                  )}
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-[24px] font-bold text-[#1a0033]">Email envoyé !</h2>
              <p className="mt-2 text-[14px] text-[#5a5a7a]">
                Un lien de réinitialisation a été envoyé à{' '}
                <span className="font-semibold text-[#E91E8C]">{getValues('email')}</span>.
                Vérifiez aussi vos spams.
              </p>
            </motion.div>
          )}

          <a href="/login" className="mt-8 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#E91E8C] hover:underline">
            <ArrowLeft size={15} /> Retour à la connexion
          </a>
        </motion.div>
      </div>

      {/* Right — medium purple */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#5B3FAA] px-12 py-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <span className="text-sm font-black text-white">B</span>
          </div>
          <span className="text-lg font-bold text-white">Actor Hub</span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-[32px] font-bold text-white">Récupération sécurisée</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">
            Votre sécurité est notre priorité. Le lien de réinitialisation expire après 30 minutes.
          </p>

          <ul className="mt-8 space-y-3">
            {securityPoints.map((item, i) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
              >
                <CheckCircle size={18} className="text-white shrink-0" />
                <span className="text-[16px] font-medium text-white">{item}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex gap-8">
            {[['30min', 'Expiration'], ['256bit', 'Chiffrement'], ['24/7', 'Support']].map(([val, label]) => (
              <div key={label}>
                <div className="text-[22px] font-bold text-white">{val}</div>
                <div className="text-[13px] text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-[13px] text-white/60">© 2026 BIAR GROUP AFRICA SARLU. Tous droits réservés.</p>
      </div>
    </div>
  )
}
