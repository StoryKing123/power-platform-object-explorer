// Environment Variable Service - Fetch environment variables from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Environment Variable 的 filter 条件
 * componenttype=380 表示 Environment Variable Definition
 * componenttype=381 表示 Environment Variable Value
 */
async function buildEnvironmentVariableFilter(searchQuery?: string): Promise<string> {
  const environmentVariableTypeFilter = await getCategoryTypeFilter('environmentvariables', [380, 381])
  const solutionId = await getDefaultSolutionId()
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
  const filter = await buildEnvironmentVariableFilter()

  const params: ODataParams = {
    $filter: filter,
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

  const filter = await buildEnvironmentVariableFilter(query)

  const params: ODataParams = {
    $filter: filter,
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
    const typeFilter = await getCategoryTypeFilter('environmentvariables', [380, 381])
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `${typeFilter} and msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    // 获取 Environment Variable 相关组件的总数量
    const total = response.value?.reduce((sum: number, row: any) => {
      return sum + (typeof row.msdyn_total === 'number' ? row.msdyn_total : 0)
    }, 0)

    return total || 0
  } catch (error) {
    console.warn('Failed to get environment variable count:', error)
    return 0
  }
}
