import type { Plugin } from 'vite'
import { handleRequest } from './handlers.ts'

// @types/node is not installed, so the Node request and response are described structurally
// and checked at runtime instead of importing http types.
type NodeRequest = {
  method?: string
  url?: string
  headers: { authorization?: string; cookie?: string }
  on(event: string, listener: (chunk?: { toString(): string }) => void): unknown
}

type NodeResponse = {
  statusCode: number
  setHeader(name: string, value: string): unknown
  end(body?: string): unknown
}

function isNodeRequest(value: unknown): value is NodeRequest {
  return typeof value === 'object' && value !== null && 'headers' in value && 'on' in value
}

function isNodeResponse(value: unknown): value is NodeResponse {
  return typeof value === 'object' && value !== null && 'setHeader' in value && 'end' in value
}

function readBody(req: NodeRequest): Promise<string> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk?.toString() ?? ''
    })
    req.on('end', () => resolve(raw))
  })
}

function mockApi(req: unknown, res: unknown, next: () => void) {
  if (!isNodeRequest(req) || !isNodeResponse(res) || !req.url?.startsWith('/api/')) {
    next()
    return
  }
  const url = req.url

  readBody(req).then((raw) => {
    let body: unknown
    try {
      body = raw ? JSON.parse(raw) : undefined
    } catch {
      res.statusCode = 400
      res.end()
      return
    }

    const response = handleRequest({
      method: req.method ?? 'GET',
      path: url.replace(/\?.*$/, ''),
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
      body,
    })

    res.statusCode = response.status
    if (response.setCookie) res.setHeader('Set-Cookie', response.setCookie)
    if (response.body === undefined) {
      res.end()
      return
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response.body))
  })
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(mockApi)
    },
    configurePreviewServer(server) {
      server.middlewares.use(mockApi)
    },
  }
}
