import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../App.tsx'
import { login } from './apiClient.ts'
import { advanceClock, installMockApi } from './testApi.ts'

type User = ReturnType<typeof userEvent.setup>

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

async function signInAs(user: User, username: string, password = 'password') {
  await user.type(await screen.findByLabelText('Username'), username)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('login and session flow', () => {
  let api: ReturnType<typeof installMockApi>

  beforeEach(() => {
    api = installMockApi()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('sends a logged-out visitor to login and lands on the account page after signing in', async () => {
    const user = renderAt('/account')

    expect(await screen.findByRole('heading', { name: 'Login & Session Handling' })).toBeInTheDocument()
    await signInAs(user, 'alice')

    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument()
    expect(await screen.findByText('Mechanical keyboard')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  })

  it('shows the server message for wrong credentials and stays on the login form', async () => {
    const user = renderAt('/login')

    await signInAs(user, 'alice', 'nope')

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong username or password')
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('keeps the admin page from non-admins', async () => {
    const user = renderAt('/admin')

    await signInAs(user, 'alice')

    expect(await screen.findByRole('heading', { name: 'Admins only' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to your account' })).toBeInTheDocument()
  })

  it('shows the admin page to admins', async () => {
    const user = renderAt('/admin')

    await signInAs(user, 'admin')

    expect(await screen.findByRole('heading', { name: 'Admin dashboard' })).toBeInTheDocument()
    expect(await screen.findByText('$762.5')).toBeInTheDocument()
  })

  it('restores the session after a reload without showing the login form', async () => {
    await login('alice', 'password')
    api.forgetMemory()

    renderAt('/account')

    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session…')
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Your account' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(api.countCalls('/api/auth/login')).toBe(1)
  })

  it('signs out from the account page and returns to the login form', async () => {
    const user = renderAt('/account')
    await signInAs(user, 'alice')
    await screen.findByRole('heading', { name: 'Your account' })

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(api.countCalls('/api/auth/logout')).toBe(1)
  })

  it('recovers silently when the access token expires: the user stays signed in and sees fresh data', async () => {
    const user = renderAt('/account')
    await signInAs(user, 'alice')
    await screen.findByRole('heading', { name: 'Your account' })
    const refreshesBefore = api.countCalls('/api/auth/refresh')
    advanceClock(31_000)

    await user.click(screen.getByRole('button', { name: 'Reload data' }))

    expect(await screen.findByText('Loaded 3 orders')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your account' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(api.countCalls('/api/auth/refresh')).toBe(refreshesBefore + 1)
  })

  it('shows an error with Retry when loading fails, and recovers on retry', async () => {
    const user = renderAt('/account')
    await signInAs(user, 'alice')
    await screen.findByRole('heading', { name: 'Your account' })
    api.failNextRequest('/api/orders')

    await user.click(screen.getByRole('button', { name: 'Reload data' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to fetch')
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Loaded 3 orders')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('logs the user out and shows the login form when the refresh fails during use', async () => {
    const user = renderAt('/account')
    await signInAs(user, 'alice')
    await screen.findByRole('heading', { name: 'Your account' })
    const refreshesBefore = api.countCalls('/api/auth/refresh')
    advanceClock(11 * 60_000)

    await user.click(screen.getByRole('button', { name: 'Reload data' }))

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(api.countCalls('/api/auth/refresh')).toBe(refreshesBefore + 1)
  })
})
