import { Router } from 'express'
import { z } from 'zod'
import { authController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validateMiddleware } from '../middlewares/validate.middleware'
import { authRateLimiter, sensitiveRateLimiter } from '../middlewares/rateLimiter.middleware'

const router = Router()

// ─── Schemas de validation ────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
  phone: z.string().regex(/^\+[1-9][0-9]{6,14}$/, 'Format : +XXXXXXXXXXXX').optional(),
  tenantName: z.string().min(2).optional(),
  plan: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
})

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre'),
})

const otpSchema = z.object({
  email: z.string().email('Email invalide'),
  code: z.string().length(6).regex(/^[0-9]+$/, 'Code invalide'),
})

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register
router.post('/register',
  authRateLimiter,
  validateMiddleware(registerSchema),
  authController.register
)

// POST /api/v1/auth/login
router.post('/login',
  authRateLimiter,
  validateMiddleware(loginSchema),
  authController.login
)

// POST /api/v1/auth/logout
router.post('/logout',
  authMiddleware,
  authController.logout
)

// POST /api/v1/auth/refresh-token
router.post('/refresh-token',
  authController.refreshToken
)

// POST /api/v1/auth/forgot-password
router.post('/forgot-password',
  sensitiveRateLimiter,
  validateMiddleware(forgotPasswordSchema),
  authController.forgotPassword
)

// POST /api/v1/auth/reset-password
router.post('/reset-password',
  sensitiveRateLimiter,
  validateMiddleware(resetPasswordSchema),
  authController.resetPassword
)

// POST /api/v1/auth/resend-otp  (bouton "Renvoyer" — sans auth)
router.post('/resend-otp',
  sensitiveRateLimiter,
  validateMiddleware(z.object({ email: z.string().email('Email invalide') })),
  authController.resendOtp
)

// POST /api/v1/auth/verify-otp  (depuis VerifyEmailPage — email + code 6 chiffres, sans auth)
router.post('/verify-otp',
  sensitiveRateLimiter,
  validateMiddleware(otpSchema),
  authController.verifyOtp
)

// GET /api/v1/auth/verify-email/:token  (lien cliqué depuis l'email)
router.get('/verify-email/:token',
  authController.verifyEmail
)

// GET /api/v1/auth/me
router.get('/me',
  authMiddleware,
  authController.getMe
)

export default router
