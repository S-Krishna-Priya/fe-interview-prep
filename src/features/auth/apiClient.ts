import {
  isAdminStats,
  isOrderList,
  isRecord,
  isSession,
  isUser,
  type AdminStats,
  type Order,
  type Session,
  type User,
} from './types.ts'

class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let accessToken: string | null = null
let refreshInFlight: Promise<Session> | null = null
const signOutListeners = new Set<() => void>()

export function onForcedSignOut(listener: () => void) {
  signOutListeners.add(listener)
  return () => {
    signOutListeners.delete(listener)
  }
}

async function readMessage(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null)
  return isRecord(body) && typeof body.message === 'string' ? body.message : fallback
}

async function readSession(response: Response, fallback: string): Promise<Session> {
  if (!response.ok) throw new ApiError(response.status, await readMessage(response, fallback))
  const session: unknown = await response.json()
  if (!isSession(session)) throw new ApiError(response.status, 'Unexpected session response')
  accessToken = session.accessToken
  return session
}

function send(path: string, token: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, { ...init, headers })
}

function refreshSession(): Promise<Session> {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', { method: 'POST' })
      .then((response) => readSession(response, 'Session expired'))
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

function forceSignOut() {
  accessToken = null
  for (const listener of signOutListeners) listener()
}

async function authorizedFetch(path: string): Promise<Response> {
  const tokenUsed = accessToken
  const response = await send(path, tokenUsed)
  if (response.status !== 401) return response

  // A different token means another caller already refreshed since this request was sent;
  // just retry with it instead of refreshing again.
  if (accessToken === tokenUsed) {
    try {
      await refreshSession()
    } catch (error) {
      forceSignOut()
      throw error
    }
  }
  return send(path, accessToken)
}

async function getJson<T>(path: string, isValid: (value: unknown) => value is T): Promise<T> {
  const response = await authorizedFetch(path)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await readMessage(response, `Request failed with status ${response.status}`),
    )
  }
  const body: unknown = await response.json()
  if (!isValid(body)) throw new ApiError(response.status, 'Unexpected response shape')
  return body
}

export async function login(username: string, password: string): Promise<Session> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return readSession(response, 'Login failed')
}

export async function logout(): Promise<void> {
  const token = accessToken
  accessToken = null
  // Revoking on the server is best effort; the local session ends either way.
  await send('/api/auth/logout', token, { method: 'POST' }).catch(() => undefined)
  // A refresh already in flight when sign-out started would otherwise set a token afterwards.
  accessToken = null
}

export async function restoreSession(): Promise<Session | null> {
  try {
    return await refreshSession()
  } catch {
    return null
  }
}

export function getCurrentUser(): Promise<User> {
  return getJson('/api/me', isUser)
}

export function getOrders(): Promise<Order[]> {
  return getJson('/api/orders', isOrderList)
}

export function getAdminStats(): Promise<AdminStats> {
  return getJson('/api/admin/stats', isAdminStats)
}

export function resetApiClient() {
  accessToken = null
  refreshInFlight = null
  signOutListeners.clear()
}
