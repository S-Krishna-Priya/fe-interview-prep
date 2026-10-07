import { useEffect, useRef } from 'react'

export function useStepFocus(attempt: number, navigation: number) {
  const formRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (attempt === 0 && navigation === 0) return
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(firstInvalid ?? headingRef.current)?.focus()
  }, [attempt, navigation])

  return { formRef, headingRef }
}
