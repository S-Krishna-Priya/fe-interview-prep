import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

type SearchInputProps = {
  label: string
  value: string
  onCommit: (value: string) => void
  delayMs?: number
  placeholder?: string
}

export default function SearchInput({
  label,
  value,
  onCommit,
  delayMs = 300,
  placeholder,
}: SearchInputProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)
  const [lastCommitted, setLastCommitted] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  if (value !== lastCommitted) {
    setLastCommitted(value)
    if (value !== draft.trim()) setDraft(value)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    setDraft(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onCommit(next.trim()), delayMs)
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={draft}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
      />
    </div>
  )
}
