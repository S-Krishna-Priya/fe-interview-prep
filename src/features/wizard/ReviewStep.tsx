import { useId, type ReactNode } from 'react'
import { LINK_BUTTON, PRIMARY_BUTTON, SECONDARY_BUTTON } from './styles.ts'
import type { RegistrationValues, StepId, Submission } from './types.ts'
import { useStepFocus } from './useStepFocus.ts'

type ReviewStepProps = {
  values: RegistrationValues
  submission: Submission
  navigation: number
  onEdit: (step: StepId) => void
  onBack: () => void
  onSubmit: () => void
}

type ReviewSectionProps = {
  title: string
  editLabel: string
  onEdit: () => void
  rows: Array<[label: string, value: ReactNode]>
}

function ReviewSection({ title, editLabel, onEdit, rows }: ReviewSectionProps) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="rounded border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 id={headingId} className="font-medium">
          {title}
        </h3>
        <button type="button" onClick={onEdit} className={LINK_BUTTON}>
          {editLabel}
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-600">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function ReviewStep({
  values,
  submission,
  navigation,
  onEdit,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const headingId = useId()
  const { formRef, headingRef } = useStepFocus(0, navigation)
  const submitting = submission.status === 'submitting'

  return (
    <form
      ref={formRef}
      noValidate
      aria-labelledby={headingId}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="mt-6 space-y-4"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-lg font-medium">
        Review
      </h2>
      <ReviewSection
        title="Account"
        editLabel="Edit account"
        onEdit={() => onEdit('account')}
        rows={[
          ['Email', values.email.trim()],
          [
            'Password',
            <>
              <span aria-hidden="true">••••••••</span>
              <span className="sr-only">hidden</span>
            </>,
          ],
        ]}
      />
      <ReviewSection
        title="Profile"
        editLabel="Edit profile"
        onEdit={() => onEdit('profile')}
        rows={[
          ['First name', values.firstName.trim()],
          ['Last name', values.lastName.trim()],
          ['Phone', values.phone.trim() || 'Not provided'],
        ]}
      />
      {submission.status === 'error' && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Registration failed</p>
          <p className="mt-1 text-sm text-red-700">{submission.message}</p>
        </div>
      )}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className={SECONDARY_BUTTON}>
          Back
        </button>
        <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </div>
    </form>
  )
}
