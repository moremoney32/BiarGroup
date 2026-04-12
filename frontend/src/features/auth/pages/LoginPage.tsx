import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, Phone, MessageSquare, Mail as MailIcon, Shield } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas'

const features = [
  { icon: Phone, label: 'Centre d\'appels cloud complet' },
  { icon: MessageSquare, label: 'SMS Bulk & Marketing' },
  { icon: MessageSquare, label: 'WhatsApp Business intégré' },
  { icon: MailIcon, label: 'Email Marketing professionnel' },
  { icon: Shield, label: 'Sécurité & conformité RGPD' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
    } catch {
      // erreur déjà gérée via useToast dans useAuth
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
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F]">
              <span className="text-base font-black text-white">B</span>
            </div>
          </div>

          <h1 className="text-center text-[26px] font-bold text-[#1a0033]">Connexion</h1>
          <p className="mt-1 text-center text-[14px] text-[#5a5a7a]">Plateforme SaaS Multi-Canal Professionnelle</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-[#1a0033]">
                Adresse email
              </label>
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
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[14px] font-medium text-[#1a0033]">Mot de passe</label>
                <a href="/forgot-password" className="text-[13px] text-[#E91E8C] hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-11 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1a0033]/40 hover:text-[#1a0033]/70"
                  aria-label={showPw ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[16px] font-semibold text-white shadow-md transition-shadow hover:shadow-[#E91E8C]/30 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[14px] text-[#5a5a7a]">
            Vous n'avez pas de compte ?{' '}
            <a href="/register" className="font-semibold text-[#E91E8C] hover:underline">
              Créer un compte
            </a>
          </p>
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
          <h2 className="text-[32px] font-bold leading-tight text-white">
            Pourquoi B-SMSBulk ?
          </h2>
          <p className="mt-2 text-white/80">La plateforme CPaaS de référence en Afrique</p>

          <ul className="mt-8 space-y-4">
            {features.map((f, i) => (
              <motion.li
                key={f.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
              >
                <f.icon size={18} className="text-white shrink-0" />
                <span className="text-[16px] font-medium text-white">{f.label}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex gap-8">
            {[['5 000+', 'Clients'], ['190+', 'Pays'], ['99.9%', 'Uptime']].map(([val, label]) => (
              <div key={label}>
                <div className="text-[24px] font-bold text-white">{val}</div>
                <div className="text-[13px] text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-[13px] text-white/60">
          © 2026 BIAR GROUP AFRICA SARLU. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
