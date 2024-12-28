import { parser } from '../src/index.js'

// const queryString = `
//   users/2979368b-790d-4b9a-b031-8d67d35b8359
//   ?filter=age[gte]18;(status[eq]active|role[eq]admin);email[ne]null;author.status[eq]active&
//   sort=created_at:desc,lastname:asc&
//   limit=15&
//   offset=30&
//   fields=users:id,firstname,lastname,email&fields=posts:id,content
// `.replace(/\s+/g, '') // Clean up line breaks for testing

// console.log(JSON.stringify(parser(queryString), null, 2))

// const queryNull = `users/2979368b-790d-4b9a-b031-8d67d35b8359
//   ?filter=email[ne]null`.replace(/\s+/g, '') // Clean up line breaks for testing

// console.log(JSON.stringify(parser(queryNull), null, 2))

// const orderString = `users/2979368b-790d-4b9a-b031-8d67d35b8359
//   ?sort=created_at:desc
//   &sort=lastname:asc`.replace(/\s+/g, '') // Clean up line breaks for testing

// console.log(JSON.stringify(parser(orderString), null, 2))

// const queryNoResourceType = 'users?fields=name,email'

// console.log(JSON.stringify(parser(queryNoResourceType), null, 2))

// const queryPagination = 'users?limit=10&offset=20'

// console.log(JSON.stringify(parser(queryPagination), null, 2))

// const queryInvalidPagination = 'users?limit=abc&offset=xyz'

// console.log(JSON.stringify(parser(queryInvalidPagination), null, 2))

const queryTrailingBuffer = 'users?filter=age[gte]30'

console.log(JSON.stringify(parser(queryTrailingBuffer), null, 2))
