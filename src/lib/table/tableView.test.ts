import { describe, expect, it } from 'vitest'
import { parseTableView, serializeTableView, type TableViewOptions } from './tableView.ts'

const options: TableViewOptions = {
  sortableColumnIds: ['name', 'age'],
  filterIds: ['team'],
  pageSizes: [10, 25, 50],
  defaultPageSize: 10,
}

describe('parseTableView', () => {
  it('returns the default view for an empty query string', () => {
    expect(parseTableView(new URLSearchParams(), options)).toEqual({
      search: '',
      sort: null,
      filters: {},
      page: 1,
      pageSize: 10,
    })
  })

  it('reads every part of a shared view', () => {
    const params = new URLSearchParams('q=ann&sort=age&dir=desc&team=Red&page=3&size=25')
    expect(parseTableView(params, options)).toEqual({
      search: 'ann',
      sort: { columnId: 'age', direction: 'desc' },
      filters: { team: 'Red' },
      page: 3,
      pageSize: 25,
    })
  })

  it('falls back safely for unknown sort columns, directions, sizes and pages', () => {
    const params = new URLSearchParams('sort=nope&dir=asc&size=7&page=abc&other=1')
    expect(parseTableView(params, options)).toMatchObject({ sort: null, pageSize: 10, page: 1 })

    const badDirection = new URLSearchParams('sort=name&dir=up&page=0')
    expect(parseTableView(badDirection, options)).toMatchObject({ sort: null, page: 1 })
  })

  it('ignores filters that are not declared', () => {
    const params = new URLSearchParams('team=Red&colour=blue')
    expect(parseTableView(params, options).filters).toEqual({ team: 'Red' })
  })
})

describe('serializeTableView', () => {
  it('omits default values so the share link stays short', () => {
    const params = serializeTableView(
      { search: '', sort: null, filters: {}, page: 1, pageSize: 10 },
      options,
    )
    expect(params.toString()).toBe('')
  })

  it('round-trips a full view', () => {
    const view = {
      search: 'ann smith',
      sort: { columnId: 'name', direction: 'asc' as const },
      filters: { team: 'Blue' },
      page: 2,
      pageSize: 50,
    }
    const params = serializeTableView(view, options)
    expect(parseTableView(params, options)).toEqual(view)
    expect(params.toString()).toBe('q=ann+smith&sort=name&dir=asc&team=Blue&page=2&size=50')
  })
})
