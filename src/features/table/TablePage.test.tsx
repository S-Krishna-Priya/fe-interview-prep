import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TablePage from './TablePage.tsx'

const fetchMock = vi.fn<typeof fetch>()

const COUNTRIES = ['Norway', 'Spain', 'India']

function randomUser(index: number) {
  return {
    gender: index % 2 === 0 ? 'female' : 'male',
    name: { title: 'Ms', first: 'Person', last: `L${String((index * 7) % 60).padStart(2, '0')}` },
    location: { city: `City ${index}`, country: COUNTRIES[index % 3] },
    email: `person${index}@example.com`,
    login: { uuid: `uuid-${index}` },
    dob: { date: '1990-01-01T00:00:00.000Z', age: 20 + (index % 40) },
    registered: { date: '2015-02-22T02:57:23.623Z', age: 11 },
    picture: { thumbnail: 'https://example.com/thumb.jpg' },
  }
}

function usersResponse(count = 60) {
  const results = Array.from({ length: count }, (_, i) => randomUser(i + 1))
  return new Response(JSON.stringify({ results }), { status: 200 })
}

function HistoryProbe() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current URL">{location.search}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
    </>
  )
}

function renderPage(initialUrl = '/table') {
  const view = render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <TablePage searchDelayMs={20} />
      <HistoryProbe />
    </MemoryRouter>,
  )
  return { ...view, user: userEvent.setup() }
}

function currentUrl() {
  return screen.getByRole('status', { name: 'Current URL' }).textContent
}

function summary() {
  return screen.getByRole('navigation', { name: 'Pagination' }).querySelector('p')?.textContent
}

function bodyRows() {
  return within(screen.getByRole('table', { name: 'People' }))
    .getAllByRole('row')
    .slice(1)
}

function firstRowName() {
  return within(bodyRows()[0]!).getAllByRole('cell')[0]?.textContent
}

function header(name: string) {
  return screen.getByRole('button', { name }).closest('th')
}

describe('TablePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockImplementation(() => Promise.resolve(usersResponse()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('shows a loading state, then the first page of rows with a summary', async () => {
    renderPage()

    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Loading people…')
    expect(await screen.findByRole('table', { name: 'People' })).toBeInTheDocument()

    expect(bodyRows()).toHaveLength(10)
    expect(summary()).toBe('Showing 1–10 of 60 · Page 1 of 6')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('cycles a column through ascending, descending and none and keeps the URL in step', async () => {
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'People' })
    expect(firstRowName()).toBe('Person L07')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(header('Name')).toHaveAttribute('aria-sort', 'ascending')
    expect(firstRowName()).toBe('Person L00')
    expect(currentUrl()).toBe('?sort=name&dir=asc')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(header('Name')).toHaveAttribute('aria-sort', 'descending')
    expect(firstRowName()).toBe('Person L59')
    expect(currentUrl()).toBe('?sort=name&dir=desc')

    await user.click(screen.getByRole('button', { name: 'Name' }))
    expect(header('Name')).toHaveAttribute('aria-sort', 'none')
    expect(firstRowName()).toBe('Person L07')
    expect(currentUrl()).toBe('')
  })

  it('narrows rows with the global search once typing pauses', async () => {
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'People' })

    await user.type(screen.getByLabelText('Search people'), 'person12@')

    expect(await screen.findByText('Showing 1–1 of 1 · Page 1 of 1')).toBeInTheDocument()
    expect(bodyRows()[0]).toHaveTextContent('person12@example.com')
    expect(currentUrl()).toBe('?q=person12%40')
  })

  it('searches the displayed text and returns to page 1 when the search changes', async () => {
    const { user } = renderPage('/table?page=2')
    await screen.findByRole('table', { name: 'People' })
    expect(summary()).toBe('Showing 11–20 of 60 · Page 2 of 6')

    await user.type(screen.getByLabelText('Search people'), 'feb 2015')

    expect(await screen.findByText('Showing 1–10 of 60 · Page 1 of 6')).toBeInTheDocument()
    expect(currentUrl()).toBe('?q=feb+2015')
  })

  it('keeps a trailing space in the search box after the trimmed query is committed', async () => {
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'People' })
    const input = screen.getByLabelText('Search people')

    await user.type(input, 'person ')
    expect(await screen.findByText('?q=person')).toBeInTheDocument()

    expect(input).toHaveValue('person ')
  })

  it('returns to page 1 when a column filter changes', async () => {
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'People' })

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(summary()).toBe('Showing 11–20 of 60 · Page 2 of 6')
    expect(currentUrl()).toBe('?page=2')

    await user.selectOptions(screen.getByLabelText('Country'), 'Spain')

    expect(summary()).toBe('Showing 1–10 of 20 · Page 1 of 2')
    expect(currentUrl()).toBe('?country=Spain')
    for (const row of bodyRows()) expect(row).toHaveTextContent('Spain')
  })

  it('changes the page size and returns to page 1', async () => {
    const { user } = renderPage('/table?page=3')
    await screen.findByRole('table', { name: 'People' })
    expect(summary()).toBe('Showing 21–30 of 60 · Page 3 of 6')

    await user.selectOptions(screen.getByLabelText('Rows per page'), '25')

    expect(bodyRows()).toHaveLength(25)
    expect(summary()).toBe('Showing 1–25 of 60 · Page 1 of 3')
    expect(currentUrl()).toBe('?size=25')
  })

  it('restores the exact view from a shared link', async () => {
    renderPage('/table?q=person&sort=age&dir=desc&gender=female&page=2&size=25')
    await screen.findByRole('table', { name: 'People' })

    expect(screen.getByLabelText('Search people')).toHaveValue('person')
    expect(header('Age')).toHaveAttribute('aria-sort', 'descending')
    expect(screen.getByLabelText('Gender')).toHaveValue('female')
    expect(screen.getByLabelText('Rows per page')).toHaveValue('25')
    expect(summary()).toBe('Showing 26–30 of 30 · Page 2 of 2')
    expect(bodyRows()).toHaveLength(5)
  })

  it('falls back to defaults for unexpected URL values and clamps the page', async () => {
    renderPage('/table?page=999&sort=nope&dir=up&size=7&country=Atlantis')
    await screen.findByRole('table', { name: 'People' })

    expect(screen.getByLabelText('Rows per page')).toHaveValue('10')
    for (const th of screen.getAllByRole('columnheader')) {
      expect(th).toHaveAttribute('aria-sort', 'none')
    }
    expect(screen.getByLabelText('Country')).toHaveValue('')
    expect(summary()).toBe('Showing 51–60 of 60 · Page 6 of 6')
  })

  it('moves between views with the browser history', async () => {
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'People' })

    await user.click(screen.getByRole('button', { name: 'Age' }))
    expect(header('Age')).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(header('Age')).toHaveAttribute('aria-sort', 'none')
    expect(currentUrl()).toBe('')

    await user.click(screen.getByRole('button', { name: 'Forward' }))
    expect(header('Age')).toHaveAttribute('aria-sort', 'ascending')
    expect(currentUrl()).toBe('?sort=age&dir=asc')
  })

  it('shows an error with a retry button that fetches again', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(usersResponse(3))
    const { user } = renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Loading people failed with status 500',
    )

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('table', { name: 'People' })).toBeInTheDocument()
    expect(bodyRows()).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
