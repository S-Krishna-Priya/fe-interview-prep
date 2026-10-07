import { vi } from 'vitest'
import { handleRequest, resetMockApi } from '../../../mock-api/handlers.ts'
import { resetApiClient } from './apiClient.ts'

type RecordedCall = { method: string; path: string }

export function installMockApi() {
  resetMockApi()
  resetApiClient()
  let cookie: string | undefined
  let failingPath: string | null = null
  const calls: RecordedCall[] = []

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = String(input)
    const method = init?.method ?? 'GET'
    calls.push({ method, path })
    if (failingPath === path) {
      failingPath = null
      throw new TypeError('Failed to fetch')
    }
    const headers = new Headers(init?.headers)
    const response = handleRequest({
      method,
      path,
      authorization: headers.get('authorization') ?? undefined,
      cookie,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    })
    if (response.setCookie) {
      cookie = response.setCookie.includes('Max-Age=0') ? undefined : response.setCookie.split(';')[0]
    }
    const body = response.body === undefined ? null : JSON.stringify(response.body)
    return new Response(body, { status: response.status })
  })
  vi.stubGlobal('fetch', fetchMock)

  return {
    countCalls: (path: string) => calls.filter((call) => call.path === path).length,
    forgetMemory: () => resetApiClient(),
    failNextRequest: (path: string) => {
      failingPath = path
    },
  }
}

export function advanceClock(ms: number) {
  const now = Date.now()
  vi.spyOn(Date, 'now').mockReturnValue(now + ms)
}
