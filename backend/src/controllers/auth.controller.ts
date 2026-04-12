import { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { sendSuccess, sendError } from '../helpers/response.helper'

// Lit le refresh token depuis le cookie httpOnly ou en fallback depuis le body (clients mobiles)
function getRefreshToken(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const entry = cookieHeader.split(';').find((c) => c.trim().startsWith('refreshToken='))
    if (entry) return entry.split('=').slice(1).join('=').trim()
  }
  return req.body?.refreshToken as string | undefined
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/api/v1/auth',
  })
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body, req.ip)
      setRefreshCookie(res, tokens.refreshToken)
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Compte créé avec succès', 201)
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body
      const { user, tokens } = await authService.login(email, password, req.ip)
      setRefreshCookie(res, tokens.refreshToken)
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Connexion réussie')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = getRefreshToken(req)
      await authService.logout(req.user!.id, refreshToken)
      res.clearCookie('refreshToken', { path: '/api/v1/auth' })
      sendSuccess(res, null, 'Déconnexion réussie')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = getRefreshToken(req)
      if (!token) {
        sendError(res, 401, 'MISSING_TOKEN', 'Refresh token manquant')
        return
      }
      const tokens = await authService.refreshToken(token)
      setRefreshCookie(res, tokens.refreshToken)
      sendSuccess(res, { accessToken: tokens.accessToken }, 'Token renouvelé')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email, req.ip)
      // Réponse identique qu'un email existe ou non — sécurité
      sendSuccess(res, null, 'Si cet email existe, un lien de réinitialisation a été envoyé')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body
      await authService.resetPassword(token, password, req.ip)
      sendSuccess(res, null, 'Mot de passe réinitialisé avec succès')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      await authService.resendOtp(req.body.email, req.ip)
      sendSuccess(res, null, 'Nouveau code envoyé par email')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      await authService.verifyEmail(req.params.token, req.ip)
      sendSuccess(res, null, 'Email vérifié avec succès')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body
      const { user, tokens } = await authService.verifyOtp(email, code, req.ip)
      setRefreshCookie(res, tokens.refreshToken)
      sendSuccess(res, { user, accessToken: tokens.accessToken }, 'Email vérifié avec succès')
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id)
      sendSuccess(res, { user })
    } catch (err: any) {
      sendError(res, err.statusCode ?? 500, err.code ?? 'SERVER_ERROR', err.message)
    }
  },
}
