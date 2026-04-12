import { Request, Response, NextFunction } from 'express'
import xss from 'xss'

const sanitizeValue = (val: unknown): unknown => {
  if (typeof val === 'string') return xss(val.trim())
  if (Array.isArray(val)) return val.map(sanitizeValue)
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)])
    )
  }
  return val
}

// Sanitize all string inputs against XSS
export const sanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitizeValue(req.body)
  if (req.query) req.query = sanitizeValue(req.query) as Record<string, string>
  if (req.params) req.params = sanitizeValue(req.params) as Record<string, string>
  next()
}
