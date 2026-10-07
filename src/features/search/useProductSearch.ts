import { useEffect, useState } from 'react'
import { searchProducts, type Product } from './api.ts'

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; products: Product[] }

type SettledResult = {
  /** Identifies the request this result belongs to; a stale key means a newer request is in flight. */
  key: string
  state: Extract<SearchState, { status: 'error' | 'success' }>
}

const IDLE: SearchState = { status: 'idle' }
const LOADING: SearchState = { status: 'loading' }

export function useProductSearch(query: string) {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledResult | null>(null)
  const requestKey = `${attempt}:${query}`

  useEffect(() => {
    if (!query) return

    const controller = new AbortController()

    searchProducts(query, controller.signal)
      .then((products) => {
        if (controller.signal.aborted) return
        setSettled({ key: requestKey, state: { status: 'success', products } })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong'
        setSettled({ key: requestKey, state: { status: 'error', message } })
      })

    return () => controller.abort()
  }, [query, requestKey])

  function retry() {
    setAttempt((current) => current + 1)
  }

  const state: SearchState = !query ? IDLE : settled?.key === requestKey ? settled.state : LOADING

  return { state, retry }
}
