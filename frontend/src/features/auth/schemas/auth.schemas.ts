import { z } from 'zod'

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// ─── Register — schémas par étape + schéma complet ───────────────────────────

export const registerStep1Schema = z.object({
  companyName: z.string().min(2, "Nom de l'entreprise requis (min 2 caractères)"),
  sector: z.string().min(1, "Secteur d'activité requis"),
  country: z.string().min(1, 'Pays requis'),
  city: z.string().min(1, 'Ville requise'),
})

export const registerStep2Schema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.string().email('Adresse email invalide'),
  // Numéro international — espaces/tirets ignorés, format +XX...
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true
        // on retire espaces, tirets, points, parenthèses avant de valider
        const clean = val.replace(/[\s\-().]/g, '')
        return /^\+[1-9][0-9]{6,14}$/.test(clean)
      },
      { message: 'Format : +243 81 000 0000 ou +33 6 12 34 56 78' }
    ),
})

export const registerStep3Schema = z
  .object({
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

// Schéma complet pour la validation finale avant envoi API
export const registerSchema = registerStep1Schema
  .merge(registerStep2Schema)
  .merge(
    z.object({
      password: z
        .string()
        .min(8, 'Minimum 8 caractères')
        .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
        .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
      confirmPassword: z.string(),
      plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional().default('free'),
    })
  )
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterStep1Data = z.infer<typeof registerStep1Schema>
export type RegisterStep2Data = z.infer<typeof registerStep2Schema>
export type RegisterStep3Data = z.infer<typeof registerStep3Schema>
export type RegisterFormData = z.infer<typeof registerSchema>

// ─── Forgot password ─────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

// ─── Reset password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token invalide'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
