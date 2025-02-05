import { isNumeric } from './utils/isNumeric.js'

/**
 * Parses a URL into a structured query representation.
 *
 * @param {string} url - The URL string to parse.
 * @returns {Query} - The parsed query structure.
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
      result.sort = [...result.sort, ...parseSort(value)]
    } else if (key.startsWith('fields')) {
      result.fields = { ...result.fields, ...parseFields(key, value) }
    } else if (key === 'limit' || key === 'offset') {
      if (!isNumeric(value)) {
        throw new TypeError(`Invalid pagination field '${key}'. The value must be an integer.`)
      }

      result.pagination[key] = parseInt(value, 10)
    }
  }

  return result
}

/**
 * Parses a filter string into a structured representation.
 *
 * @param {string} filterString - The filter string to parse.
 * @returns {FilterGroup} - The parsed filter group.
 */
const parseFilter = (filterString) => {
  const tokens = tokenize(filterString)

  return parseExpression(tokens)
}

/**
 * Tokenizes a filter string.
 *
 * @param {string} input - The filter string to tokenize.
 * @returns {string[]} - The list of tokens.
 */
// const tokenize = (input) => {
//   const tokens = []
//   let buffer = ''

//   for (const char of input) {
//     if (char === '(') {
//       if (buffer.trim()) {
//         tokens.push(buffer.trim())
//         buffer = ''
//       }
//       tokens.push('(')
//     } else if (char === ')') {
//       if (buffer.trim()) {
//         tokens.push(buffer.trim())
//         buffer = ''
//       }
//       tokens.push(')')
//     } else if (char === ';' || char === '|') {
//       if (buffer.trim()) {
//         tokens.push(buffer.trim())
//         buffer = ''
//       }
//       tokens.push(char === ';' ? 'and' : 'or')
//     } else {
//       buffer += char
//     }
//   }

//   if (buffer.trim()) {
//     tokens.push(buffer.trim())
//   }

//   return tokens
// }
const tokenize = (input) => {
  const tokens = []
  let buffer = ''

  for (const char of input) {
    if (char === '(') {
      if (buffer.trim()) {
        if (!/;$/.test(buffer.trim())) {
          throw new TypeError('Invalid syntax: missing delimiter before "("')
        }
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

/**
 * Parses tokens into a filter expression.
 *
 * @param {string[]} tokens - The list of tokens.
 * @returns {FilterGroup} - The parsed filter group.
 */
// const parseExpression = (tokens) => {
//   /** @type {FilterGroup} */
//   const currentGroup = { type: 'group', logical: 'and', conditions: [] }

//   while (tokens.length > 0) {
//     const token = tokens.shift()

//     if (token === '(') {
//       currentGroup.conditions.push(parseExpression(tokens))
//     } else if (token === ')') {
//       break
//     } else if (token === 'and' || token === 'or') {
//       currentGroup.logical = token
//     } else {
//       currentGroup.conditions.push(parseCondition(token))
//     }
//   }

//   return currentGroup
// }
const parseExpression = (tokens) => {
  const currentGroup = { type: 'group', logical: 'and', conditions: [] }

  while (tokens.length > 0) {
    const token = tokens.shift()

    if (token === '(') {
      currentGroup.conditions.push(parseExpression(tokens))
    } else if (token === ')') {
      break
    } else if (token === 'and' || token === 'or') {
      currentGroup.logical = token
    } else {
      currentGroup.conditions.push(parseCondition(token))
    }
  }

  // ✅ Always return a group, even for a single condition
  return currentGroup
}

/**
 * Parses a filter condition string.
 *
 * @param {string} conditionString - The condition string to parse.
 * @returns {FilterCondition} - The parsed filter condition.
 */
const parseCondition = (conditionString = '') => {
  const match = conditionString.match(/^([\w\\.?]+)\[([\w]+)](.+)$/)

  if (!match) {
    throw new TypeError(`Invalid filter condition: "${conditionString}"`)
  }

  const [, field, operator, value] = match

  return {
    field,
    operator,
    value: parseValue(value)
  }
}

/**
 * Parses a value string into its appropriate type.
 *
 * @param {string} value - The value string to parse.
 * @returns {string|number|null} - The parsed value.
 */
const parseValue = (value) => {
  if (value === 'null') {
    return null
  }

  if (isNumeric(value)) {
    return Number(value)
  }

  return value
}

/**
 * Parses a sort parameter string into a list of sorting instructions.
 *
 * @param {string} value - The sort parameter string to parse.
 * @returns {Sort[]} - The list of sorting instructions.
 */
const parseSort = (value) => {
  return value.split(',').map((sortParam) => {
    const [field, direction] = sortParam.split(':')

    if (!field) {
      throw new TypeError('Missing order field')
    }

    if (!direction) {
      return { field, direction: 'asc' }
    }

    if (direction !== 'asc' && direction !== 'desc') {
      throw new TypeError(`Invalid sorting direction: '${direction}'. Expected 'asc' or 'desc'.`)
    }

    return { field, direction }
  })
}

/**
 * Parses field selection parameters.
 *
 * @param {string} key - The parameter key.
 * @param {string} value - The parameter value.
 * @returns {Fields} - The parsed fields.
 */
const parseFields = (key, value) => {
  const [resourceType, fields] = value.split(':')
  /** @type {Record<string, string[]>} */
  const result = {}

  if (!resourceType || !fields) {
    throw new TypeError('Invalid fields selection. Try \'resource:fields1,field2[,fieldn]\'')
  }

  result[resourceType] = fields.split(',')

  return result
}

/**
 * @typedef {Object} Query
 * @property {string} resourceType - The resource type from the URL path.
 * @property {string|null} identifier - The identifier from the URL path.
 * @property {FilterGroup|[]} filter - The parsed filter conditions or an empty array.
 * @property {Sort[]} sort - The list of sorting instructions.
 * @property {Fields} fields - The selected fields for each resource type.
 * @property {Pagination} pagination - The pagination information.
 */

/**
 * @typedef {Object} FilterGroup
 * @property {'group'} type - The type of the filter group.
 * @property {'and'|'or'} logical - The logical operator of the group.
 * @property {(FilterCondition|FilterGroup)[]} conditions - The conditions in the group.
 */

/**
 * @typedef {Object} FilterCondition
 * @property {string} field - The field being filtered.
 * @property {string} operator - The comparison operator.
 * @property {string|number|null} value - The value being compared.
 */

/**
 * @typedef {Object} Sort
 * @property {string} field - The field to sort by.
 * @property {'asc'|'desc'} direction - The direction to sort.
 */

/**
 * @typedef {Object.<string, string[]>} Fields
 */

/**
 * @typedef {Object} Pagination
 * @property {number} [limit] - The maximum number of items per page.
 * @property {number} [offset] - The number of items to skip.
 */
