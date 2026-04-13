import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { authService } from '../../../services/auth.service'
import { useToast } from '../../../hooks/useToast'

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre')
    .regex(/[^a-zA-Z0-9]/, 'Au moins un caractère spécial'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const token = params.get('token') ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Lien invalide ou expiré')
      return
    }
    try {
      await authService.resetPassword({ token, password: data.password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lien invalide ou expiré'
      toast.error(msg)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EDE5F9] to-[#DDD4F2] px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-xl text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-[#1a0033]">Lien invalide</h2>
          <p className="mt-2 text-sm text-[#5a5a7a]">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <a href="/forgot-password" className="mt-6 inline-block text-sm font-semibold text-[#E91E8C] hover:underline">
            Demander un nouveau lien
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#EDE5F9] via-[#E8DFF7] to-[#DDD4F2] px-6 py-12 lg:w-1/2">
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

          {!done ? (
            <>
              <h1 className="text-center text-[26px] font-bold text-[#1a0033]">Nouveau mot de passe</h1>
              <p className="mt-2 text-center text-[14px] text-[#5a5a7a]">
                Choisissez un mot de passe fort pour sécuriser votre compte.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-[#1a0033]">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input
                      {...register('password')}
                      type={showPwd ? 'text' : 'password'}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-10 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a7a]">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                {/* Confirm */}
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-[#1a0033]">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirm ? 'text' : 'password'}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-10 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a5a7a]">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
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
                      Enregistrement...
                    </span>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-[24px] font-bold text-[#1a0033]">Mot de passe modifié !</h2>
              <p className="mt-2 text-[14px] text-[#5a5a7a]">
                Vous allez être redirigé vers la page de connexion...
              </p>
            </motion.div>
          )}

          <a href="/login" className="mt-8 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#E91E8C] hover:underline">
            Retour à la connexion
          </a>
        </motion.div>
      </div>

      {/* Right */}
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
          <h2 className="text-[32px] font-bold text-white">Sécurité renforcée</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">
            Choisissez un mot de passe unique que vous n'utilisez nulle part ailleurs.
          </p>
          <ul className="mt-8 space-y-3">
            {['8 caractères minimum', 'Une majuscule requise', 'Un chiffre requis', 'Un caractère spécial'].map((item, i) => (
              <motion.li key={item}
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
        </motion.div>

        <p className="text-[13px] text-white/60">© 2026 BIAR GROUP AFRICA SARLU. Tous droits réservés.</p>
      </div>
    </div>
  )
}
