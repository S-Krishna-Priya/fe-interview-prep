import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocalStorage } from './useLocalStorage.ts'

const isNumber = (value: unknown): value is number => typeof value === 'number'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('count', 1))
    expect(result.current[0]).toBe(1)
  })

  it('restores the stored value', () => {
    window.localStorage.setItem('count', '5')
    const { result } = renderHook(() => useLocalStorage('count', 1))
    expect(result.current[0]).toBe(5)
  })

  it('writes updates to storage', () => {
    const { result } = renderHook(() => useLocalStorage('count', 1))
    act(() => result.current[1](7))
    expect(window.localStorage.getItem('count')).toBe('7')
  })

  it('falls back to the initial value for invalid JSON', () => {
    window.localStorage.setItem('count', '{not json')
    const { result } = renderHook(() => useLocalStorage('count', 1))
    expect(result.current[0]).toBe(1)
  })

  it('falls back to the initial value when the stored shape is rejected', () => {
    window.localStorage.setItem('count', '"five"')
    const { result } = renderHook(() => useLocalStorage('count', 1, isNumber))
    expect(result.current[0]).toBe(1)
  })
})
