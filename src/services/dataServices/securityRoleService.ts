// Security Role Service - Fetch security roles from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 SecurityRole 的 filter 条件
 * componenttype=20 表示 Role
 */
async function buildSecurityRoleFilter(solutionId: string, searchQuery?: string): Promise<string> {
  const roleTypeFilter = await getCategoryTypeFilter('securityroles', [20])
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${roleTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch security roles with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchSecurityRoles(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()
  const filter = await buildSecurityRoleFilter(solutionId)

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
 * Search security roles by query string using msdyn_solutioncomponentsummaries
 */
export async function searchSecurityRoles(
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
  const filter = await buildSecurityRoleFilter(solutionId, query)

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
 * Get security role count from msdyn_solutioncomponentcountsummaries
 */
export async function getSecurityRoleCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('securityroles', [20])
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
    console.warn('Failed to get security role count:', error)
    return 0
  }
}
