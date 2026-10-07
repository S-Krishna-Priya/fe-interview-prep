import { useEffect, useState } from 'react'

export type LoadState<T> = { status: 'ready'; value: T } | { status: 'error'; message: string }

type Result<T> = { load: () => Promise<T>; reloads: number; state: LoadState<T> }

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
