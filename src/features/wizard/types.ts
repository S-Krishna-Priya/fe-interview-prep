export type AccountValues = {
  email: string
  password: string
  confirmPassword: string
}

export type ProfileValues = {
  firstName: string
  lastName: string
  phone: string
}

export type RegistrationValues = AccountValues & ProfileValues

export type FieldErrors<T> = Partial<Record<keyof T, string>>

export type StepId = 'account' | 'profile' | 'review'

export const STEPS: ReadonlyArray<{ id: StepId; label: string }> = [
  { id: 'account', label: 'Account' },
  { id: 'profile', label: 'Profile' },
  { id: 'review', label: 'Review' },
]

export type WizardDraft = {
  step: StepId
  email: string
  firstName: string
  lastName: string
  phone: string
}

export const EMPTY_DRAFT: WizardDraft = {
  step: 'account',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
}

export function isWizardDraft(value: unknown): value is WizardDraft {
  return (
    typeof value === 'object' &&
    value !== null &&
    'step' in value &&
    STEPS.some((step) => step.id === value.step) &&
    'email' in value &&
    typeof value.email === 'string' &&
    'firstName' in value &&
    typeof value.firstName === 'string' &&
    'lastName' in value &&
    typeof value.lastName === 'string' &&
    'phone' in value &&
    typeof value.phone === 'string'
  )
}

export type Submission =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'success'; id: number }
