import { useEffect, useState } from 'react'

type Validator<T> = (value: unknown) => value is T

function readStorage<T>(key: string, fallback: T, isValid?: Validator<T>): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (isValid && !isValid(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * Like useState, but the value is persisted to localStorage under `key` and
 * restored on the next mount. Corrupt or unexpected stored data falls back to
 * `initialValue`; pass `isValid` to check the shape of what was stored.
 */
export function useLocalStorage<T>(key: string, initialValue: T, isValid?: Validator<T>) {
  const [value, setValue] = useState<T>(() => readStorage(key, initialValue, isValid))

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}
