import { parser } from '../src/index.js'

const queryString = `
  users/2979368b-790d-4b9a-b031-8d67d35b8359
  ?filter=age[gte]18;(status[eq]active|role[eq]admin);email[ne]null;author.status[eq]active&
  sort=created_at:desc,lastname:asc&
  limit=15&
  offset=30&
  fields=users:id,firstname,lastname,email&fields=posts:id,content
`.replace(/\s+/g, '') // Clean up line breaks for testing

console.log(JSON.stringify(parser(queryString), null, 2))
