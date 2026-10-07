import { isRecord, type AdminStats, type Order, type User } from '../src/features/auth/types.ts'

export const ACCESS_TOKEN_TTL_MS = 30_000
export const REFRESH_TOKEN_TTL_MS = 10 * 60_000
const REFRESH_COOKIE = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/auth'

export type MockRequest = {
  method: string
  path: string
  authorization?: string
  cookie?: string
  body?: unknown
}

export type MockResponse = {
  status: number
  body?: unknown
  setCookie?: string
}

const ACCOUNTS: Array<{ user: User; password: string }> = [
  { user: { id: 1, username: 'alice', name: 'Alice Johnson', role: 'user' }, password: 'password' },
  { user: { id: 2, username: 'admin', name: 'Sam Okafor', role: 'admin' }, password: 'password' },
]

const ORDERS = new Map<number, Order[]>([
  [
    1,
    [
      { id: 101, item: 'Mechanical keyboard', total: 129, placedAt: '2026-09-28' },
      { id: 102, item: 'USB-C dock', total: 89.5, placedAt: '2026-10-02' },
      { id: 103, item: 'Monitor arm', total: 45, placedAt: '2026-10-05' },
    ],
  ],
  [2, [{ id: 201, item: 'Standing desk', total: 499, placedAt: '2026-09-30' }]],
])

const STATS: AdminStats = { users: 2, orders: 4, revenue: 762.5 }

type IssuedToken = { userId: number; expiresAt: number }

const accessTokens = new Map<string, IssuedToken>()
const refreshTokens = new Map<string, IssuedToken>()

function randomToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function userForToken(store: Map<string, IssuedToken>, token: string | undefined): User | null {
  if (!token) return null
  const issued = store.get(token)
  if (!issued) return null
  if (issued.expiresAt <= Date.now()) {
    store.delete(token)
    return null
  }
  return ACCOUNTS.find((account) => account.user.id === issued.userId)?.user ?? null
}

function refreshCookie(value: string, maxAgeSeconds: number) {
  return `${REFRESH_COOKIE}=${value}; Path=${REFRESH_COOKIE_PATH}; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}`
}

const CLEARED_COOKIE = refreshCookie('', 0)

function readRefreshCookie(header: string | undefined): string | undefined {
  const pair = header
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFRESH_COOKIE}=`))
  const value = pair?.slice(REFRESH_COOKIE.length + 1)
  return value ? value : undefined
}

function readBearer(header: string | undefined): string | undefined {
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
}

function startSession(user: User): MockResponse {
  const accessToken = randomToken()
  const refreshToken = randomToken()
  accessTokens.set(accessToken, { userId: user.id, expiresAt: Date.now() + ACCESS_TOKEN_TTL_MS })
  refreshTokens.set(refreshToken, { userId: user.id, expiresAt: Date.now() + REFRESH_TOKEN_TTL_MS })
  return {
    status: 200,
    body: { accessToken, user },
    setCookie: refreshCookie(refreshToken, REFRESH_TOKEN_TTL_MS / 1000),
  }
}

function login(body: unknown): MockResponse {
  const username = isRecord(body) && typeof body.username === 'string' ? body.username : ''
  const password = isRecord(body) && typeof body.password === 'string' ? body.password : ''
  const account = ACCOUNTS.find(
    (candidate) => candidate.user.username === username && candidate.password === password,
  )
  if (!account) return { status: 401, body: { message: 'Wrong username or password' } }
  return startSession(account.user)
}

function refresh(cookie: string | undefined): MockResponse {
  const token = readRefreshCookie(cookie)
  const user = userForToken(refreshTokens, token)
  if (!token || !user) {
    return { status: 401, body: { message: 'Session expired' }, setCookie: CLEARED_COOKIE }
  }
  refreshTokens.delete(token)
  return startSession(user)
}

function logout(request: MockRequest): MockResponse {
  const refreshToken = readRefreshCookie(request.cookie)
  if (refreshToken) refreshTokens.delete(refreshToken)
  const accessToken = readBearer(request.authorization)
  if (accessToken) accessTokens.delete(accessToken)
  return { status: 204, setCookie: CLEARED_COOKIE }
}

function authorized(request: MockRequest, respond: (user: User) => MockResponse): MockResponse {
  const user = userForToken(accessTokens, readBearer(request.authorization))
  if (!user) return { status: 401, body: { message: 'Access token expired' } }
  return respond(user)
}

export function handleRequest(request: MockRequest): MockResponse {
  const route = `${request.method.toUpperCase()} ${request.path}`
  switch (route) {
    case 'POST /api/auth/login':
      return login(request.body)
    case 'POST /api/auth/refresh':
      return refresh(request.cookie)
    case 'POST /api/auth/logout':
      return logout(request)
    case 'GET /api/me':
      return authorized(request, (user) => ({ status: 200, body: user }))
    case 'GET /api/orders':
      return authorized(request, (user) => ({ status: 200, body: ORDERS.get(user.id) ?? [] }))
    case 'GET /api/admin/stats':
      return authorized(request, (user) =>
        user.role === 'admin'
          ? { status: 200, body: STATS }
          : { status: 403, body: { message: 'Admins only' } },
      )
    default:
      return { status: 404, body: { message: `No route for ${route}` } }
  }
}

export function resetMockApi() {
  accessTokens.clear()
  refreshTokens.clear()
}
