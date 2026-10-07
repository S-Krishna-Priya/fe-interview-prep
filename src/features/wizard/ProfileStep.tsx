import { useId } from 'react'
import Field from './Field.tsx'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './styles.ts'
import type { FieldErrors, ProfileValues } from './types.ts'
import { useFocusFirstInvalid } from './useFocusFirstInvalid.ts'

type ProfileStepProps = {
  values: ProfileValues
  errors: FieldErrors<ProfileValues>
  attempt: number
  onChange: (field: keyof ProfileValues, value: string) => void
  onBack: () => void
  onNext: () => void
}

export default function ProfileStep({
  values,
  errors,
  attempt,
  onChange,
  onBack,
  onNext,
}: ProfileStepProps) {
  const headingId = useId()
  const formRef = useFocusFirstInvalid(attempt)

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
      <h2 id={headingId} className="text-lg font-medium">
        Profile
      </h2>
      <Field
        label="First name"
        autoComplete="given-name"
        value={values.firstName}
        error={errors.firstName}
        onChange={(event) => onChange('firstName', event.target.value)}
      />
      <Field
        label="Last name"
        autoComplete="family-name"
        value={values.lastName}
        error={errors.lastName}
        onChange={(event) => onChange('lastName', event.target.value)}
      />
      <Field
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        error={errors.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON}>
          Back
        </button>
        <button type="submit" className={PRIMARY_BUTTON}>
          Next
        </button>
      </div>
    </form>
  )
}
