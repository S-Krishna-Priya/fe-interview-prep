import { describe, expect, it } from 'vitest'
import { hasErrors, validateAccount, validateProfile } from './validation.ts'

const validAccount = { email: 'ada@example.com', password: 'hunter2hunter2', confirmPassword: 'hunter2hunter2' }
const validProfile = { firstName: 'Ada', lastName: 'Lovelace', phone: '' }

describe('validateAccount', () => {
  it('accepts a complete, matching account', () => {
    expect(validateAccount(validAccount)).toEqual({})
  })

  it('requires an email, a password and a confirmation', () => {
    expect(validateAccount({ email: '  ', password: '', confirmPassword: '' })).toEqual({
      email: 'Enter your email address',
      password: 'Enter a password',
      confirmPassword: 'Confirm your password',
    })
  })

  it('rejects an email without a domain', () => {
    expect(validateAccount({ ...validAccount, email: 'ada@' })).toMatchObject({
      email: 'Enter a valid email address, like name@example.com',
    })
  })

  it('rejects a short password', () => {
    expect(validateAccount({ ...validAccount, password: 'short', confirmPassword: 'short' })).toEqual({
      password: 'Use at least 8 characters',
    })
  })

  it('rejects a confirmation that differs from the password', () => {
    expect(validateAccount({ ...validAccount, confirmPassword: 'hunter2hunter3' })).toEqual({
      confirmPassword: 'Passwords do not match',
    })
  })
})

describe('validateProfile', () => {
  it('accepts names with no phone', () => {
    expect(validateProfile(validProfile)).toEqual({})
  })

  it('requires both names', () => {
    expect(validateProfile({ firstName: '', lastName: ' ', phone: '' })).toEqual({
      firstName: 'Enter your first name',
      lastName: 'Enter your last name',
    })
  })

  it('accepts a formatted phone number with enough digits', () => {
    expect(validateProfile({ ...validProfile, phone: '+44 (0)20 7946 0958' })).toEqual({})
  })

  it('rejects a phone number with too few digits', () => {
    expect(validateProfile({ ...validProfile, phone: '12-34' })).toEqual({
      phone: 'Enter a phone number with 7 to 15 digits, or leave it blank',
    })
  })
})

describe('hasErrors', () => {
  it('is true only when at least one field has a message', () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ email: 'Enter your email address' })).toBe(true)
  })
})
