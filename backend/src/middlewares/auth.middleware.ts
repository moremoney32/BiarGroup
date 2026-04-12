import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../helpers/jwt.helper'
import { sendError } from '../helpers/response.helper'
import type { UserRole } from '../types/auth.types'

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', 'Token manquant ou invalide')
    return
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyAccessToken(token)

  if (!payload) {
    sendError(res, 401, 'UNAUTHORIZED', 'Token expiré ou invalide')
    return
  }

  req.user = payload
  next()
}

// Vérifie que l'utilisateur possède l'un des rôles autorisés
// Doit être utilisé APRÈS authMiddleware
export const verifyRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Non authentifié')
      return
    }
    if (!roles.includes(req.user.role as UserRole)) {
      sendError(res, 403, 'FORBIDDEN', 'Accès refusé — droits insuffisants')
      return
    }
    next()
  }
}
