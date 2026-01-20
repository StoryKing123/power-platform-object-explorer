// Entity Service - Fetch entities from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Entity 的 filter 条件
 * componenttype=1 表示 Entity
 */
async function buildEntityFilter(solutionId: string, searchQuery?: string): Promise<string> {
  const entityTypeFilter = await getCategoryTypeFilter('entities', [1])
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${entityTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch entities with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchEntities(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()
  const filter = await buildEntityFilter(solutionId)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0',
    { maxPageSize: pageSize }
  )
}

/**
 * Search entities by query string using msdyn_solutioncomponentsummaries
 */
export async function searchEntities(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  if (!query || query.trim().length < 2) {
    return {
      value: [],
      '@odata.count': 0,
    }
  }

  const solutionId = await getDefaultSolutionId()
  const filter = await buildEntityFilter(solutionId, query)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0',
    { maxPageSize: pageSize }
  )
}

/**
 * Get entity count from msdyn_solutioncomponentcountsummaries
 */
export async function getEntityCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('entities', [1])
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `${typeFilter} and msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    let count = 0
    for (const row of response.value || []) {
      count += typeof row.msdyn_total === 'number' ? row.msdyn_total : 0
    }
    return count
  } catch (error) {
    console.warn('Failed to get entity count:', error)
    return 0
  }
}
