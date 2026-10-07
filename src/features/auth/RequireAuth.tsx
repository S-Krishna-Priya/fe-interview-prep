import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthContext.ts'
import { LINK } from './styles.ts'
import type { Role } from './types.ts'

type RequireAuthProps = {
  role?: Role
  children: ReactNode
}

export default function RequireAuth({ role, children }: RequireAuthProps) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === 'restoring') {
    return (
      <p role="status" className="text-gray-600">
        Restoring your session…
      </p>
    )
  }

  if (state.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  }

  if (role && state.user.role !== role) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="mt-2 text-gray-600">
          You are signed in as {state.user.name}, which is not an admin account.
        </p>
        <Link to="/account" className={`mt-4 inline-block ${LINK}`}>
          Back to your account
        </Link>
      </>
    )
  }

  return children
}
