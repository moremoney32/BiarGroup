import type { JwtPayload } from './auth.types'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      tenantId?: number
    }
  }
}

export {}
