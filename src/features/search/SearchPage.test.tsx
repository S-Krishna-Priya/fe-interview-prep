import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, ProductSearchResponse } from './api.ts'
import SearchPage from './SearchPage.tsx'

const fetchMock = vi.fn<typeof fetch>()

function product(id: number, title: string, description = 'A product'): Product {
  return {
    id,
    title,
    description,
    category: 'smartphones',
    price: 99,
    thumbnail: 'https://example.com/thumb.jpg',
  }
}

function resultsResponse(products: Product[]) {
  const body: ProductSearchResponse = { products, total: products.length }
  return new Response(JSON.stringify(body), { status: 200 })
}

type PendingRequest = {
  url: string
  signal: AbortSignal | null | undefined
  resolve: (response: Response) => void
}

function captureRequests() {
  const requests: PendingRequest[] = []
  fetchMock.mockImplementation(
    (input, init) =>
      new Promise<Response>((resolve) => {
        requests.push({ url: String(input), signal: init?.signal, resolve })
      }),
  )
  return requests
}

function renderPage() {
  const view = render(<SearchPage debounceMs={50} />)
  const user = userEvent.setup()
  const input = screen.getByLabelText('Search products')
  return { ...view, user, input }
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('sends a single request once the user stops typing', async () => {
    fetchMock.mockResolvedValue(resultsResponse([product(1, 'React handbook')]))
    const { user, input } = renderPage()

    await user.type(input, 'react')

    expect(await screen.findByRole('heading', { name: 'React handbook' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('q=react')
  })

  it('shows results for the latest query even when an earlier response arrives late', async () => {
    const requests = captureRequests()
    const { user, input } = renderPage()

    await user.type(input, 'ph')
    await waitFor(() => expect(requests).toHaveLength(1))
    await user.type(input, 'one')
    await waitFor(() => expect(requests).toHaveLength(2))

    expect(requests[0]?.signal?.aborted).toBe(true)
    expect(requests[1]?.url).toContain('q=phone')

    requests[1]?.resolve(resultsResponse([product(2, 'Phone')]))
    expect(await screen.findByRole('heading', { name: 'Phone' })).toBeInTheDocument()

    requests[0]?.resolve(resultsResponse([product(1, 'Photo frame')]))
    await act(() => Promise.resolve())

    expect(screen.getByRole('heading', { name: 'Phone' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Photo frame' })).not.toBeInTheDocument()
  })

  it('shows an error with a retry button that fetches again', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(resultsResponse([product(1, 'Laptop')]))
    const { user, input } = renderPage()

    await user.type(input, 'laptop')

    expect(await screen.findByRole('alert')).toHaveTextContent('Search failed with status 500')

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByRole('heading', { name: 'Laptop' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shows an empty state naming the query', async () => {
    fetchMock.mockResolvedValue(resultsResponse([]))
    const { user, input } = renderPage()

    await user.type(input, 'xyz')

    expect(await screen.findByText("No results for 'xyz'")).toBeInTheDocument()
  })

  it('highlights the matched text in each result', async () => {
    fetchMock.mockResolvedValue(resultsResponse([product(1, 'Phone case', 'Fits any phone')]))
    const { user, input } = renderPage()

    await user.type(input, 'phone')

    const item = await screen.findByRole('listitem')
    const marks = within(item).getAllByText(/phone/i, { selector: 'mark' })
    expect(marks.map((mark) => mark.textContent)).toEqual(['Phone', 'phone'])
  })

  it('returns to the idle state as soon as the input is cleared', async () => {
    fetchMock.mockResolvedValue(resultsResponse([product(1, 'Phone')]))
    const { user, input } = renderPage()

    await user.type(input, 'phone')
    await screen.findByRole('heading', { name: 'Phone' })

    await user.clear(input)

    expect(screen.getByText('Start typing to search products.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Phone' })).not.toBeInTheDocument()
  })

  it('keeps one status region mounted across state changes so announcements are reliable', async () => {
    fetchMock.mockResolvedValue(resultsResponse([product(1, 'Phone')]))
    const { user, input } = renderPage()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Start typing to search products.')

    await user.type(input, 'phone')
    await screen.findByRole('heading', { name: 'Phone' })

    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent("1 result for 'phone'")
  })

  it('aborts the in-flight request when the page unmounts', async () => {
    const requests = captureRequests()
    const { user, input, unmount } = renderPage()

    await user.type(input, 'phone')
    await waitFor(() => expect(requests).toHaveLength(1))

    unmount()

    expect(requests[0]?.signal?.aborted).toBe(true)
  })
})
