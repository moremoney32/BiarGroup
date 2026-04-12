import { Request, Response, NextFunction } from 'express'
import { sendError } from '../helpers/response.helper'

// Extrait et valide le tenant_id depuis le JWT
// Le user doit déjà être attaché par authMiddleware
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.tenantId) {
    sendError(res, 401, 'UNAUTHORIZED', 'Tenant non identifié')
    return
  }

  // Propagate tenantId for easy access in controllers
  req.tenantId = req.user.tenantId
  next()
}
