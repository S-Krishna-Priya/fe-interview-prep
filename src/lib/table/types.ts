import type { ReactNode } from 'react'

export type CellValue = string | number | boolean | null | undefined

export type Column<Row> = {
  id: string
  header: string
  value: (row: Row) => CellValue
  cell?: (row: Row) => ReactNode
  sortable?: boolean
  align?: 'left' | 'right'
}

export type SortDirection = 'asc' | 'desc'

export type Sort = {
  columnId: string
  direction: SortDirection
}

export type ColumnFilter<Row> = {
  id: string
  label: string
  value: (row: Row) => string
}

export type FilterValues = Record<string, string>
