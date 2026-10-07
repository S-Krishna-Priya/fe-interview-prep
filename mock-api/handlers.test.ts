import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isSession } from '../src/features/auth/types.ts'
import {
  ACCESS_TOKEN_TTL_MS,
  handleRequest,
  REFRESH_TOKEN_TTL_MS,
  resetMockApi,
  type MockResponse,
} from './handlers.ts'

function sessionOf(response: MockResponse) {
  if (!isSession(response.body)) throw new Error(`Expected a session, got status ${response.status}`)
  const cookie = response.setCookie?.split(';')[0]
  return { accessToken: response.body.accessToken, user: response.body.user, cookie }
}

function loginAs(username: string, password = 'password') {
  return handleRequest({ method: 'POST', path: '/api/auth/login', body: { username, password } })
}

function get(path: string, accessToken: string) {
  return handleRequest({ method: 'GET', path, authorization: `Bearer ${accessToken}` })
}

function refreshWith(cookie: string | undefined) {
  return handleRequest({ method: 'POST', path: '/api/auth/refresh', cookie })
}

function advanceClock(ms: number) {
  const now = Date.now()
  vi.spyOn(Date, 'now').mockReturnValue(now + ms)
}

describe('mock API handlers', () => {
  beforeEach(resetMockApi)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects wrong credentials', () => {
    expect(loginAs('alice', 'wrong')).toMatchObject({
      status: 401,
      body: { message: 'Wrong username or password' },
    })
  })

  it('issues an access token that works for 30 seconds and then expires', () => {
    const { accessToken } = sessionOf(loginAs('alice'))

    advanceClock(ACCESS_TOKEN_TTL_MS - 1000)
    expect(get('/api/me', accessToken)).toMatchObject({ status: 200, body: { username: 'alice' } })

    advanceClock(2000)
    expect(get('/api/me', accessToken)).toMatchObject({ status: 401 })
  })

  it('refreshes with the cookie, rotating the refresh token', () => {
    const first = sessionOf(loginAs('alice'))

    const refreshed = sessionOf(refreshWith(first.cookie))

    expect(refreshed.accessToken).not.toBe(first.accessToken)
    expect(refreshed.user.username).toBe('alice')
    expect(refreshWith(first.cookie)).toMatchObject({ status: 401 })
    expect(get('/api/orders', refreshed.accessToken)).toMatchObject({ status: 200 })
  })

  it('rejects a refresh after 10 minutes and clears the cookie', () => {
    const { cookie } = sessionOf(loginAs('alice'))
    advanceClock(REFRESH_TOKEN_TTL_MS + 1000)

    const response = refreshWith(cookie)

    expect(response.status).toBe(401)
    expect(response.setCookie).toContain('Max-Age=0')
  })

  it('serves admin stats to admins only', () => {
    const alice = sessionOf(loginAs('alice'))
    const admin = sessionOf(loginAs('admin'))

    expect(get('/api/admin/stats', alice.accessToken)).toMatchObject({ status: 403 })
    expect(get('/api/admin/stats', admin.accessToken)).toMatchObject({
      status: 200,
      body: { users: 2 },
    })
  })

  it('logs out by clearing the cookie and revoking the refresh token', () => {
    const { accessToken, cookie } = sessionOf(loginAs('alice'))

    const response = handleRequest({
      method: 'POST',
      path: '/api/auth/logout',
      authorization: `Bearer ${accessToken}`,
      cookie,
    })

    expect(response.status).toBe(204)
    expect(response.setCookie).toContain('Max-Age=0')
    expect(refreshWith(cookie)).toMatchObject({ status: 401 })
    expect(get('/api/me', accessToken)).toMatchObject({ status: 401 })
  })

  it('answers unknown routes with 404', () => {
    expect(handleRequest({ method: 'GET', path: '/api/nothing' })).toMatchObject({ status: 404 })
  })
})
