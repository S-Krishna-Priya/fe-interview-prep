import { useId } from 'react'

type PaginationProps = {
  page: number
  pageCount: number
  pageSize: number
  pageSizes: readonly number[]
  firstIndex: number
  lastIndex: number
  totalRows: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const buttonClass =
  'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white'

export default function Pagination({
  page,
  pageCount,
  pageSize,
  pageSizes,
  firstIndex,
  lastIndex,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const sizeId = useId()

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-3 text-sm">
      <label htmlFor={sizeId} className="flex items-center gap-2 text-gray-700">
        Rows per page
        <select
          id={sizeId}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded border border-gray-300 bg-white px-2 py-1"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <p role="status" className="mr-auto text-gray-600">
        {totalRows === 0
          ? 'No rows'
          : `Showing ${firstIndex}–${lastIndex} of ${totalRows} · Page ${page} of ${pageCount}`}
      </p>

      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={buttonClass}
      >
        Previous
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className={buttonClass}
      >
        Next
      </button>
    </nav>
  )
}
