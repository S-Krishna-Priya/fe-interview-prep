import { createContext, useContext } from 'react'
import type { User } from './types.ts'

export type AuthState =
  | { status: 'restoring' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User }

export type AuthContextValue = {
  state: AuthState
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
