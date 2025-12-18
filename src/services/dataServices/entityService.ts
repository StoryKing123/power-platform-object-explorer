// Entity Service - Fetch entities from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { EntityDefinition, ODataResponse, ODataParams } from '../api/d365ApiTypes'

/**
 * Helper function to get label text from D365 Label object
 */
function getLabelText(label: any): string {
  if (!label) return ''
  if (label.UserLocalizedLabel?.Label) return label.UserLocalizedLabel.Label
  if (label.LocalizedLabels?.[0]?.Label) return label.LocalizedLabels[0].Label
  return ''
}

/**
 * Filter entities client-side (since EntityDefinitions doesn't support $filter)
 */
function filterEntities(entities: EntityDefinition[]): EntityDefinition[] {
  // Filter to only show entities valid for advanced find
  return entities.filter(entity => entity.IsValidForAdvancedFind === true)
}

/**
 * Sort entities client-side by LogicalName
 */
function sortEntities(entities: EntityDefinition[]): EntityDefinition[] {
  return entities.sort((a, b) => {
    const nameA = a.LogicalName?.toLowerCase() || ''
    const nameB = b.LogicalName?.toLowerCase() || ''
    return nameA.localeCompare(nameB)
  })
}

/**
 * Search entities client-side
 */
function searchEntitiesClientSide(entities: EntityDefinition[], query: string): EntityDefinition[] {
  const lowerQuery = query.toLowerCase()
  return entities.filter(entity => {
    const logicalName = entity.LogicalName?.toLowerCase() || ''
    const displayName = getLabelText(entity.DisplayName)?.toLowerCase() || ''
    const description = getLabelText(entity.Description)?.toLowerCase() || ''

    return logicalName.includes(lowerQuery) ||
           displayName.includes(lowerQuery) ||
           description.includes(lowerQuery)
  })
}

/**
 * Paginate entities client-side
 */
function paginateEntities(
  entities: EntityDefinition[],
  pageSize: number,
  skip: number = 0
): { value: EntityDefinition[], hasMore: boolean } {
  const start = skip
  const end = start + pageSize
  const paginatedEntities = entities.slice(start, end)
  const hasMore = end < entities.length

  return {
    value: paginatedEntities,
    hasMore
  }
}

/**
 * Fetch all entities from D365 (without filtering/sorting)
 * EntityDefinitions doesn't support $filter, $orderby, or $count
 */
async function fetchAllEntitiesRaw(): Promise<EntityDefinition[]> {
  const allEntities: EntityDefinition[] = []

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.entities.$select,
  }

  // Fetch first page
  let response = await d365ApiClient.getCollection<EntityDefinition>(
    D365_API_CONFIG.endpoints.entities,
    params
  )

  allEntities.push(...response.value)
  let nextLink = response['@odata.nextLink']

  // Fetch remaining pages
  while (nextLink) {
    response = await d365ApiClient.getNextPage<EntityDefinition>(nextLink)
    allEntities.push(...response.value)
    nextLink = response['@odata.nextLink']
  }

  return allEntities
}

/**
 * Fetch entities with pagination (client-side filtering and sorting)
 */
export async function fetchEntities(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<EntityDefinition>> {
  // Fetch all entities
  const allEntities = await fetchAllEntitiesRaw()

  // Filter and sort client-side
  const filtered = filterEntities(allEntities)
  const sorted = sortEntities(filtered)

  // Paginate
  const paginated = paginateEntities(sorted, pageSize, skip || 0)

  return {
    value: paginated.value,
    '@odata.count': sorted.length,
    '@odata.nextLink': paginated.hasMore ? 'has-more' : undefined
  }
}

/**
 * Fetch entity by logical name
 */
export async function fetchEntityByLogicalName(
  logicalName: string
): Promise<EntityDefinition> {
  // Fetch all entities and find the one we need
  const allEntities = await fetchAllEntitiesRaw()
  const entity = allEntities.find(e => e.LogicalName === logicalName)

  if (!entity) {
    throw {
      type: 'notfound',
      message: `Entity with logical name '${logicalName}' not found`,
      retryable: false,
    }
  }

  return entity
}

/**
 * Search entities by query string (client-side search)
 */
export async function searchEntities(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<EntityDefinition>> {
  // Fetch all entities
  const allEntities = await fetchAllEntitiesRaw()

  // Filter, search, and sort client-side
  const filtered = filterEntities(allEntities)
  const searched = searchEntitiesClientSide(filtered, query)
  const sorted = sortEntities(searched)

  // Paginate
  const paginated = paginateEntities(sorted, pageSize, skip || 0)

  return {
    value: paginated.value,
    '@odata.count': sorted.length,
    '@odata.nextLink': paginated.hasMore ? 'has-more' : undefined
  }
}

/**
 * Fetch all entities (handles pagination automatically)
 */
export async function fetchAllEntities(): Promise<EntityDefinition[]> {
  const allEntities = await fetchAllEntitiesRaw()
  const filtered = filterEntities(allEntities)
  return sortEntities(filtered)
}

/**
 * Get entity count
 */
export async function getEntityCount(): Promise<number> {
  const allEntities = await fetchAllEntitiesRaw()
  const filtered = filterEntities(allEntities)
  return filtered.length
}
