import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Building2, User, Lock, Mail, Phone, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Data,
  type RegisterStep2Data,
  type RegisterStep3Data,
} from '../schemas/auth.schemas'
import { useAuth } from '../../../hooks/useAuth'

type Step1Data = RegisterStep1Data
type Step2Data = RegisterStep2Data
type Step3Data = RegisterStep3Data

const steps = [
  { id: 1, label: 'Informations de l\'entreprise' },
  { id: 2, label: 'Informations personnelles' },
  { id: 3, label: 'Sécurité' },
]

const perks = [
  '14 jours d\'essai gratuit',
  'Aucune carte de crédit requise',
  'Accès à toutes les fonctionnalités',
  'Support client 24/7',
  'Formation gratuite incluse',
]

const sectors = ['Banque & Finance', 'Santé', 'Commerce', 'Éducation', 'Gouvernement', 'ONG', 'Télécommunications', 'Autre']
const countries = ['RD Congo', 'Congo', 'Rwanda', 'Cameroun', 'Côte d\'Ivoire', 'Sénégal', 'Autre']

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({})
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({})

  const form1 = useForm<Step1Data>({ resolver: zodResolver(registerStep1Schema), defaultValues: step1Data })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(registerStep2Schema), defaultValues: step2Data })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(registerStep3Schema) })

  const handleStep1 = form1.handleSubmit((data) => { setStep1Data(data); setStep(2) })
  const handleStep2 = form2.handleSubmit((data) => { setStep2Data(data); setStep(3) })
  const handleStep3 = form3.handleSubmit(async (_data) => {
    try {
      await registerUser({
        ...(step1Data as Step1Data),
        ...(step2Data as Step2Data),
        password: _data.password,
        plan: 'free',
      })
      // La navigation vers /verify-email est gérée dans useAuth.register
    } catch {
      // erreur déjà gérée via useToast dans useAuth
    }
  })

  const inputCls = 'w-full rounded-xl border border-[#e2e8f0] bg-white py-3 px-4 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all'
  const labelCls = 'mb-1.5 block text-[14px] font-medium text-[#1a0033]'
  const errCls = 'mt-1 text-xs text-red-500'

  return (
    <div className="flex min-h-screen">
      {/* Left — lavender background */}
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-[#EDE5F9] via-[#E8DFF7] to-[#DDD4F2] px-6 py-12 lg:w-1/2">
        {/* White card */}
        <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-8 shadow-xl">
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F]">
              <span className="text-base font-black text-white">B</span>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-center text-[26px] font-bold text-[#1a0033]">Inscription</h1>
            <p className="mt-1 text-center text-[14px] text-[#5a5a7a]">Démarrez votre essai gratuit de 14 jours</p>
          </motion.div>

          {/* Stepper */}
          <div className="mt-6 flex items-center justify-center">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  s.id === step
                    ? 'bg-[#E91E8C] text-white'
                    : s.id < step
                    ? 'bg-[#5906ae] text-white'
                    : 'bg-[#e2e8f0] text-[#9ca3af]'
                }`}>
                  {s.id < step ? '✓' : s.id}
                </div>
                {idx < steps.length - 1 && (
                  <div className={`mx-2 h-px w-8 ${s.id < step ? 'bg-[#5906ae]/60' : 'bg-[#e2e8f0]'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] font-medium text-[#5906ae]">{steps[step - 1].label}</p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="s1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }} onSubmit={handleStep1} className="mt-5 space-y-4"
              >
                <div>
                  <label className={labelCls}>Nom de l'entreprise</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input {...form1.register('companyName')} className={inputCls.replace('px-4', 'pl-10 pr-4')} placeholder="Votre entreprise" />
                  </div>
                  {form1.formState.errors.companyName && <p className={errCls}>{form1.formState.errors.companyName.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Secteur d'activité</label>
                  <select {...form1.register('sector')} className={inputCls}>
                    <option value="">Choisir un secteur</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {form1.formState.errors.sector && <p className={errCls}>{form1.formState.errors.sector.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Pays</label>
                    <select {...form1.register('country')} className={inputCls}>
                      <option value="">Pays</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form1.formState.errors.country && <p className={errCls}>{form1.formState.errors.country.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Ville</label>
                    <input {...form1.register('city')} className={inputCls} placeholder="Kinshasa" />
                    {form1.formState.errors.city && <p className={errCls}>{form1.formState.errors.city.message}</p>}
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[15px] font-semibold text-white shadow-md">
                  Suivant <ChevronRight size={18} />
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="s2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }} onSubmit={handleStep2} className="mt-5 space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Prénom</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                      <input {...form2.register('firstName')} className={inputCls.replace('px-4', 'pl-10 pr-4')} placeholder="Jean" />
                    </div>
                    {form2.formState.errors.firstName && <p className={errCls}>{form2.formState.errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Nom</label>
                    <input {...form2.register('lastName')} className={inputCls} placeholder="Dupont" />
                    {form2.formState.errors.lastName && <p className={errCls}>{form2.formState.errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Adresse email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input {...form2.register('email')} type="email" className={inputCls.replace('px-4', 'pl-10 pr-4')} placeholder="vous@entreprise.com" />
                  </div>
                  {form2.formState.errors.email && <p className={errCls}>{form2.formState.errors.email.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input {...form2.register('phone')} className={inputCls.replace('px-4', 'pl-10 pr-4')} placeholder="+243 81 000 0000" />
                  </div>
                  {form2.formState.errors.phone && <p className={errCls}>{form2.formState.errors.phone.message}</p>}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] px-4 py-3 text-[14px] font-medium text-[#1a0033] hover:bg-[#f8fafc]">
                    <ChevronLeft size={16} />
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[15px] font-semibold text-white shadow-md">
                    Suivant <ChevronRight size={18} />
                  </motion.button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form key="s3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }} onSubmit={handleStep3} className="mt-5 space-y-4"
              >
                <div>
                  <label className={labelCls}>Mot de passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input {...form3.register('password')} type={showPw ? 'text' : 'password'}
                      className={inputCls.replace('px-4', 'pl-10 pr-11')} placeholder="Minimum 8 caractères" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1a0033]/40 hover:text-[#1a0033]/70" aria-label="Afficher">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form3.formState.errors.password && <p className={errCls}>{form3.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E91E8C]" />
                    <input {...form3.register('confirmPassword')} type={showConfirm ? 'text' : 'password'}
                      className={inputCls.replace('px-4', 'pl-10 pr-11')} placeholder="Répéter le mot de passe" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1a0033]/40 hover:text-[#1a0033]/70" aria-label="Afficher">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form3.formState.errors.confirmPassword && <p className={errCls}>{form3.formState.errors.confirmPassword.message}</p>}
                </div>
                <p className="text-[12px] text-[#5a5a7a]">
                  En créant un compte, vous acceptez nos{' '}
                  <a href="#" className="text-[#E91E8C] hover:underline">Conditions d'utilisation</a>
                  {' '}et notre{' '}
                  <a href="#" className="text-[#E91E8C] hover:underline">Politique de confidentialité</a>.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex items-center gap-1 rounded-xl border border-[#e2e8f0] px-4 py-3 text-[14px] font-medium text-[#1a0033] hover:bg-[#f8fafc]">
                    <ChevronLeft size={16} />
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={form3.formState.isSubmitting || isLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E91E8C] to-[#3B2F8F] py-3 text-[15px] font-semibold text-white shadow-md disabled:opacity-60">
                    {(form3.formState.isSubmitting || isLoading)
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : 'Créer mon compte'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-5 text-center text-[13px] text-[#5a5a7a]">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-semibold text-[#E91E8C] hover:underline">Se connecter</a>
          </p>
        </div>
      </div>

      {/* Right — medium purple */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-[#5B3FAA] px-12 py-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <span className="text-sm font-black text-white">B</span>
          </div>
          <span className="text-lg font-bold text-white">Actor Hub</span>
        </div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <h2 className="text-[28px] font-bold text-white">Pourquoi nous choisir ?</h2>
          <p className="mt-2 text-white/80">Rejoignez plus de 500+ entreprises qui nous font confiance</p>

          <ul className="mt-8 space-y-3">
            {perks.map((p, i) => (
              <motion.li key={p}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                <CheckCircle size={18} className="text-white shrink-0" />
                <span className="text-[16px] font-medium text-white">{p}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-10 flex gap-8">
            {[['99.9%', 'Uptime'], ['24/7', 'Support'], ['500+', 'Clients']].map(([val, label]) => (
              <div key={label}>
                <div className="text-[24px] font-bold text-white">{val}</div>
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
