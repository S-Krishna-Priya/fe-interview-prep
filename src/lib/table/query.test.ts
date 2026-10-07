import { describe, expect, it } from 'vitest'
import { distinctValues, filterRows, nextSort, paginate, searchRows, sortRows } from './query.ts'
import type { Column, ColumnFilter } from './types.ts'

type Person = { name: string; age: number | null; team: string }

const columns: Column<Person>[] = [
  { id: 'name', header: 'Name', value: (row) => row.name, sortable: true },
  { id: 'age', header: 'Age', value: (row) => row.age, sortable: true },
  { id: 'team', header: 'Team', value: (row) => row.team },
]

const teamFilter: ColumnFilter<Person> = { id: 'team', label: 'Team', value: (row) => row.team }

const people: Person[] = [
  { name: 'Zoe', age: 31, team: 'Blue' },
  { name: 'adam', age: 25, team: 'Red' },
  { name: 'Maya', age: null, team: 'Blue' },
  { name: 'Ben', age: 40, team: 'Red' },
]

describe('nextSort', () => {
  it('cycles a column through ascending, descending and none', () => {
    const asc = nextSort(null, 'name')
    expect(asc).toEqual({ columnId: 'name', direction: 'asc' })
    const desc = nextSort(asc, 'name')
    expect(desc).toEqual({ columnId: 'name', direction: 'desc' })
    expect(nextSort(desc, 'name')).toBeNull()
  })

  it('starts ascending when a different column is chosen mid-cycle', () => {
    expect(nextSort({ columnId: 'name', direction: 'desc' }, 'age')).toEqual({
      columnId: 'age',
      direction: 'asc',
    })
  })
})

describe('sortRows', () => {
  it('sorts strings case-insensitively and numbers numerically', () => {
    const byName = sortRows(people, columns, { columnId: 'name', direction: 'asc' })
    expect(byName.map((row) => row.name)).toEqual(['adam', 'Ben', 'Maya', 'Zoe'])

    const byAgeDesc = sortRows(people, columns, { columnId: 'age', direction: 'desc' })
    expect(byAgeDesc.map((row) => row.name)).toEqual(['Ben', 'Zoe', 'adam', 'Maya'])
  })

  it('keeps missing values last in both directions', () => {
    const asc = sortRows(people, columns, { columnId: 'age', direction: 'asc' })
    expect(asc.at(-1)?.name).toBe('Maya')
    const desc = sortRows(people, columns, { columnId: 'age', direction: 'desc' })
    expect(desc.at(-1)?.name).toBe('Maya')
  })

  it('does not mutate the input and returns it unchanged without a sort', () => {
    const before = [...people]
    expect(sortRows(people, columns, null)).toBe(people)
    expect(sortRows(people, columns, { columnId: 'missing', direction: 'asc' })).toBe(people)
    sortRows(people, columns, { columnId: 'name', direction: 'asc' })
    expect(people).toEqual(before)
  })
})

describe('searchRows', () => {
  it('matches any column case-insensitively and ignores surrounding spaces', () => {
    expect(searchRows(people, columns, '  BLUE ').map((row) => row.name)).toEqual(['Zoe', 'Maya'])
    expect(searchRows(people, columns, '40').map((row) => row.name)).toEqual(['Ben'])
  })

  it('returns every row for an empty query', () => {
    expect(searchRows(people, columns, '   ')).toBe(people)
  })
})

describe('filterRows', () => {
  it('keeps only rows matching every selected filter and ignores empty selections', () => {
    expect(filterRows(people, [teamFilter], { team: 'Red' }).map((row) => row.name)).toEqual([
      'adam',
      'Ben',
    ])
    expect(filterRows(people, [teamFilter], { team: '' })).toBe(people)
  })
})

describe('distinctValues', () => {
  it('lists each value once in alphabetical order', () => {
    expect(distinctValues(people, (row) => row.team)).toEqual(['Blue', 'Red'])
  })
})

describe('paginate', () => {
  it('slices the requested page and reports the visible range', () => {
    const page = paginate(people, 2, 3)
    expect(page.rows.map((row) => row.name)).toEqual(['Ben'])
    expect(page).toMatchObject({ page: 2, pageCount: 2, firstIndex: 4, lastIndex: 4 })
  })

  it('clamps a page beyond the end to the last page and below one to the first', () => {
    expect(paginate(people, 99, 3).page).toBe(2)
    expect(paginate(people, 0, 3).page).toBe(1)
  })

  it('reports one empty page when there are no rows', () => {
    expect(paginate([], 5, 10)).toEqual({
      rows: [],
      page: 1,
      pageCount: 1,
      firstIndex: 0,
      lastIndex: 0,
    })
  })
})
