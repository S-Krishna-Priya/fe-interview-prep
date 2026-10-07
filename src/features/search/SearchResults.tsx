import Highlight from './Highlight.tsx'
import type { SearchState } from './useProductSearch.ts'

type SearchResultsProps = {
  state: SearchState
  query: string
  onRetry: () => void
}

export default function SearchResults({ state, query, onRetry }: SearchResultsProps) {
  if (state.status === 'idle') {
    return <p className="text-gray-600">Start typing to search products.</p>
  }

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-gray-600">
        {`Searching for '${query}'…`}
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="rounded border border-red-200 bg-red-50 p-4">
        <p className="font-medium text-red-800">Search failed</p>
        <p className="mt-1 text-sm text-red-700">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    )
  }

  if (state.products.length === 0) {
    return (
      <p role="status" className="text-gray-600">
        {`No results for '${query}'`}
      </p>
    )
  }

  return (
    <>
      <p role="status" className="text-sm text-gray-600">
        {`${state.products.length} ${state.products.length === 1 ? 'result' : 'results'} for '${query}'`}
      </p>
      <ul className="mt-3 divide-y divide-gray-200 rounded border border-gray-200 bg-white">
        {state.products.map((product) => (
          <li key={product.id} className="flex gap-4 p-4">
            <img
              src={product.thumbnail}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              className="h-16 w-16 shrink-0 rounded bg-gray-100 object-cover"
            />
            <div className="min-w-0">
              <h2 className="font-medium">
                <Highlight text={product.title} query={query} />
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                <Highlight text={product.description} query={query} />
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {product.category} · ${product.price}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
