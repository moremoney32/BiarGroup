import type { BaseQueryFn } from '@reduxjs/toolkit/query'
import { store } from '../store/index'
import { updateAccessToken, logout } from '../store/slices/authSlice'

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? ''
const TIMEOUT_MS = 30_000

// ─── Classe d'erreur typée ────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string = 'UNKNOWN_ERROR'
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Queue pour les requêtes en attente du refresh ────────────────────────────

let isRefreshing = false
let waitQueue: Array<(token: string | null) => void> = []

function drainQueue(token: string | null) {
  waitQueue.forEach((cb) => cb(token))
  waitQueue = []
}

async function doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.data?.accessToken as string) ?? null
  } catch {
    return null
  }
}

// ─── Fonction centrale ────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const token = store.getState().auth.accessToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const init: RequestInit = {
    method,
    headers,
    credentials: 'include',
    signal: controller.signal,
  }
  if (body !== undefined) init.body = JSON.stringify(body)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, init)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError("Délai d'attente dépassé (30s)", 408, 'TIMEOUT')
    }
    throw new ApiError('Erreur réseau — vérifiez votre connexion', 0, 'NETWORK_ERROR')
  }
  clearTimeout(timeoutId)

  // ── Gestion 401 + refresh silencieux ──────────────────────────────────────
  if (res.status === 401) {
    let newToken: string | null

    if (!isRefreshing) {
      isRefreshing = true
      newToken = await doRefresh()

      if (newToken) {
        store.dispatch(updateAccessToken(newToken))
        drainQueue(newToken)
      } else {
        drainQueue(null)
        isRefreshing = false
        store.dispatch(logout())
        window.location.href = '/login'
        throw new ApiError('Session expirée, reconnectez-vous', 401, 'SESSION_EXPIRED')
      }
      isRefreshing = false
    } else {
      // Une autre requête est déjà en train de refresh — on attend
      newToken = await new Promise<string | null>((resolve) => {
        waitQueue.push(resolve)
      })
    }

    if (!newToken) {
      throw new ApiError('Session expirée, reconnectez-vous', 401, 'SESSION_EXPIRED')
    }

    // Rejouer la requête originale avec le nouveau token
    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: undefined,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    })
    const retryJson = await retryRes.json()
    if (!retryRes.ok) {
      throw new ApiError(
        retryJson.error?.message ?? 'Erreur serveur',
        retryRes.status,
        retryJson.error?.code ?? 'SERVER_ERROR'
      )
    }
    return retryJson as T
  }

  const json = await res.json()
  if (!res.ok) {
    throw new ApiError(
      json.error?.message ?? 'Erreur serveur',
      res.status,
      json.error?.code ?? 'SERVER_ERROR'
    )
  }
  return json as T
}

// ─── Interface publique ───────────────────────────────────────────────────────

export const apiFetch = {
  get: <T>(url: string, headers?: Record<string, string>) =>
    request<T>('GET', url, undefined, headers),
  post: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', url, body, headers),
  put: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PUT', url, body, headers),
  patch: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PATCH', url, body, headers),
  delete: <T>(url: string, headers?: Record<string, string>) =>
    request<T>('DELETE', url, undefined, headers),
}

// ─── Compatibilité RTK Query (smsApi, emailApi, etc. l'importent) ─────────────
// Interface conservée : { url, method, data?, params? }

type RtkQueryArg = {
  url: string
  method: string
  data?: unknown
  params?: Record<string, unknown>
}

export const axiosBaseQuery =
  (): BaseQueryFn<RtkQueryArg, unknown, { status: number; message: string; code?: string }> =>
  async ({ url, method, data, params }) => {
    try {
      let fullUrl = url
      if (params) {
        const qs = new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
        if (qs) fullUrl = `${url}?${qs}`
      }
      const result = await request<{ data?: unknown }>(method, fullUrl, data)
      return { data: result.data ?? result }
    } catch (err) {
      if (err instanceof ApiError) {
        return { error: { status: err.statusCode, message: err.message, code: err.code } }
      }
      return { error: { status: 0, message: 'Erreur réseau' } }
    }
  }

export default apiFetch
