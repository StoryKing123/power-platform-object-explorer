// Search Service for Dynamics 365 Solution Component Summaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG, CATEGORY_COMPONENT_TYPES } from '../api/d365ApiConfig'
import type { ODataResponse, SolutionComponentSummary, Solution } from '../api/d365ApiTypes'

// Module-level cache for default solution ID
let defaultSolutionId: string | null = null
let solutionIdFetchPromise: Promise<string> | null = null
let supportsPrimaryIdAttribute = true
let supportsWorkflowIdUnique = true

const PRIMARY_ID_ATTRIBUTE_FIELD = 'msdyn_primaryidattribute'
const WORKFLOW_ID_UNIQUE_FIELD = 'msdyn_workflowidunique'
const GUID_REGEX = /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/

function buildSelectWithField(select: string, field: string): string {
  if (select.split(',').map(s => s.trim()).includes(field)) return select
  return `${select},${field}`
}

function getCombinedErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const message = String((error as any).message ?? '')
  const detailsMessage = String((error as any).details?.error?.message ?? '')
  return `${message} ${detailsMessage}`.trim()
}

function isDictionaryKeyError(error: unknown): boolean {
  const combined = getCombinedErrorMessage(error).toLowerCase()
  return combined.includes('given key was not present in the dictionary')
}

function isOptionalFieldUnsupported(error: unknown, field: string): boolean {
  const combined = getCombinedErrorMessage(error).toLowerCase()
  return combined.includes(field.toLowerCase()) || isDictionaryKeyError(error)
}

function isPrimaryIdAttributeUnsupported(error: unknown): boolean {
  if (!supportsPrimaryIdAttribute) return false
  if (!error || typeof error !== 'object') return false
  return isOptionalFieldUnsupported(error, PRIMARY_ID_ATTRIBUTE_FIELD)
}

function isWorkflowIdUniqueUnsupported(error: unknown): boolean {
  if (!supportsWorkflowIdUnique) return false
  if (!error || typeof error !== 'object') return false
  return isOptionalFieldUnsupported(error, WORKFLOW_ID_UNIQUE_FIELD)
}

/**
 * Sanitize search query for OData filter
 * Escapes special characters that could break OData queries
 */
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/'/g, "''")      // Escape single quotes for OData
    .replace(/\\/g, '\\\\')   // Escape backslashes
    .trim()
}

function normalizeGuidForOData(value: string): string | null {
  const trimmed = value.trim()
  if (!GUID_REGEX.test(trimmed)) return null
  return trimmed.replace(/^\{|\}$/g, '').toLowerCase()
}

function buildSolutionComponentSearchSelect(): string {
  let select = D365_API_CONFIG.queries.solutionComponentSearch.$select
  if (supportsWorkflowIdUnique) {
    select = buildSelectWithField(select, WORKFLOW_ID_UNIQUE_FIELD)
  }
  if (supportsPrimaryIdAttribute) {
    select = buildSelectWithField(select, PRIMARY_ID_ATTRIBUTE_FIELD)
  }
  return select
}

