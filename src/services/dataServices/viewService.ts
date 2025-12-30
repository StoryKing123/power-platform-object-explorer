// View Service - Fetch views from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 View 的 filter 条件
 * componenttype=26 表示 View (SavedQuery)
 */
function buildViewFilter(solutionId: string, searchQuery?: string): string {
  const viewTypeFilter = 'msdyn_componenttype eq 26'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${viewTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch all views with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchAllViews(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildViewFilter(solutionId),
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0'
  )
}

/**
 * Search system views by query string using msdyn_solutioncomponentsummaries
 */
export async function searchSystemViews(
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

  const params: ODataParams = {
    $filter: buildViewFilter(solutionId, query),
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0'
  )
}

/**
 * Search personal views (return empty as personal views are not in solution)
 */
export async function searchPersonalViews(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  return {
    value: [],
    '@odata.count': 0,
  }
}

/**
 * Get view count from msdyn_solutioncomponentcountsummaries
 */
export async function getViewCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 26`,
      },
      'v9.0'
    )

    const viewRow = response.value?.find((row: any) => row.msdyn_componenttype === 26)
    return viewRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get view count:', error)
    return 0
  }
}
