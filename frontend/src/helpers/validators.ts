import { z } from 'zod'

// Numéro RDC Congo (+243)
const rdcPhoneRegex = /^\+?243[0-9]{9}$/

export const rdcPhoneSchema = z
  .string()
  .regex(rdcPhoneRegex, 'Numéro invalide — format attendu : +243XXXXXXXXX')

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  phone: rdcPhoneSchema.optional(),
  tenantName: z.string().min(2).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const smsCampaignSchema = z.object({
  name: z.string().min(2, 'Nom requis'),
  message: z.string().min(1).max(1600, 'Message trop long'),
  senderId: z.string().min(2).max(11, 'Sender ID max 11 caractères'),
  contactListId: z.number().optional(),
  scheduledAt: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type SmsCampaignFormData = z.infer<typeof smsCampaignSchema>
