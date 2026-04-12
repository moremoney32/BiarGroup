import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/index'
import {
  setCredentials,
  logout as logoutAction,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
} from '../store/slices/authSlice'
import { authService } from '../services/auth.service'
import { ApiError } from '../services/api'
import { useToast } from './useToast'
import type { LoginFormData, RegisterFormData } from '../features/auth/schemas/auth.schemas'

export function useAuth() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const user = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectAuthLoading)

  const login = useCallback(
    async (data: LoginFormData) => {
      dispatch(setLoading(true))
      try {
        const { user: authUser, accessToken } = await authService.login(data)
        dispatch(setCredentials({ user: authUser, accessToken }))
        toast.success('Connexion réussie !')
        navigate('/app/email/campagnes', { replace: true })
      } catch (err) {
        if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Vérifiez votre email avant de vous connecter')
          navigate('/verify-email', { state: { email: data.email } })
          return
        }
        const message =
          err instanceof ApiError ? err.message : 'Email ou mot de passe incorrect'
        toast.error(message)
        throw err
      } finally {
        dispatch(setLoading(false))
      }
    },
    [dispatch, navigate, toast]
  )

  const register = useCallback(
    async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
      dispatch(setLoading(true))
      try {
        await authService.register(data)
        // NE PAS dispatcher setCredentials ici — sinon GuestRoute détecte isAuthenticated=true
        // et redirige vers /app avant que React Router change de page
        toast.success('Compte créé ! Vérifiez votre email.')
        navigate('/verify-email', { state: { email: data.email }, replace: true })
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.code === 'EMAIL_TAKEN'
              ? 'Email déjà utilisé'
              : err.message
            : 'Erreur lors de la création du compte'
        toast.error(message)
        throw err
      } finally {
        dispatch(setLoading(false))
      }
    },
    [dispatch, navigate, toast]
  )

  const verifyOtp = useCallback(
    async (email: string, code: string) => {
      try {
        const { user: authUser, accessToken } = await authService.verifyOtp(email, code)
        dispatch(setCredentials({ user: authUser, accessToken }))
        toast.success('Email vérifié ! Bienvenue sur Actor Hub.')
        navigate('/app/email/campagnes', { replace: true })
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.code === 'OTP_EXPIRED'
              ? 'Code expiré. Cliquez sur "Renvoyer".'
              : err.code === 'INVALID_OTP'
              ? 'Code incorrect. Vérifiez votre email.'
              : err.message
            : 'Erreur de vérification'
        toast.error(message)
        throw err
      }
    },
    [dispatch, navigate, toast]
  )

  const logout = useCallback(async () => {
    dispatch(setLoading(true))
    try {
      await authService.logout()
    } catch {
      // logout silencieux même si l'API échoue
    } finally {
      dispatch(logoutAction())
      dispatch(setLoading(false))
      navigate('/login', { replace: true })
    }
  }, [dispatch, navigate])

  return { user, isAuthenticated, isLoading, login, register, verifyOtp, logout }
}
