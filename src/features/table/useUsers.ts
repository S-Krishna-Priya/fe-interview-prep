import { useEffect, useState } from 'react'
import { fetchUsers, type User } from './api.ts'

export type UsersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; users: User[] }

type SettledResult = {
  attempt: number
  state: Extract<UsersState, { status: 'error' | 'success' }>
}

const LOADING: UsersState = { status: 'loading' }

export function useUsers() {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<SettledResult | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchUsers(controller.signal)
      .then((users) => {
        if (controller.signal.aborted) return
        setSettled({ attempt, state: { status: 'success', users } })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong'
        setSettled({ attempt, state: { status: 'error', message } })
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setAttempt((current) => current + 1)
  }

  const state: UsersState = settled?.attempt === attempt ? settled.state : LOADING

  return { state, retry }
}
