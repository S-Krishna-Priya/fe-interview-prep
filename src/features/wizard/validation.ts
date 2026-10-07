import type { AccountValues, FieldErrors, ProfileValues } from './types.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8
const PHONE_MIN_DIGITS = 7
const PHONE_MAX_DIGITS = 15

export function validateAccount(values: AccountValues): FieldErrors<AccountValues> {
  const errors: FieldErrors<AccountValues> = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Enter your email address'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address, like name@example.com'
  }

  if (!values.password) {
    errors.password = 'Enter a password'
  } else if (values.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${PASSWORD_MIN_LENGTH} characters`
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return errors
}

export function validateProfile(values: ProfileValues): FieldErrors<ProfileValues> {
  const errors: FieldErrors<ProfileValues> = {}

  if (!values.firstName.trim()) errors.firstName = 'Enter your first name'
  if (!values.lastName.trim()) errors.lastName = 'Enter your last name'

  const digits = values.phone.replace(/\D/g, '')
  if (values.phone.trim() && (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS)) {
    errors.phone = `Enter a phone number with ${PHONE_MIN_DIGITS} to ${PHONE_MAX_DIGITS} digits, or leave it blank`
  }

  return errors
}

export function hasErrors(errors: FieldErrors<object>) {
  return Object.keys(errors).length > 0
}
