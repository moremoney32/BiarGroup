import { Request, Response, NextFunction } from 'express'
import { sendError } from '../helpers/response.helper'
import type { UserRole } from '../types/auth.types'

export const rbacMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Non authentifié')
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 403, 'FORBIDDEN', 'Accès refusé — rôle insuffisant')
      return
    }

    next()
  }
}
