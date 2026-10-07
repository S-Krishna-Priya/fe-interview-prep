import DataTable from '../../lib/table/DataTable.tsx'
import FilterBar from '../../lib/table/FilterBar.tsx'
import Pagination from '../../lib/table/Pagination.tsx'
import SearchInput from '../../lib/table/SearchInput.tsx'
import { distinctValues, filterRows, nextSort, paginate, searchRows, sortRows } from '../../lib/table/query.ts'
import type { TableViewOptions } from '../../lib/table/tableView.ts'
import { useTableView } from '../../lib/table/useTableView.ts'
import type { User } from './api.ts'
import { userColumns, userFilters } from './columns.tsx'
import { useUsers } from './useUsers.ts'

const PAGE_SIZES = [10, 25, 50] as const

const VIEW_OPTIONS: TableViewOptions = {
  sortableColumnIds: userColumns.filter((column) => column.sortable).map((column) => column.id),
  filterIds: userFilters.map((filter) => filter.id),
  pageSizes: PAGE_SIZES,
  defaultPageSize: 10,
}

const NO_USERS: User[] = []

type TablePageProps = {
  searchDelayMs?: number
}

export default function TablePage({ searchDelayMs }: TablePageProps) {
  const { state, retry } = useUsers()
  const { view, setSearch, setSort, setFilter, setPage, setPageSize } = useTableView(VIEW_OPTIONS)

  const users = state.status === 'success' ? state.users : NO_USERS
  const searched = searchRows(users, userColumns, view.search)
  const filtered = filterRows(searched, userFilters, view.filters)
  const sorted = sortRows(filtered, userColumns, view.sort)
  const page = paginate(sorted, view.page, view.pageSize)

  const filterOptions = userFilters.map((filter) => ({
    id: filter.id,
    label: filter.label,
    options: distinctValues(users, filter.value),
  }))

  return (
    <>
      <h1 className="text-2xl font-semibold">Data Table</h1>
      <p className="mt-1 text-sm text-gray-600">
        500 people. Sort, search, filter and page through them; the address bar always describes
        the current view, so copy it to share.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <SearchInput
            label="Search people"
            value={view.search}
            onCommit={setSearch}
            delayMs={searchDelayMs}
            placeholder="Name, email or country"
          />
        </div>
        <FilterBar filters={filterOptions} values={view.filters} onChange={setFilter} />
      </div>

      {state.status === 'loading' && (
        <p role="status" className="mt-6 text-sm text-gray-600">
          Loading people…
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="mt-6 rounded border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Could not load people</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === 'success' && (
        <div className="mt-6 space-y-3">
          <DataTable
            columns={userColumns}
            rows={page.rows}
            rowId={(user) => user.id}
            label="People"
            sort={view.sort}
            onSortChange={(columnId) => setSort(nextSort(view.sort, columnId))}
            emptyMessage="No people match the current search and filters."
          />
          <Pagination
            page={page.page}
            pageCount={page.pageCount}
            pageSize={view.pageSize}
            pageSizes={PAGE_SIZES}
            firstIndex={page.firstIndex}
            lastIndex={page.lastIndex}
            totalRows={sorted.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </>
  )
}
