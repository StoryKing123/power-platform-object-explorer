// OData Query Builder Utilities

import type { ODataParams } from '@/services/api/d365ApiTypes'

/**
 * Build $select parameter from array of fields
 */
export function buildSelect(fields: string[]): string {
  return fields.join(',')
}

/**
 * Filter condition interface
 */
export interface FilterCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le' | 'contains' | 'startswith' | 'endswith'
  value: string | number | boolean
}

/**
 * Build $filter parameter from array of conditions
 */
export function buildFilter(conditions: FilterCondition[]): string {
  return conditions
    .map(condition => {
      const { field, operator, value } = condition

      // Handle different operators
      if (operator === 'contains' || operator === 'startswith' || operator === 'endswith') {
        return `${operator}(${field},'${value}')`
      }

      // Handle string values (need quotes)
      if (typeof value === 'string') {
        return `${field} ${operator} '${value}'`
      }

      // Handle boolean and number values (no quotes)
      return `${field} ${operator} ${value}`
    })
    .join(' and ')
}

/**
 * Build $orderby parameter
 */
export function buildOrderBy(field: string, direction: 'asc' | 'desc' = 'asc'): string {
  return `${field} ${direction}`
}

/**
 * Build pagination parameters
 */
export function buildPagination(pageSize: number, skip?: number): Partial<ODataParams> {
  const params: Partial<ODataParams> = {
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return params
}

/**
 * Build search filter for multiple fields
 * Creates an OR condition across all specified fields
 */
export function buildSearchFilter(query: string, fields: string[]): string {
  if (!query || fields.length === 0) {
    return ''
  }

  const lowerQuery = query.toLowerCase()

  // Build OR conditions for each field
  const conditions = fields.map(field => {
    // For nested properties like DisplayName/UserLocalizedLabel/Label
    if (field.includes('/')) {
      return `contains(tolower(${field}),'${lowerQuery}')`
    }
    // For simple properties
    return `contains(tolower(${field}),'${lowerQuery}')`
  })

  return conditions.join(' or ')
}

/**
 * Combine multiple filter expressions with AND
 */
export function combineFilters(...filters: (string | undefined)[]): string {
  const validFilters = filters.filter(f => f && f.trim().length > 0)

  if (validFilters.length === 0) {
    return ''
  }

  if (validFilters.length === 1) {
    return validFilters[0]
  }

  return validFilters.map(f => `(${f})`).join(' and ')
}

/**
 * Build complete OData params object
 */
export function buildODataParams(options: {
  select?: string[]
  filter?: string
  orderBy?: { field: string; direction?: 'asc' | 'desc' }
  pageSize?: number
  skip?: number
  expand?: string
  count?: boolean
}): ODataParams {
  const params: ODataParams = {}

  if (options.select && options.select.length > 0) {
    params.$select = buildSelect(options.select)
  }

  if (options.filter) {
    params.$filter = options.filter
  }

  if (options.orderBy) {
    params.$orderby = buildOrderBy(options.orderBy.field, options.orderBy.direction)
  }

  if (options.pageSize) {
    params.$top = options.pageSize
  }

  if (options.skip !== undefined && options.skip > 0) {
    params.$skip = options.skip
  }

  if (options.expand) {
    params.$expand = options.expand
  }

  if (options.count) {
    params.$count = true
  }

  return params
}

/**
 * Parse OData nextLink to extract skip value
 */
export function parseNextLink(nextLink: string): { skip: number } | null {
  try {
    const url = new URL(nextLink)
    const skipParam = url.searchParams.get('$skip')

    if (skipParam) {
      return { skip: parseInt(skipParam, 10) }
    }
  } catch {
    // Invalid URL
  }

  return null
}

/**
 * Build entity-specific search filter
 * Searches across LogicalName and DisplayName
 */
export function buildEntitySearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(LogicalName),'${lowerQuery}') or contains(tolower(DisplayName/UserLocalizedLabel/Label),'${lowerQuery}'))`
}

/**
 * Build form search filter
 * Searches across name and description
 */
export function buildFormSearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(name),'${lowerQuery}') or contains(tolower(description),'${lowerQuery}'))`
}

/**
 * Build view search filter
 * Searches across name and description
 */
export function buildViewSearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(name),'${lowerQuery}') or contains(tolower(description),'${lowerQuery}'))`
}

/**
 * Build workflow search filter
 * Searches across name and description
 */
export function buildWorkflowSearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(name),'${lowerQuery}') or contains(tolower(description),'${lowerQuery}'))`
}

/**
 * Build plugin search filter
 * Searches across name and description
 */
export function buildPluginSearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(name),'${lowerQuery}') or contains(tolower(description),'${lowerQuery}'))`
}

/**
 * Build web resource search filter
 * Searches across name, displayname, and description
 */
export function buildWebResourceSearchFilter(query: string): string {
  if (!query) return ''

  const lowerQuery = query.toLowerCase()

  return `(contains(tolower(name),'${lowerQuery}') or contains(tolower(displayname),'${lowerQuery}') or contains(tolower(description),'${lowerQuery}'))`
}
