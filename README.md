# ReQuery Specification

ReQuery is a query syntax for REST APIs that provides a powerful and expressive way to structure filters, sorts, field selections, pagination, and identifier extraction directly from the URL. It balances flexibility, readability, and compatibility with standard URL practices.

## Table of Contents

1. Overview
2. Structure
3. Components
    * Identifiers
    * Resource Type
    * Filters
    * Sorting
    * Field Selection
    * Pagination
4. Operators
5. Examples
    * Simple Cases
    * Complex Cases
    * Edge Cases

- - -

## 1. Overview

ReQuery enables developers to build rich and precise REST API queries directly within the URL. This specification defines the syntax and semantics for all components of a ReQuery-compliant URL.
<br>
### General URL Format

```
{resourceType}/{identifier}?{queryParameters}
```

Example:

```
users/2979368b-790d-4b9a-b031-8d67d35b8359
?filter=age[gte]18;(status[eq]active|role[eq]admin);email[ne]null;posts.status[eq]active&
sort=created_at:desc,lastname:asc&
limit=15&
offset=30&
fields=users:id,firstname,lastname,email&fields=posts:id,content
```

- - -

## 2. Structure

A ReQuery-compliant URL is parsed into the following structure:

```json
{
  "resourceType": "<resource>",
  "identifier": "<id>",
  "filter": { ... },
  "sort": [ ... ],
  "fields": { ... },
  "pagination": { ... }
}
```

Each component is described in detail below.

- - -

## 3. Components

### 3.1 Resource Type

The `resourceType` identifies the collection or entity type being queried, such as `users`, `posts`, or `orders`. It must be a valid string representing the resource.

#### Examples:

* `users`
* `posts`
* `orders`

- - -

### 3.2. Identifiers

The `identifier` specifies the primary key of the resource being queried. It appears directly after the resource type in the URL.

#### Examples:

* `users/2979368b-790d-4b9a-b031-8d67d35b8359`
* `posts/12345`

- - -

### 3.3. Filters

Filters allow for granular control over query results by specifying conditions on resource fields, including nested fields.

#### Syntax

```
filter=<field>[<operator>]<value>[;<field>[<operator>]<value>...]
```

Filters can be grouped with logical operators:

* `and` (default, indicated by `;` between conditions)
* `or` (indicated by `|` between conditions)

#### Nested Fields

Filters support nested fields using dot notation. This allows filtering on related entities or embedded objects.

##### Example

Filter query:

```
filter=posts.status[eq]active
```

Parsed:

```json
{
  "type": "group",
  "logical": "and",
  "conditions": [
    {
      "field": "posts.status",
      "operator": "eq",
      "value": "active"
    }
  ]
}
```

#### Complex Example

Filter query:

```
filter=age[gte]18;(status[eq]active|role[eq]admin);email[ne]null;posts.status[eq]active
```

Parsed:

```json
{
  "type": "group",
  "logical": "and",
  "conditions": [
    {
      "field": "age",
      "operator": "gte",
      "value": 18
    },
    {
      "type": "group",
      "logical": "or",
      "conditions": [
        { "field": "status", "operator": "eq", "value": "active" },
        { "field": "role", "operator": "eq", "value": "admin" }
      ]
    },
    { "field": "email", "operator": "ne", "value": "null" },
    { "field": "posts.status", "operator": "eq", "value": "active" }
  ]
}
```

- - -

### 3.4. Sorting

Sorting defines the order of the results using the `sort` parameter.

#### Syntax

```
sort=<field>:<direction>[,<field>:<direction>...]
```

* `<direction>`: `asc` (ascending) or `desc` (descending)

#### Example

Sorting query:

```
sort=created_at:desc,lastname:asc
```

Parsed:

```json
[
  { "field": "created_at", "direction": "desc" },
  { "field": "lastname", "direction": "asc" }
]
```

- - -

### 3.5. Field Selection

Field selection limits the fields included in the response.

#### Syntax

```
fields=<resource>:<field1>,<field2>,...&fields=<resource>:<field1>,<field2>,...
```

#### Example

Field selection query:

```
fields=users:id,firstname,lastname,email&fields=posts:id,content
```

Parsed:

```json
{
  "users": ["id", "firstname", "lastname", "email"],
  "posts": ["id", "content"]
}
```

- - -

### 3.6. Pagination

Pagination controls the number of results and the offset for retrieving data.

#### Syntax

```
limit=<number>&offset=<number>
```

#### Example

Pagination query:

```
limit=15&offset=30
```

Parsed:

```json
{
  "limit": 15,
  "offset": 30
}
```

- - -

## 4. Operators

ReQuery supports the following operators:

|  |  |  |
| --- | --- | --- |
| Operator | Description | Example |
| `eq` | Equals | `age[eq]18` |
| `ne` | Not equals | `status[ne]active` |
| `gt` | Greater than | `age[gt]18` |
| `lt` | Less than | `age[lt]18` |
| `gte` | Greater than or equal | `age[gte]18` |
| `lte` | Less than or equal | `age[lte]18` |
| `like` | Matches a pattern | `name[like]john%` |

- - -

## 5. Examples

### Simple Cases

**Filter by single condition:**

```
filter=age[gte]18
```

Parsed:

```json
{
  "field": "age",
  "operator": "gte",
  "value": 18
}
```

**Sort by single field:**

```
sort=created_at:desc
```

Parsed:

```json
[
  { "field": "created_at", "direction": "desc" }
]
```

- - -

### Complex Cases

**Nested filters with logical operators:**

```
filter=(status[eq]active|role[eq]admin);email[ne]null
```

Parsed:

```json
{
  "type": "group",
  "logical": "and",
  "conditions": [
    {
      "type": "group",
      "logical": "or",
      "conditions": [
        { "field": "status", "operator": "eq", "value": "active" },
        { "field": "role", "operator": "eq", "value": "admin" }
      ]
    },
    { "field": "email", "operator": "ne", "value": "null" }
  ]
}
```

- - -

### Edge Cases

**Empty or missing values:**

* `filter=email[ne]`: Interpreted as "field exists but is empty.
