// App Service - Fetch apps from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 App 的 filter 条件，只保留 componenttype 过滤
 */
async function buildAppFilter(solutionId: string, searchQuery?: string): Promise<string> {
  const appTypeFilter = await getCategoryTypeFilter('apps', [300, 80])
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${appTypeFilter} and ${solutionFilter} and ${searchFilter}`
  }

  return `${appTypeFilter} and ${solutionFilter}`
}

/**
 * Fetch apps with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchApps(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()
  const filter = await buildAppFilter(solutionId)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.1',
    { maxPageSize: pageSize }
  )
}

/**
 * Search apps by query string using msdyn_solutioncomponentsummaries
 */
export async function searchApps(
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
  const filter = await buildAppFilter(solutionId, query)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.1',
    { maxPageSize: pageSize }
  )
}

/**
 * Get app count from msdyn_solutioncomponentcountsummaries
 * 统计 Canvas App 和 Model-driven App 的总数
 */
export async function getAppCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('apps', [300, 80])
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total,msdyn_subtype',
        $filter: `${typeFilter} and msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    return (response.value || []).reduce((sum: number, row: any) => {
      return sum + (typeof row.msdyn_total === 'number' ? row.msdyn_total : 0)
    }, 0)
  } catch (error) {
    console.warn('Failed to get app count:', error)
    return 0
  }
}
