import { describe, expect, test } from '@jest/globals'

import { parser } from '../src/index.js'

describe('URL Query Parser', () => {
  test('parses resource type and identifier', () => {
    const url = 'users/12345'
    const result = parser(url)

    expect(result).toEqual({
      resourceType: 'users',
      identifier: '12345',
      filter: [],
      sort: [],
      fields: {},
      pagination: {}
    })
  })

  test.only('parses sorting parameters', () => {
    const url = 'users?sort=name:asc,created_at:desc'
    const result = parser(url)

    // expect(result.sort).toEqual([
    //   { field: 'name', direction: 'asc' },
    //   { field: 'created_at', direction: 'desc' }
    // ])

    expect(result).toEqual({
      resourceType: 'users',
      identifier: null,
      filter: [],
      sort: [
        { field: 'name', direction: 'asc' },
        { field: 'created_at', direction: 'desc' }
      ],
      fields: {},
      pagination: {}
    })
  })

  test('parses sorting parameters without direction', () => {
    const url = 'users?sort=name,created_at'
    const result = parser(url)

    expect(result.sort).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'created_at', direction: 'asc' }
    ])
  })

  test('parses filters with conditions', () => {
    const url = 'users?filter=age[gte]30'
    const result = parser(url)

    expect(result.filter).toEqual({
      type: 'group',
      logical: 'and',
      conditions: [
        {
          field: 'age',
          operator: 'gte',
          value: 30
        }
      ]
    })
  })

  test('parses nested filter groups', () => {
    const url = 'users?filter=(age[gte]30|age[lt]20);status[eq]active'
    const result = parser(url)

    expect(result.filter).toEqual({
      type: 'group',
      logical: 'and',
      conditions: [
        {
          type: 'group',
          logical: 'or',
          conditions: [
            { field: 'age', operator: 'gte', value: 30 },
            { field: 'age', operator: 'lt', value: 20 }
          ]
        },
        { field: 'status', operator: 'eq', value: 'active' }
      ]
    })
  })

  test('throws error for missing delimiter before group', () => {
    const url = 'users?filter=age[gte]30(status[eq]active|age[lt]20)'

    expect(() => parser(url)).toThrow('Invalid syntax: missing delimiter before "("')
  })

  test('parses filter with valid delimiter before group', () => {
    const url = 'users?filter=age[gte]30;(status[eq]active|age[lt]20)'
    const result = parser(url)

    expect(result.filter).toEqual({
      type: 'group',
      logical: 'and',
      conditions: [
        { field: 'age', operator: 'gte', value: 30 },
        {
          type: 'group',
          logical: 'or',
          conditions: [
            { field: 'status', operator: 'eq', value: 'active' },
            { field: 'age', operator: 'lt', value: 20 }
          ]
        }
      ]
    })
  })

  test('parses filter with valid conditions separated by', () => {
    const url = 'users?filter=age[gte]30;status[eq]active'
    const result = parser(url)
    expect(result.filter).toEqual({
      type: 'group',
      logical: 'and',
      conditions: [
        { field: 'age', operator: 'gte', value: 30 },
        { field: 'status', operator: 'eq', value: 'active' }
      ]
    })
  })

  test.skip('parses filter with a single group condition', () => {
    const url = 'users?filter=(age[gte]30)'
    const result = parser(url)

    expect(result.filter).toEqual({
      type: 'group',
      logical: 'and',
      conditions: [
        { field: 'age', operator: 'gte', value: 30 }
      ]
    })
  })

  test('parses field selections', () => {
    const url = 'users?fields=users:name,email'
    const result = parser(url)
    expect(result.fields).toEqual({
      users: ['name', 'email']
    })
  })

  test('parses pagination parameters', () => {
    const url = 'users?limit=10&offset=20'
    const result = parser(url)
    console.log(result)

    expect(result.pagination).toEqual({ limit: 10, offset: 20 })
  })

  test('handles empty path segments', () => {
    const url = ''
    const result = parser(url)
    expect(result).toEqual({
      resourceType: undefined,
      identifier: null,
      filter: [],
      sort: [],
      fields: {},
      pagination: {}
    })
  })

  test('handles invalid filter condition gracefully', () => {
    const url = 'users?filter=invalidcondition'
    expect(() => parser(url)).toThrow('Invalid filter condition: "invalidcondition"')
  })

  test('handles missing sort field gracefully', () => {
    const url = 'users?sort=:asc'
    expect(() => parser(url)).toThrow('Missing order field')
  })

  test('handles invalid sort direction gracefully', () => {
    const url = 'users?sort=name:invalid'
    expect(() => parser(url)).toThrow('Invalid sorting direction: \'invalid\'. Expected \'asc\' or \'desc\'.')
  })

  test('parses complex URL with multiple parameters', () => {
    const url = 'users/2979368b-790d-4b9a-b031-8d67d35b8359?sort=created_at:desc&sort=lastname:asc&filter=email[eq]null'
    const result = parser(url)
    expect(result).toEqual({
      resourceType: 'users',
      identifier: '2979368b-790d-4b9a-b031-8d67d35b8359',
      filter: {
        type: 'group',
        logical: 'and',
        conditions: [
          {
            field: 'email',
            operator: 'eq',
            value: null
          }
        ]
      },
      sort: [
        { field: 'created_at', direction: 'desc' },
        { field: 'lastname', direction: 'asc' }
      ],
      fields: {},
      pagination: {}
    })
  })

  test('parses malformed filter gracefully', () => {
    const url = 'users?filter=age[gte]'
    expect(() => parser(url)).toThrow('Invalid filter condition: "age[gte]"')
  })

  test('parses invalid pagination gracefully', () => {
    const url = 'users?limit=abc&offset=xyz'
    expect(() => parser(url)).toThrow('Invalid pagination field \'limit\'. The value must be an integer.')
  })

  test('parses invalid field selection gracefully', () => {
    const url = 'users?fields=name,email'

    expect(() => parser(url)).toThrow('Invalid fields selection. Try \'resource:fields1,field2[,fieldn]\'')
  })

  test('handles unexpected characters in tokens', () => {
    const url = 'users?filter=age[>=]30'
    expect(() => parser(url)).toThrow('Invalid filter condition: "age[>=]30"')
  })
})
