import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import TodoPage from './TodoPage.tsx'

async function addTodo(title: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('New todo'), title)
  await user.click(screen.getByRole('button', { name: 'Add' }))
}

describe('TodoPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows an empty state before any todo exists', () => {
    render(<TodoPage />)
    expect(screen.getByText('No todos yet. Add one above.')).toBeInTheDocument()
    expect(screen.getByText('0 items left')).toBeInTheDocument()
  })

  it('adds a todo and clears the input', async () => {
    render(<TodoPage />)
    await addTodo('Buy milk')

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByLabelText('New todo')).toHaveValue('')
    expect(screen.getByText('1 item left')).toBeInTheDocument()
  })

  it('ignores empty and whitespace-only titles', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)

    await user.click(screen.getByRole('button', { name: 'Add' }))
    await addTodo('   ')

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByText('0 items left')).toBeInTheDocument()
  })

  it('completes and reactivates a todo, updating the remaining count', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')
    await addTodo('Walk dog')

    await user.click(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as completed' }))
    expect(screen.getByText('1 item left')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as active' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as active' }))
    expect(screen.getByText('2 items left')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as completed' })).not.toBeChecked()
  })

  it('edits a todo title', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')

    await user.click(screen.getByRole('button', { name: 'Edit "Buy milk"' }))
    const input = screen.getByRole('textbox', { name: 'Edit "Buy milk"' })
    await user.clear(input)
    await user.type(input, 'Buy oat milk{Enter}')

    expect(screen.getByText('Buy oat milk')).toBeInTheDocument()
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
  })

  it('keeps the old title when the edit is blank or cancelled', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')

    await user.click(screen.getByRole('button', { name: 'Edit "Buy milk"' }))
    await user.clear(screen.getByRole('textbox', { name: 'Edit "Buy milk"' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit "Buy milk"' }))
    await user.type(screen.getByRole('textbox', { name: 'Edit "Buy milk"' }), ' and eggs{Escape}')
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Edit "Buy milk"' })).not.toBeInTheDocument()
  })

  it('deletes a todo', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')

    await user.click(screen.getByRole('button', { name: 'Delete "Buy milk"' }))

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('No todos yet. Add one above.')).toBeInTheDocument()
  })

  it('filters by active and completed', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')
    await addTodo('Walk dog')
    await user.click(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as completed' }))

    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Active' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Completed' }))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.queryByText('Walk dog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
  })

  it('shows a filter-specific empty state', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')

    await user.click(screen.getByRole('button', { name: 'Completed' }))

    expect(screen.getByText('Nothing to show for this filter.')).toBeInTheDocument()
  })

  it('clears completed todos', async () => {
    const user = userEvent.setup()
    render(<TodoPage />)
    await addTodo('Buy milk')
    await addTodo('Walk dog')
    const clearButton = screen.getByRole('button', { name: 'Clear completed' })
    expect(clearButton).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as completed' }))
    await user.click(clearButton)

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    expect(screen.getByText('Walk dog')).toBeInTheDocument()
    expect(clearButton).toBeDisabled()
  })

  it('restores todos and the selected filter after a reload', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<TodoPage />)
    await addTodo('Buy milk')
    await user.click(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as completed' }))
    await user.click(screen.getByRole('button', { name: 'Completed' }))
    unmount()

    render(<TodoPage />)

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Mark "Buy milk" as active' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true')
  })

  it.each([
    ['a non-array', '"not a list"'],
    ['an array with a null entry', '[null]'],
    ['an array of malformed objects', '[{"id":1}]'],
  ])('ignores corrupt stored todos (%s) instead of crashing', (_label, stored) => {
    window.localStorage.setItem('todos', stored)
    window.localStorage.setItem('todos.filter', '"bogus"')

    render(<TodoPage />)

    expect(screen.getByText('No todos yet. Add one above.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
  })
})
