import { useEffect, useState, type ReactNode } from 'react'
import { login, logout, onForcedSignOut, restoreSession } from './apiClient.ts'
import { AuthContext, type AuthState } from './AuthContext.ts'

const SIGNED_OUT: AuthState = { status: 'signedOut' }

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'restoring' })

  useEffect(() => {
    let active = true
    restoreSession().then((session) => {
      if (!active) return
      setState(session ? { status: 'signedIn', user: session.user } : SIGNED_OUT)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => onForcedSignOut(() => setState(SIGNED_OUT)), [])

  async function signIn(username: string, password: string) {
    const session = await login(username, password)
    setState({ status: 'signedIn', user: session.user })
  }

  async function signOut() {
    await logout()
    setState(SIGNED_OUT)
  }

  return <AuthContext.Provider value={{ state, signIn, signOut }}>{children}</AuthContext.Provider>
}
