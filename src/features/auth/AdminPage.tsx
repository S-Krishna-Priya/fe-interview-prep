import { Link } from 'react-router'
import { getAdminStats } from './apiClient.ts'
import LoadError from './LoadError.tsx'
import { CARD, LINK, SECONDARY_BUTTON } from './styles.ts'
import { useLoad } from './useLoad.ts'

export default function AdminPage() {
  const { state, reload } = useLoad(getAdminStats)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <button type="button" onClick={reload} className={SECONDARY_BUTTON}>
          Reload stats
        </button>
      </div>

      <p role="status" className="mt-2 text-sm text-gray-600">
        {state ? '' : 'Loading stats…'}
      </p>

      {state?.status === 'error' && (
        <LoadError title="Could not load stats" message={state.message} onRetry={reload} />
      )}

      {state?.status === 'ready' && (
        <dl className={`${CARD} grid grid-cols-3 gap-4 text-center`}>
          <div>
            <dt className="text-sm text-gray-600">Users</dt>
            <dd className="text-2xl font-semibold">{state.value.users}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Orders</dt>
            <dd className="text-2xl font-semibold">{state.value.orders}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Revenue</dt>
            <dd className="text-2xl font-semibold">${state.value.revenue}</dd>
          </div>
        </dl>
      )}

      <Link to="/account" className={`mt-4 inline-block ${LINK}`}>
        Back to your account
      </Link>
    </>
  )
}
