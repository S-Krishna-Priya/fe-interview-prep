import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAdminStats,
  getCurrentUser,
  getOrders,
  login,
  logout,
  onForcedSignOut,
  restoreSession,
} from './apiClient.ts'
import { advanceClock, installMockApi } from './testApi.ts'

const ELEVEN_MINUTES = 11 * 60_000

describe('apiClient', () => {
  let api: ReturnType<typeof installMockApi>

  beforeEach(() => {
    api = installMockApi()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('makes exactly one refresh call when three requests fail together after the access token expires', async () => {
    await login('admin', 'password')
    advanceClock(31_000)

    const [user, orders, stats] = await Promise.all([getCurrentUser(), getOrders(), getAdminStats()])

    expect(user.username).toBe('admin')
    expect(orders).toHaveLength(1)
    expect(stats.users).toBe(2)
    expect(api.countCalls('/api/auth/refresh')).toBe(1)
    expect(api.countCalls('/api/me')).toBe(2)
    expect(api.countCalls('/api/orders')).toBe(2)
    expect(api.countCalls('/api/admin/stats')).toBe(2)
  })

  it('does not refresh while the access token is still valid', async () => {
    await login('alice', 'password')

    const orders = await getOrders()

    expect(orders).toHaveLength(3)
    expect(api.countCalls('/api/auth/refresh')).toBe(0)
  })

  it('signs the user out when the refresh token has expired as well', async () => {
    const signedOut = vi.fn()
    onForcedSignOut(signedOut)
    await login('alice', 'password')
    advanceClock(ELEVEN_MINUTES)

    await expect(getOrders()).rejects.toThrow('Session expired')

    expect(signedOut).toHaveBeenCalledTimes(1)
    expect(api.countCalls('/api/auth/refresh')).toBe(1)
    expect(await restoreSession()).toBeNull()
  })

  it('restores the session from the refresh cookie after the in-memory token is lost', async () => {
    await login('alice', 'password')
    api.forgetMemory()

    const session = await restoreSession()

    expect(session?.user.username).toBe('alice')
    expect(await getOrders()).toHaveLength(3)
    expect(api.countCalls('/api/auth/refresh')).toBe(1)
  })

  it('shares one refresh call between concurrent restore attempts', async () => {
    await login('alice', 'password')
    api.forgetMemory()

    const [first, second] = await Promise.all([restoreSession(), restoreSession()])

    expect(first?.accessToken).toBe(second?.accessToken)
    expect(api.countCalls('/api/auth/refresh')).toBe(1)
  })

  it('returns no session when there is nothing to restore', async () => {
    expect(await restoreSession()).toBeNull()
  })

  it('cannot restore a session after logging out', async () => {
    await login('alice', 'password')
    await logout()
    api.forgetMemory()

    expect(await restoreSession()).toBeNull()
  })

  it('rejects wrong credentials with the server message', async () => {
    await expect(login('alice', 'nope')).rejects.toThrow('Wrong username or password')
  })

  it('reports a forbidden request without refreshing', async () => {
    await login('alice', 'password')

    await expect(getAdminStats()).rejects.toThrow('Admins only')
    expect(api.countCalls('/api/auth/refresh')).toBe(0)
  })
})
