import { useId, useState } from 'react'
import { useDebouncedValue } from '../../lib/useDebouncedValue.ts'
import SearchResults from './SearchResults.tsx'
import { useProductSearch, type SearchState } from './useProductSearch.ts'

const DEFAULT_DEBOUNCE_MS = 300

type SearchPageProps = {
  debounceMs?: number
}

function resolveVisibleState(typed: string, debounced: string, fetched: SearchState): SearchState {
  if (!typed) return { status: 'idle' }
  if (typed !== debounced) return { status: 'loading' }
  return fetched
}

export default function SearchPage({ debounceMs = DEFAULT_DEBOUNCE_MS }: SearchPageProps) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(trimmedQuery, debounceMs)
  const { state, retry } = useProductSearch(debouncedQuery)

  const visibleState = resolveVisibleState(trimmedQuery, debouncedQuery, state)

  return (
    <>
      <h1 className="text-2xl font-semibold">Live Search</h1>

      <div className="mt-4">
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          Search products
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try “phone” or “laptop”"
          autoComplete="off"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
        />
      </div>

      <section aria-label="Search results" className="mt-6">
        <SearchResults state={visibleState} query={trimmedQuery} onRetry={retry} />
      </section>
    </>
  )
}
