import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Highlight from './Highlight.tsx'

describe('Highlight', () => {
  it('marks every case-insensitive match of the query', () => {
    render(<Highlight text="iPhone phone case" query="PHONE" />)

    const marks = screen.getAllByText(/phone/i, { selector: 'mark' })
    expect(marks.map((mark) => mark.textContent)).toEqual(['Phone', 'phone'])
  })

  it('renders the text untouched when the query is blank', () => {
    const { container } = render(<Highlight text="Laptop" query="   " />)

    expect(container.querySelector('mark')).toBeNull()
    expect(container).toHaveTextContent('Laptop')
  })

  it('treats regex characters in the query literally', () => {
    render(<Highlight text="Price (USD) 10.5" query="(USD)" />)

    expect(screen.getByText('(USD)', { selector: 'mark' })).toBeInTheDocument()
  })
})
