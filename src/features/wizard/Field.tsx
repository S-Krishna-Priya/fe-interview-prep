import { useId, type ComponentPropsWithoutRef } from 'react'

type FieldProps = {
  label: string
  error?: string
  hint?: string
} & Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'aria-invalid' | 'aria-describedby' | 'className'>

export default function Field({ label, error, hint, ...inputProps }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ')

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-1 w-full rounded border px-3 py-2 ${error ? 'border-red-600' : 'border-gray-300'}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