export function buildSolutionComponentSummarySearchClause(query: string): string {
  const sanitizedQuery = sanitizeSearchQuery(query)
  if (!sanitizedQuery) return ''

  const guid = normalizeGuidForOData(sanitizedQuery)
  if (!guid) {
    return `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
  }

  const idFilters = [`msdyn_objectid eq ${guid}`]
  if (supportsWorkflowIdUnique) {
    idFilters.push(`msdyn_workflowidunique eq ${guid}`)
  }
  return `(${idFilters.join(' or ')})`
}

/**
 * Get default solution ID with caching and deduplication
 * Fetches the default solution ID once and caches it for subsequent calls
 */
async function fetchDefaultSolutionIdInternal(): Promise<string> {
  // Return cached value if available
  if (defaultSolutionId) {
    return defaultSolutionId
  }

  // Deduplicate concurrent requests
  if (solutionIdFetchPromise) {
    return solutionIdFetchPromise
  }

  // Fetch and cache
  solutionIdFetchPromise = (async () => {
    try {
      const response = await d365ApiClient.getCollection<Solution>(
        D365_API_CONFIG.endpoints.solutions,
        D365_API_CONFIG.queries.defaultSolution,
        'v9.0' // Use v9.0 for search-related APIs
      )

      if (!response.value || response.value.length === 0) {
        throw new Error('Default solution not found')
      }

      const solution = response.value[0]
      if (!solution?.solutionid) {
        throw new Error('Default solution ID is missing')
      }

      defaultSolutionId = solution.solutionid
      return defaultSolutionId
    } finally {
      solutionIdFetchPromise = null
    }
  })()

  return solutionIdFetchPromise
}

/**
 * Clear the cached default solution ID
 * Useful for testing or when solution configuration changes
 */
export function clearDefaultSolutionCache(): void {
  defaultSolutionId = null
  solutionIdFetchPromise = null
}

/**
 * Get default solution ID (exported for reuse)
 * Uses the same caching/deduplication logic as search.
 */
export async function getDefaultSolutionId(): Promise<string> {
  return await fetchDefaultSolutionIdInternal()
}

/**
 * Build OData filter for component search
 * Constructs filter with solution ID, search query, and optional component types
 */
function buildSearchFilter(
  solutionId: string,
  query: string,
  componentTypes?: number[]
): string {
  const solutionFilter = `(msdyn_solutionid eq ${solutionId})`
  const searchFilter = buildSolutionComponentSummarySearchClause(query)

  // Add component type filter if specified
  if (componentTypes && componentTypes.length > 0) {
    const typeFilter = componentTypes.length === 1
      ? `(msdyn_componenttype eq ${componentTypes[0]})`
      : `(${componentTypes.map(t => `msdyn_componenttype eq ${t}`).join(' or ')})`

    return `${solutionFilter} and ${typeFilter} and ${searchFilter}`
  }

  return `${solutionFilter} and ${searchFilter}`
}

/**
 * Search components using msdyn_solutioncomponentsummaries entity
 *
 * @param query - Search query string
 * @param category - Component category (e.g., 'entities', 'forms', 'all')
 * @param pageSize - Number of results per page (default: 50)
 * @param skip - Number of results to skip for pagination (default: 0)
 * @returns OData response with solution component summaries
 */
export async function searchComponents(
  query: string,
  category: string = 'all',
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip: number = 0
): Promise<ODataResponse<SolutionComponentSummary>> {
  // Validate query
  if (!query || query.trim().length < 2) {
    return {
      value: [],
      '@odata.count': 0,
    }
  }

  try {
    // Get default solution ID (cached after first call)
    const solutionId = await fetchDefaultSolutionIdInternal()

    // Get component types for the category
    const componentTypes = category === 'all' ? undefined : CATEGORY_COMPONENT_TYPES[category]

    // Build filter
    const filter = buildSearchFilter(solutionId, query, componentTypes)

    // Build query parameters
    // Note: msdyn_solutioncomponentsummaries does not support $skip
    const params = {
      ...D365_API_CONFIG.queries.solutionComponentSearch,
      $select: buildSolutionComponentSearchSelect(),
      $filter: filter,
      $top: pageSize,
    }

    // Execute search using v9.0 API
    const response = await d365ApiClient.getCollection<SolutionComponentSummary>(
      D365_API_CONFIG.endpoints.solutionComponentSummaries,
      params,
      'v9.0' // Use v9.0 for search
    )

    return response
  } catch (error) {
    if (isPrimaryIdAttributeUnsupported(error)) {
      supportsPrimaryIdAttribute = false
      return await searchComponents(query, category, pageSize, skip)
    }
    if (isWorkflowIdUniqueUnsupported(error)) {
      supportsWorkflowIdUnique = false
      return await searchComponents(query, category, pageSize, skip)
    }
    // Re-throw with more context
    console.error('Search failed:', error)
    throw error
  }
}

export function handleWorkflowIdUniqueUnsupported(error: unknown): boolean {
  if (!isWorkflowIdUniqueUnsupported(error)) return false
  supportsWorkflowIdUnique = false
  return true
}
