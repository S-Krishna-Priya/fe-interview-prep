import { useEffect, useState } from 'react'
import { searchProducts, type Product } from './api.ts'

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; products: Product[] }

const IDLE: SearchState = { status: 'idle' }

export function useProductSearch(query: string) {
  const [state, setState] = useState<SearchState>(IDLE)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!query) {
      setState(IDLE)
      return
    }

    const controller = new AbortController()
    setState({ status: 'loading' })

    searchProducts(query, controller.signal)
      .then((products) => {
        if (controller.signal.aborted) return
        setState({ status: 'success', products })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong'
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [query, attempt])

  function retry() {
    setAttempt((current) => current + 1)
  }

  return { state, retry }
}
