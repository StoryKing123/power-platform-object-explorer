// Connection Reference Service - Fetch connection references from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'

/**
 * 构建 Connection Reference 的 filter 条件
 * componenttype=10150 表示 Connection Reference
 */
function buildConnectionReferenceFilter(solutionId: string, searchQuery?: string): string {
  const connectionReferenceTypeFilter = 'msdyn_componenttype eq 10150'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${connectionReferenceTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch connection references with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchConnectionReferences(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildConnectionReferenceFilter(solutionId),
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
 * Search connection references by query string using msdyn_solutioncomponentsummaries
 */
export async function searchConnectionReferences(
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
    $filter: buildConnectionReferenceFilter(solutionId, query),
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
      return await searchConnectionReferences(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get connection reference count from msdyn_solutioncomponentcountsummaries
 */
export async function getConnectionReferenceCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 10150`,
      },
      'v9.0'
    )

    // 获取 componenttype=10150 (Connection Reference) 的数量
    const connectionReferenceRow = response.value?.find((row: any) => row.msdyn_componenttype === 10150)
    return connectionReferenceRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get connection reference count:', error)
    return 0
  }
}
