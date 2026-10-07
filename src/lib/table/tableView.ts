import type { FilterValues, Sort, SortDirection } from './types.ts'

export type TableView = {
  search: string
  sort: Sort | null
  filters: FilterValues
  page: number
  pageSize: number
}

export type TableViewOptions = {
  sortableColumnIds: readonly string[]
  filterIds: readonly string[]
  pageSizes: readonly number[]
  defaultPageSize: number
}

const PARAM = {
  search: 'q',
  sort: 'sort',
  direction: 'dir',
  page: 'page',
  pageSize: 'size',
} as const

function isDirection(value: string | null): value is SortDirection {
  return value === 'asc' || value === 'desc'
}

function parsePositiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return parsed >= 1 ? parsed : null
}

function parseSort(params: URLSearchParams, options: TableViewOptions): Sort | null {
  const columnId = params.get(PARAM.sort)
  const direction = params.get(PARAM.direction)
  if (!columnId || !options.sortableColumnIds.includes(columnId) || !isDirection(direction)) {
    return null
  }
  return { columnId, direction }
}

function parsePageSize(params: URLSearchParams, options: TableViewOptions): number {
  const requested = parsePositiveInt(params.get(PARAM.pageSize))
  return requested !== null && options.pageSizes.includes(requested)
    ? requested
    : options.defaultPageSize
}

export function parseTableView(params: URLSearchParams, options: TableViewOptions): TableView {
  const filters: FilterValues = {}
  for (const id of options.filterIds) {
    const value = params.get(id)
    if (value) filters[id] = value
  }
  return {
    search: params.get(PARAM.search) ?? '',
    sort: parseSort(params, options),
    filters,
    page: parsePositiveInt(params.get(PARAM.page)) ?? 1,
    pageSize: parsePageSize(params, options),
  }
}

export function serializeTableView(view: TableView, options: TableViewOptions): URLSearchParams {
  const params = new URLSearchParams()
  if (view.search) params.set(PARAM.search, view.search)
  if (view.sort) {
    params.set(PARAM.sort, view.sort.columnId)
    params.set(PARAM.direction, view.sort.direction)
  }
  for (const id of options.filterIds) {
    const value = view.filters[id]
    if (value) params.set(id, value)
  }
  if (view.page > 1) params.set(PARAM.page, String(view.page))
  if (view.pageSize !== options.defaultPageSize) params.set(PARAM.pageSize, String(view.pageSize))
  return params
}
