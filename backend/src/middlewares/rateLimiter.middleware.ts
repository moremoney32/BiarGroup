import rateLimit from 'express-rate-limit'
import { RequestHandler } from 'express'

// General API — 100 req/min per IP
export const rateLimiterMiddleware: RequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de requêtes, réessayez plus tard' } },
})

// Auth routes — 5 attempts / 15min per IP
export const authRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de tentatives, réessayez dans 15 minutes' } },
})

// OTP / password sensitive endpoints
export const sensitiveRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Trop de tentatives' } },
})
