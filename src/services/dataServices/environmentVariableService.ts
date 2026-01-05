// Environment Variable Service - Fetch environment variables from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'

/**
 * 构建 Environment Variable 的 filter 条件
 * componenttype=380 表示 Environment Variable Definition
 * componenttype=381 表示 Environment Variable Value
 */
function buildEnvironmentVariableFilter(solutionId: string, searchQuery?: string): string {
  const environmentVariableTypeFilter = '(msdyn_componenttype eq 380 or msdyn_componenttype eq 381)'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${environmentVariableTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch environment variables with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchEnvironmentVariables(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildEnvironmentVariableFilter(solutionId),
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
 * Search environment variables by query string using msdyn_solutioncomponentsummaries
 */
export async function searchEnvironmentVariables(
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
    $filter: buildEnvironmentVariableFilter(solutionId, query),
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  try {
    return await d365ApiClient.getCollection<SolutionComponentSummary>(
      D365_API_CONFIG.endpoints.solutionComponentSummaries,
      params,
      'v9.0'
    )
  } catch (error) {
    if (handleWorkflowIdUniqueUnsupported(error)) {
      return await searchEnvironmentVariables(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get environment variable count from msdyn_solutioncomponentcountsummaries
 */
export async function getEnvironmentVariableCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and (msdyn_componenttype eq 380 or msdyn_componenttype eq 381)`,
      },
      'v9.0'
    )

    // 获取 componenttype=380 (Definition) 和 381 (Value) 的总数量
    const total = response.value?.reduce((sum: number, row: any) => {
      if (row.msdyn_componenttype === 380 || row.msdyn_componenttype === 381) {
        return sum + (row.msdyn_total || 0)
      }
      return sum
    }, 0)

    return total || 0
  } catch (error) {
    console.warn('Failed to get environment variable count:', error)
    return 0
  }
}
