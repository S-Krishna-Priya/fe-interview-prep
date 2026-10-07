import { useSearchParams } from 'react-router'
import {
  parseTableView,
  serializeTableView,
  type TableView,
  type TableViewOptions,
} from './tableView.ts'
import type { Sort } from './types.ts'

export function useTableView(options: TableViewOptions) {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseTableView(searchParams, options)

  function update(changes: Partial<TableView>) {
    setSearchParams((current) =>
      serializeTableView({ ...parseTableView(current, options), page: 1, ...changes }, options),
    )
  }

  return {
    view,
    setSearch: (search: string) => update({ search }),
    setSort: (sort: Sort | null) => update({ sort }),
    setFilter: (id: string, value: string) => update({ filters: { ...view.filters, [id]: value } }),
    setPageSize: (pageSize: number) => update({ pageSize }),
    setPage: (page: number) => update({ page }),
  }
}
