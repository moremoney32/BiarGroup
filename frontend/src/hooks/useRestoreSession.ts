import { useEffect, useState } from 'react'
import { useAppDispatch } from '../store/index'
import { setCredentials } from '../store/slices/authSlice'

const API = (import.meta.env.VITE_API_URL as string) ?? ''

/**
 * Au démarrage de l'app, tente de restaurer la session depuis le refresh token cookie.
 * Si le cookie est valide → nouveau accessToken + user → setCredentials
 * Si pas de cookie ou expiré → rien (user reste déconnecté)
 */
export function useRestoreSession(): { isRestoring: boolean } {
  const dispatch = useAppDispatch()
  const [isRestoring, setIsRestoring] = useState(true)

  useEffect(() => {
    async function restore() {
      try {
        // 1. Tenter d'obtenir un nouveau access token via le cookie httpOnly
        const refreshRes = await fetch(`${API}/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include', // envoie le cookie automatiquement
          headers: { 'Content-Type': 'application/json' },
        })
        if (!refreshRes.ok) return

        const refreshJson = await refreshRes.json()
        const newToken: string | undefined = refreshJson.data?.accessToken
        if (!newToken) return

        // 2. Récupérer les données de l'utilisateur avec le nouveau token
        const meRes = await fetch(`${API}/auth/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
        })
        if (!meRes.ok) return

        const meJson = await meRes.json()
        const user = meJson.data?.user
        if (!user) return

        // 3. Restaurer la session dans Redux
        dispatch(setCredentials({ user, accessToken: newToken }))
      } catch {
        // silencieux — pas de session à restaurer, l'utilisateur devra se reconnecter
      } finally {
        setIsRestoring(false)
      }
    }

    restore()
  }, [dispatch])

  return { isRestoring }
}
