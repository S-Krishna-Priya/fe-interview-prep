import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import DataTable from './DataTable.tsx'
import type { Column } from './types.ts'

type Fruit = { id: number; name: string; kilos: number }

const columns: Column<Fruit>[] = [
  { id: 'name', header: 'Fruit', value: (row) => row.name, sortable: true },
  {
    id: 'kilos',
    header: 'Weight',
    value: (row) => row.kilos,
    cell: (row) => `${row.kilos} kg`,
    align: 'right',
  },
]

const fruit: Fruit[] = [
  { id: 1, name: 'Apple', kilos: 2 },
  { id: 2, name: 'Pear', kilos: 5 },
]

describe('DataTable', () => {
  it('renders a header per column and a cell per column for each row', () => {
    render(
      <DataTable
        columns={columns}
        rows={fruit}
        rowId={(row) => row.id}
        label="Fruit"
        sort={null}
        onSortChange={() => {}}
      />,
    )

    const table = screen.getByRole('table', { name: 'Fruit' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[1]!).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Pear',
      '5 kg',
    ])
  })

  it('exposes the sort state on sortable headers and reports clicks', async () => {
    const onSortChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DataTable
        columns={columns}
        rows={fruit}
        rowId={(row) => row.id}
        label="Fruit"
        sort={{ columnId: 'name', direction: 'desc' }}
        onSortChange={onSortChange}
      />,
    )

    const [name, weight] = screen.getAllByRole('columnheader')
    expect(name).toHaveAttribute('aria-sort', 'descending')
    expect(weight).not.toHaveAttribute('aria-sort')
    expect(within(weight!).queryByRole('button')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fruit' }))
    expect(onSortChange).toHaveBeenCalledWith('name')
  })

  it('shows the empty message in a single cell when there are no rows', () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowId={(row) => row.id}
        label="Fruit"
        sort={null}
        onSortChange={() => {}}
        emptyMessage="Nothing matches."
      />,
    )

    expect(screen.getByRole('cell', { name: 'Nothing matches.' })).toHaveAttribute('colspan', '2')
  })
})
