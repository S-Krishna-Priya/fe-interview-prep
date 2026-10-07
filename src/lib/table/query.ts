import type { CellValue, Column, ColumnFilter, FilterValues, Sort } from './types.ts'

const textCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true })

export function nextSort(current: Sort | null, columnId: string): Sort | null {
  if (current?.columnId !== columnId) return { columnId, direction: 'asc' }
  if (current.direction === 'asc') return { columnId, direction: 'desc' }
  return null
}

function searchableText<Row>(column: Column<Row>, row: Row): string {
  return column.text ? column.text(row) : String(column.value(row) ?? '')
}

export function searchRows<Row>(rows: Row[], columns: Column<Row>[], query: string): Row[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter((row) =>
    columns.some((column) => searchableText(column, row).toLowerCase().includes(needle)),
  )
}

export function filterRows<Row>(
  rows: Row[],
  filters: ColumnFilter<Row>[],
  selected: FilterValues,
): Row[] {
  const active = filters.filter((filter) => selected[filter.id])
  if (active.length === 0) return rows
  return rows.filter((row) => active.every((filter) => filter.value(row) === selected[filter.id]))
}

function compareValues(a: CellValue, b: CellValue): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b)
  return textCollator.compare(String(a), String(b))
}

export function sortRows<Row>(rows: Row[], columns: Column<Row>[], sort: Sort | null): Row[] {
  const column = sort && columns.find((candidate) => candidate.id === sort.columnId)
  if (!column) return rows
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = column.value(a)
    const right = column.value(b)
    if (left == null || right == null) return compareValues(left, right)
    return sign * compareValues(left, right)
  })
}

export function distinctValues<Row>(rows: Row[], read: (row: Row) => string): string[] {
  return [...new Set(rows.map(read))].sort((a, b) => a.localeCompare(b))
}

export type Page<Row> = {
  rows: Row[]
  page: number
  pageCount: number
  firstIndex: number
  lastIndex: number
}

export function paginate<Row>(rows: Row[], requestedPage: number, pageSize: number): Page<Row> {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)
  return {
    rows: pageRows,
    page,
    pageCount,
    firstIndex: pageRows.length === 0 ? 0 : start + 1,
    lastIndex: start + pageRows.length,
  }
}
