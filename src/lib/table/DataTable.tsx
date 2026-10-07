import type { Column, Sort } from './types.ts'

type DataTableProps<Row> = {
  columns: Column<Row>[]
  rows: Row[]
  rowId: (row: Row) => string | number
  label: string
  sort: Sort | null
  onSortChange: (columnId: string) => void
  emptyMessage?: string
}

function ariaSort(column: Pick<Column<never>, 'id' | 'sortable'>, sort: Sort | null) {
  if (!column.sortable) return undefined
  if (sort?.columnId !== column.id) return 'none'
  return sort.direction === 'asc' ? 'ascending' : 'descending'
}

function sortIndicator(column: Pick<Column<never>, 'id'>, sort: Sort | null) {
  if (sort?.columnId !== column.id) return '↕'
  return sort.direction === 'asc' ? '↑' : '↓'
}

export default function DataTable<Row>({
  columns,
  rows,
  rowId,
  label,
  sort,
  onSortChange,
  emptyMessage = 'No rows to show.',
}: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={ariaSort(column, sort)}
                className={`px-3 py-2 font-semibold ${column.align === 'right' ? 'text-right' : ''}`}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSortChange(column.id)}
                    className="inline-flex items-center gap-1 rounded uppercase hover:text-gray-900"
                  >
                    {column.header}
                    <span aria-hidden="true" className="text-gray-400">
                      {sortIndicator(column, sort)}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowId(row)} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-3 py-2 ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}
                  >
                    {column.cell ? column.cell(row) : column.value(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
