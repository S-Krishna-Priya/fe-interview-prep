import { useEffect, useState } from 'react'

export type LoadState<T> = { status: 'ready'; value: T } | { status: 'error'; message: string }

type Result<T> = { load: () => Promise<T>; reloads: number; state: LoadState<T> }

// `load` must keep a stable identity between renders; wrap it in useCallback when it closes
// over props or state, or the effect restarts on every render.
export function useLoad<T>(load: () => Promise<T>) {
  const [reloads, setReloads] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    let active = true
    load()
      .then((value) => {
        if (active) setResult({ load, reloads, state: { status: 'ready', value } })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Something went wrong'
        if (active) setResult({ load, reloads, state: { status: 'error', message } })
      })
    return () => {
      active = false
    }
  }, [load, reloads])

  const state = result && result.load === load && result.reloads === reloads ? result.state : null

  function reload() {
    setReloads((current) => current + 1)
  }

  return { state, reload }
}
