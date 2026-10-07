import { useId } from 'react'
import Field from './Field.tsx'
import { PRIMARY_BUTTON } from './styles.ts'
import type { AccountValues, FieldErrors } from './types.ts'
import { useStepFocus } from './useStepFocus.ts'
import { PASSWORD_MIN_LENGTH } from './validation.ts'

type AccountStepProps = {
  values: AccountValues
  errors: FieldErrors<AccountValues>
  attempt: number
  navigation: number
  onChange: (field: keyof AccountValues, value: string) => void
  onNext: () => void
}

export default function AccountStep({
  values,
  errors,
  attempt,
  navigation,
  onChange,
  onNext,
}: AccountStepProps) {
  const headingId = useId()
  const { formRef, headingRef } = useStepFocus(attempt, navigation)

  return (
    <form
      ref={formRef}
      noValidate
      aria-labelledby={headingId}
      onSubmit={(event) => {
        event.preventDefault()
        onNext()
      }}
      className="mt-6 space-y-4"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-lg font-medium">
        Account
      </h2>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        value={values.password}
        error={errors.password}
        onChange={(event) => onChange('password', event.target.value)}
      />
      <Field
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(event) => onChange('confirmPassword', event.target.value)}
      />
      <div className="flex justify-end pt-2">
        <button type="submit" className={PRIMARY_BUTTON}>
          Next
        </button>
      </div>
    </form>
  )
}
