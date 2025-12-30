// App Service - Fetch apps from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 App 的 filter 条件
 * 包括 Canvas App (componenttype=300, subtype=0或4) 和 Model-driven App (componenttype=80)
 */
function buildAppFilter(solutionId: string, searchQuery?: string): string {
  // Canvas App: componenttype=300 且 subtype=0(Classic) 或 4(Modern)
  // Model-driven App: componenttype=80
  const appTypeFilter = '((msdyn_componenttype eq 300 and (msdyn_subtype eq \'0\' or msdyn_subtype eq \'4\')) or (msdyn_componenttype eq 80))'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${appTypeFilter} and ${searchFilter}`
  }

  return appTypeFilter
}

/**
 * Fetch apps with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchApps(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildAppFilter(solutionId),
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.1'
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

  const params: ODataParams = {
    $filter: buildAppFilter(solutionId, query),
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.1'
  )
}

/**
 * Get app count from msdyn_solutioncomponentcountsummaries
 * 统计 Canvas App 和 Model-driven App 的总数
 */
export async function getAppCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total,msdyn_subtype',
        $filter: `msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    // 计算 Canvas App (componenttype=300) 和 Model-driven App (componenttype=80) 的数量
    let count = 0
    for (const row of response.value || []) {
      if (row.msdyn_componenttype === 300 || row.msdyn_componenttype === 80) {
        count += typeof row.msdyn_total === 'number' ? row.msdyn_total : 0
      }
    }

    return count
  } catch (error) {
    console.warn('Failed to get app count:', error)
    return 0
  }
}
