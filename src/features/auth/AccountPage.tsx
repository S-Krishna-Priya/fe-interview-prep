import { useCallback } from 'react'
import { Link } from 'react-router'
import { getAdminStats, getCurrentUser, getOrders } from './apiClient.ts'
import { useAuth } from './AuthContext.ts'
import LoadError from './LoadError.tsx'
import { CARD, LINK, SECONDARY_BUTTON } from './styles.ts'
import type { AdminStats, Order, User } from './types.ts'
import { useLoad, type LoadState } from './useLoad.ts'

type AccountData = { user: User; orders: Order[]; stats: AdminStats | null }

function statusText(state: LoadState<AccountData> | null) {
  if (!state) return 'Loading your account…'
  if (state.status === 'error') return ''
  const count = state.value.orders.length
  return `Loaded ${count} ${count === 1 ? 'order' : 'orders'}`
}

export default function AccountPage() {
  const { state: auth, signOut } = useAuth()
  const isAdmin = auth.status === 'signedIn' && auth.user.role === 'admin'
  const loadAccount = useCallback(
    () =>
      Promise.all([getCurrentUser(), getOrders(), isAdmin ? getAdminStats() : null]).then(
        ([user, orders, stats]) => ({ user, orders, stats }),
      ),
    [isAdmin],
  )
  const { state, reload } = useLoad(loadAccount)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Your account</h1>
        <div className="flex gap-2">
          <button type="button" onClick={reload} className={SECONDARY_BUTTON}>
            Reload data
          </button>
          <button type="button" onClick={signOut} className={SECONDARY_BUTTON}>
            Sign out
          </button>
        </div>
      </div>

      <p role="status" className="mt-2 text-sm text-gray-600">
        {statusText(state)}
      </p>

      {state?.status === 'error' && (
        <LoadError title="Could not load your account" message={state.message} onRetry={reload} />
      )}

      {state?.status === 'ready' && (
        <>
          <section aria-labelledby="profile-heading" className={CARD}>
            <h2 id="profile-heading" className="font-medium">
              Profile
            </h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-gray-600">Name</dt>
              <dd>{state.value.user.name}</dd>
              <dt className="text-gray-600">Username</dt>
              <dd>{state.value.user.username}</dd>
              <dt className="text-gray-600">Role</dt>
              <dd>{state.value.user.role}</dd>
            </dl>
          </section>

          <section aria-labelledby="orders-heading" className={CARD}>
            <h2 id="orders-heading" className="font-medium">
              Orders
            </h2>
            {state.value.orders.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">No orders yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-200 text-sm">
                {state.value.orders.map((order) => (
                  <li key={order.id} className="flex justify-between gap-4 py-2">
                    <span>{order.item}</span>
                    <span className="text-gray-600">
                      ${order.total} · {order.placedAt}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {state.value.stats && (
            <section aria-labelledby="stats-heading" className={CARD}>
              <h2 id="stats-heading" className="font-medium">
                Admin stats
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {state.value.stats.users} users, {state.value.stats.orders} orders, $
                {state.value.stats.revenue} revenue.{' '}
                <Link to="/admin" className={LINK}>
                  Open the admin dashboard
                </Link>
              </p>
            </section>
          )}
        </>
      )}
    </>
  )
}
