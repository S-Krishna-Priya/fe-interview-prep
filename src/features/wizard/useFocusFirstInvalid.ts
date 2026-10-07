import { useEffect, useRef } from 'react'

export function useFocusFirstInvalid(attempt: number) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (attempt === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [attempt])

  return formRef
}
