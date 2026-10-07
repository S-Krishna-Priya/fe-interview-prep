import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue.ts'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('react', 300))
    expect(result.current).toBe('react')
  })

  it('only updates once the value has stopped changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: '' },
    })

    rerender({ value: 'r' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 're' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'react' })
    act(() => vi.advanceTimersByTime(200))

    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('react')
  })
})
