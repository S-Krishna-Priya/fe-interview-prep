import { useEffect, useRef } from 'react'
import { PRIMARY_BUTTON } from './styles.ts'

type RegistrationSuccessProps = {
  id: number
  onReset: () => void
}

export default function RegistrationSuccess({ id, onReset }: RegistrationSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section className="mt-6 rounded border border-gray-200 bg-white p-6">
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium">
        Account created
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Your account id is {id}. The form has been cleared so another person can register.
      </p>
      <button type="button" onClick={onReset} className={`mt-4 ${PRIMARY_BUTTON}`}>
        Register another
      </button>
    </section>
  )
}
