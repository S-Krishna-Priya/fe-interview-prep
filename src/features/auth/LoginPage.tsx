import { useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from './AuthContext.ts'
import { CARD, INPUT, LINK, PRIMARY_BUTTON, SECONDARY_BUTTON } from './styles.ts'

function requestedPage(state: unknown) {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/account'
}

export default function LoginPage() {
  const { state, signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const usernameId = useId()
  const passwordId = useId()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signIn(username, password)
      navigate(requestedPage(location.state), { replace: true })
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Login failed')
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Login & Session Handling</h1>

      {state.status === 'restoring' && (
        <p role="status" className="mt-2 text-gray-600">
          Restoring your session…
        </p>
      )}

      {state.status === 'signedIn' && (
        <div className={CARD}>
          <p>
            Signed in as <strong>{state.user.name}</strong> ({state.user.role}).
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Access tokens expire every 30 seconds and are refreshed silently in the background.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Link to="/account" className={LINK}>
              Your account
            </Link>
            <Link to="/admin" className={LINK}>
              Admin dashboard
            </Link>
            <button type="button" onClick={signOut} className={SECONDARY_BUTTON}>
              Sign out
            </button>
          </div>
        </div>
      )}

      {state.status === 'signedOut' && (
        <form onSubmit={submit} aria-label="Sign in" className="mt-4 max-w-sm space-y-4">
          <p className="text-sm text-gray-600">
            Try <code>alice</code> / <code>password</code> for a user, or <code>admin</code> /{' '}
            <code>password</code> for an admin.
          </p>
          <div>
            <label htmlFor={usernameId} className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id={usernameId}
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT}
            />
          </div>
          {error && (
            <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}
    </>
  )
}
