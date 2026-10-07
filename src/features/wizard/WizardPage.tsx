import { useState } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage.ts'
import AccountStep from './AccountStep.tsx'
import { registerUser } from './api.ts'
import ProfileStep from './ProfileStep.tsx'
import RegistrationSuccess from './RegistrationSuccess.tsx'
import ReviewStep from './ReviewStep.tsx'
import StepIndicator from './StepIndicator.tsx'
import {
  EMPTY_DRAFT,
  isWizardDraft,
  type AccountValues,
  type FieldErrors,
  type ProfileValues,
  type StepId,
  type Submission,
} from './types.ts'
import { hasErrors, validateAccount, validateProfile } from './validation.ts'

export const DRAFT_STORAGE_KEY = 'wizard.draft'

const EMPTY_SECRETS = { password: '', confirmPassword: '' }
const IDLE: Submission = { status: 'idle' }

function without<T extends object>(errors: FieldErrors<T>, field: keyof T): FieldErrors<T> {
  const next = { ...errors }
  delete next[field]
  return next
}

export default function WizardPage() {
  const [draft, setDraft] = useLocalStorage(DRAFT_STORAGE_KEY, EMPTY_DRAFT, isWizardDraft)
  const [secrets, setSecrets] = useState(EMPTY_SECRETS)
  const [accountErrors, setAccountErrors] = useState<FieldErrors<AccountValues>>({})
  const [profileErrors, setProfileErrors] = useState<FieldErrors<ProfileValues>>({})
  const [attempt, setAttempt] = useState(0)
  const [submission, setSubmission] = useState<Submission>(IDLE)

  const account: AccountValues = { email: draft.email, ...secrets }
  const profile: ProfileValues = {
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: draft.phone,
  }

  function goTo(step: StepId) {
    setDraft((current) => ({ ...current, step }))
  }

  function failAttempt() {
    setAttempt((current) => current + 1)
  }

  function updateAccount(field: keyof AccountValues, value: string) {
    if (field === 'email') {
      setDraft((current) => ({ ...current, email: value }))
    } else {
      setSecrets((current) => ({ ...current, [field]: value }))
    }
    setAccountErrors((current) => without(current, field))
  }

  function updateProfile(field: keyof ProfileValues, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
    setProfileErrors((current) => without(current, field))
  }

  function nextFromAccount() {
    const errors = validateAccount(account)
    setAccountErrors(errors)
    if (hasErrors(errors)) return failAttempt()
    goTo('profile')
  }

  function nextFromProfile() {
    const errors = validateProfile(profile)
    setProfileErrors(errors)
    if (hasErrors(errors)) return failAttempt()
    goTo('review')
  }

  async function submit() {
    const nextAccountErrors = validateAccount(account)
    const nextProfileErrors = validateProfile(profile)
    setAccountErrors(nextAccountErrors)
    setProfileErrors(nextProfileErrors)
    if (hasErrors(nextAccountErrors)) {
      failAttempt()
      return goTo('account')
    }
    if (hasErrors(nextProfileErrors)) {
      failAttempt()
      return goTo('profile')
    }

    setSubmission({ status: 'submitting' })
    try {
      const id = await registerUser({ ...account, ...profile })
      setSubmission({ status: 'success', id })
      setDraft(EMPTY_DRAFT)
      setSecrets(EMPTY_SECRETS)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong'
      setSubmission({ status: 'error', message })
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Registration Wizard</h1>
      {submission.status === 'success' ? (
        <RegistrationSuccess id={submission.id} onReset={() => setSubmission(IDLE)} />
      ) : (
        <>
          <StepIndicator current={draft.step} />
          {draft.step === 'account' && (
            <AccountStep
              values={account}
              errors={accountErrors}
              attempt={attempt}
              onChange={updateAccount}
              onNext={nextFromAccount}
            />
          )}
          {draft.step === 'profile' && (
            <ProfileStep
              values={profile}
              errors={profileErrors}
              attempt={attempt}
              onChange={updateProfile}
              onBack={() => goTo('account')}
              onNext={nextFromProfile}
            />
          )}
          {draft.step === 'review' && (
            <ReviewStep
              values={{ ...account, ...profile }}
              submission={submission}
              onEdit={goTo}
              onBack={() => goTo('profile')}
              onSubmit={submit}
            />
          )}
        </>
      )}
    </>
  )
}
