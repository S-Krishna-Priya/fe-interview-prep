import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 401 }))),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a navigation link for each of the five questions', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Questions' })
    expect(nav.querySelectorAll('a')).toHaveLength(5)
  })

  it('redirects the root path to the todo page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Todo App' })).toBeInTheDocument()
  })
})
