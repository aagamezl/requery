/**
 * @typedef {Object} Query
 * @property {string} resourceType - The type of the resource being queried (e.g., 'users').
 * @property {string} [identifier] - The unique identifier for a resource, if applicable.
 * @property {FilterGroup|FilterCondition} [filter] - The filter conditions applied to the query.
 * @property {Sort[]} [sort] - An array of sorting criteria.
 * @property {Fields} [fields] - Fields to include in the result, grouped by resource type.
 * @property {Pagination} [pagination] - Pagination details including limit and offset.
 */

/**
 * @typedef {Object} FilterGroup
 * @property {'group'} type - Indicates this is a group of filters.
 * @property {'and'|'or'} logical - Logical operator to combine the conditions.
 * @property {(FilterGroup|FilterCondition)[]} conditions - Nested conditions or groups.
 */

/**
 * @typedef {Object} FilterCondition
 * @property {string} field - The field being filtered.
 * @property {'eq'|'ne'|'gt'|'gte'|'lt'|'lte'|'like'} operator - Comparison operator.
 * @property {*} value - The value to compare the field against.
 */

/**
 * @typedef {Object} Sort
 * @property {string} field - The field to sort by, optionally with a default direction (e.g., 'created_at:desc').
 * @property {'asc'|'desc'} direction - The sorting direction.
 */

/**
 * @typedef {Object.<string, string[]>} Fields
 * A mapping of resource types to the fields to include in the result.
 * @property {string[]} users - Fields to include for the 'users' resource type.
 * @property {string[]} posts - Fields to include for the 'posts' resource type.
 */

/**
 * @typedef {Object} Pagination
 * @property {number} limit - Maximum number of results to return.
 * @property {number} offset - Number of results to skip.
 */

/**
 *
 * @param {string} url
 * @returns {Query}
 */
export const parser = (url) => {
  const urlObj = new URL(decodeURIComponent(url), 'http://domain.com') // Base needed for relative URLs
  const pathSegments = urlObj.pathname.split('/').filter(Boolean)

  const [resourceType, identifier] = pathSegments

  /** @type {Query} */
  const result = {
    resourceType,
    identifier: identifier ?? null,
    filter: [],
    sort: [],
    fields: {},
    pagination: {}
  }

  for (const [key, value] of urlObj.searchParams.entries()) {
    if (key === 'filter') {
      result.filter = parseFilter(value)
    } else if (key === 'sort') {
      result.sort = parseSort(value)
    } else if (key.startsWith('fields')) {
      result.fields = { ...result.fields, ...parseFields(key, value) }
    } else if (key === 'limit' || key === 'offset') {
      result.pagination[key] = parseInt(value, 10)
    }
  }

  return result
}

/**
 *
 * @param {string} filterString
 * @returns {FilterGroup|FilterCondition}
 */
const parseFilter = (filterString) => {
  const tokens = tokenize(filterString)

  return parseExpression(tokens)
}

// Tokenizer: Converts the string into a list of tokens
const tokenize = (input) => {
  const tokens = []
  let buffer = ''

  for (const char of input) {
    if (char === '(') {
      if (buffer.trim()) {
        tokens.push(buffer.trim())
        buffer = ''
      }

      tokens.push('(')
    } else if (char === ')') {
      if (buffer.trim()) {
        tokens.push(buffer.trim())
        buffer = ''
      }

      tokens.push(')')
    } else if (char === ';' || char === '|') {
      if (buffer.trim()) {
        tokens.push(buffer.trim())
        buffer = ''
      }

      tokens.push(char === ';' ? 'and' : 'or')
    } else {
      buffer += char
    }
  }

  if (buffer.trim()) {
    tokens.push(buffer.trim())
  }

  return tokens
}

// Parser: Recursively processes tokens into a structured object
/**
 *
 * @param {string[]} tokens
 * @returns {FilterGroup|FilterCondition}
 */
const parseExpression = (tokens) => {
  const stack = []
  const currentGroup = { type: 'group', logical: 'and', conditions: [] }

  while (tokens.length > 0) {
    const token = tokens.shift()

    if (token === '(') {
      // Start a new group
      currentGroup.conditions.push(parseExpression(tokens))
    } else if (token === ')') {
      // End current group
      break
    } else if (token === 'and' || token === 'or') {
      // Update logical operator
      currentGroup.logical = token
    } else {
      // Parse condition
      currentGroup.conditions.push(parseCondition(token))
    }
  }

  if (stack.length > 0) {
    stack.push(currentGroup)

    return { type: 'group', logical: 'and', conditions: stack }
  }

  return currentGroup
}

const parseCondition = (conditionString) => {
  const match = conditionString.match(/^([\w\\.?]+)\[([\w]+)](.+)$/)
  if (!match) {
    throw new Error(`Invalid filter condition: "${conditionString}"`)
  }

  const [, field, operator, value] = match
  return {
    field,
    operator,
    value: parseValue(value)
  }
}

const parseValue = (value) => {
  if (value === 'null') {
    return null
  }

  if (value === 'notnull') {
    return 'notnull'
  }

  if (!Number.isNaN(value)) {
    return Number(value)
  }

  return value
}

const parseSort = (value) => {
  return value.split(',').map(sortParam => {
    const direction = sortParam.startsWith('-') ? 'desc' : 'asc'
    const field = sortParam.replace(/^-/, '')

    return { field, direction }
  })
}

const parseFields = (key, value) => {
  // const resource = key.match(/^fields\[(\w+)]$/)?.[1]
  const [resourceType, fields] = value.split(':')
  const result = {}

  if (resourceType) {
    result[resourceType] = fields.split(',')
  }

  return result
}
