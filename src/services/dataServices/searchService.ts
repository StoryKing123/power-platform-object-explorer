// Search Service for Dynamics 365 Solution Component Summaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG, CATEGORY_COMPONENT_TYPES } from '../api/d365ApiConfig'
import type { ODataResponse, SolutionComponentSummary, Solution } from '../api/d365ApiTypes'

// Module-level cache for default solution ID
let defaultSolutionId: string | null = null
let solutionIdFetchPromise: Promise<string> | null = null
let supportsPrimaryIdAttribute = true

const PRIMARY_ID_ATTRIBUTE_FIELD = 'msdyn_primaryidattribute'

function buildSelectWithPrimaryIdAttribute(select: string): string {
  if (select.split(',').map(s => s.trim()).includes(PRIMARY_ID_ATTRIBUTE_FIELD)) return select
  return `${select},${PRIMARY_ID_ATTRIBUTE_FIELD}`
}

function isPrimaryIdAttributeUnsupported(error: unknown): boolean {
  if (!supportsPrimaryIdAttribute) return false
  if (!error || typeof error !== 'object') return false
  const message = String((error as any).message ?? '')
  const detailsMessage = String((error as any).details?.error?.message ?? '')
  const combined = `${message} ${detailsMessage}`
  return combined.toLowerCase().includes(PRIMARY_ID_ATTRIBUTE_FIELD)
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
  const sanitizedQuery = sanitizeSearchQuery(query)

  // Base filter: solution ID and search terms
  const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
  const solutionFilter = `(msdyn_solutionid eq ${solutionId})`

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
      $select: supportsPrimaryIdAttribute
        ? buildSelectWithPrimaryIdAttribute(D365_API_CONFIG.queries.solutionComponentSearch.$select)
        : D365_API_CONFIG.queries.solutionComponentSearch.$select,
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
    // Re-throw with more context
    console.error('Search failed:', error)
    throw error
  }
}
