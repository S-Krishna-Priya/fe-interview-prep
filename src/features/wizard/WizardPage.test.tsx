import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_DRAFT } from './types.ts'
import WizardPage, { DRAFT_STORAGE_KEY } from './WizardPage.tsx'

type User = ReturnType<typeof userEvent.setup>

const fetchMock = vi.fn<typeof fetch>()

const EMAIL = 'ada@example.com'
const PASSWORD = 'hunter2hunter2'

function createdResponse(id: number) {
  return new Response(JSON.stringify({ id }), { status: 201 })
}

function renderPage() {
  const view = render(<WizardPage />)
  return { ...view, user: userEvent.setup() }
}

async function fillAccount(user: User, confirmPassword = PASSWORD) {
  await user.type(screen.getByLabelText('Email'), EMAIL)
  await user.type(screen.getByLabelText('Password'), PASSWORD)
  await user.type(screen.getByLabelText('Confirm password'), confirmPassword)
}

async function fillProfile(user: User) {
  await user.type(screen.getByLabelText('First name'), 'Ada')
  await user.type(screen.getByLabelText('Last name'), 'Lovelace')
}

async function pressNext(user: User) {
  await user.click(screen.getByRole('button', { name: 'Next' }))
}

async function reachReview(user: User) {
  await fillAccount(user)
  await pressNext(user)
  await fillProfile(user)
  await pressNext(user)
  expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()
}

function currentStep() {
  const progress = screen.getByRole('list', { name: 'Progress' })
  return within(progress)
    .getAllByRole('listitem')
    .find((item) => item.getAttribute('aria-current') === 'step')
}

describe('WizardPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('starts on the Account step and marks it current in the progress list', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent('Account')
  })

  it('shows errors beside the fields and focuses the first one when Next is pressed on an empty step', async () => {
    const { user } = renderPage()

    await pressNext(user)

    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email).toHaveAccessibleDescription('Enter your email address')
    expect(email).toHaveFocus()
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(/Enter a password/)
    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
  })

  it('rejects a confirmation that does not match and focuses that field', async () => {
    const { user } = renderPage()

    await fillAccount(user, 'something-else')
    await pressNext(user)

    const confirm = screen.getByLabelText('Confirm password')
    expect(confirm).toHaveAccessibleDescription('Passwords do not match')
    expect(confirm).toHaveFocus()
  })

  it('clears a field error as soon as that field is edited', async () => {
    const { user } = renderPage()

    await pressNext(user)
    await user.type(screen.getByLabelText('Email'), 'a')

    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('Enter your email address')).not.toBeInTheDocument()
  })

  it('moves to Profile after a valid Account step and Back keeps what was typed', async () => {
    const { user } = renderPage()

    await fillAccount(user)
    await pressNext(user)
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(currentStep()).toHaveTextContent('Profile')

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL)
    expect(screen.getByLabelText('Password')).toHaveValue(PASSWORD)
    expect(screen.getByLabelText('Confirm password')).toHaveValue(PASSWORD)
  })

  it('validates the Profile step before moving on', async () => {
    const { user } = renderPage()

    await fillAccount(user)
    await pressNext(user)
    await user.type(screen.getByLabelText('Phone (optional)'), '12')
    await pressNext(user)

    expect(screen.getByLabelText('First name')).toHaveAccessibleDescription('Enter your first name')
    expect(screen.getByLabelText('First name')).toHaveFocus()
    expect(screen.getByLabelText('Phone (optional)')).toHaveAccessibleDescription(
      'Enter a phone number with 7 to 15 digits, or leave it blank',
    )
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
  })

  it('reviews every value with the password hidden, and Edit returns to that step', async () => {
    const { user } = renderPage()

    await reachReview(user)

    expect(screen.getByText(EMAIL)).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Not provided')).toBeInTheDocument()
    expect(screen.queryByText(PASSWORD)).not.toBeInTheDocument()
    expect(screen.getByText('hidden')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit account' }))

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL)
  })

  it('submits the registration, confirms it and clears the saved draft', async () => {
    fetchMock.mockResolvedValue(createdResponse(209))
    const { user } = renderPage()

    await reachReview(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    const heading = await screen.findByRole('heading', { name: 'Account created' })
    expect(heading).toHaveFocus()
    expect(screen.getByText(/Your account id is 209/)).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(String(url)).toBe('https://dummyjson.com/users/add')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      email: EMAIL,
      password: PASSWORD,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
    })
    expect(JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? '')).toEqual(EMPTY_DRAFT)

    await user.click(screen.getByRole('button', { name: 'Register another' }))

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('')
  })

  it('disables the submit button only while the request is in flight', async () => {
    let finish: (response: Response) => void = () => {}
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    const { user } = renderPage()

    await reachReview(user)
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByRole('button', { name: 'Creating account…' })).toBeDisabled()

    finish(createdResponse(1))

    expect(await screen.findByRole('heading', { name: 'Account created' })).toBeInTheDocument()
  })

  it('shows the failure reason and lets the visitor try again with the same data', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(createdResponse(2))
    const { user } = renderPage()

    await reachReview(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Registration failed with status 500')
    expect(screen.getByText(EMAIL)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('heading', { name: 'Account created' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('restores the step and non-secret values after a reload, then asks for the password before submitting', async () => {
    const first = renderPage()

    await reachReview(first.user)
    first.unmount()

    const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? ''
    expect(stored).not.toContain(PASSWORD)

    const { user } = renderPage()

    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument()
    expect(screen.getByText(EMAIL)).toBeInTheDocument()
    expect(screen.getByText('Ada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue(EMAIL)
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAccessibleDescription(/Enter a password/)
    expect(password).toHaveFocus()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
