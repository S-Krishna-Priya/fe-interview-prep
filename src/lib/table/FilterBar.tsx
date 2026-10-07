import { useId } from 'react'
import type { FilterValues } from './types.ts'

export type FilterOption = {
  id: string
  label: string
  options: string[]
}

type FilterBarProps = {
  filters: FilterOption[]
  values: FilterValues
  onChange: (id: string, value: string) => void
}

export default function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const prefix = useId()

  return (
    <div className="flex flex-wrap gap-4">
      {filters.map((filter) => {
        const selectId = `${prefix}-${filter.id}`
        return (
          <div key={filter.id}>
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
              {filter.label}
            </label>
            <select
              id={selectId}
              value={values[filter.id] ?? ''}
              onChange={(event) => onChange(filter.id, event.target.value)}
              className="mt-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
