// Connector Service - Fetch custom connectors from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'

/**
 * 构建 Custom Connector 的 filter 条件
 * componenttype=372 表示 Custom Connector
 */
function buildConnectorFilter(solutionId: string, searchQuery?: string): string {
  const connectorTypeFilter = 'msdyn_componenttype eq 372'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${connectorTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch custom connectors with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchConnectors(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildConnectorFilter(solutionId),
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
 * Search custom connectors by query string using msdyn_solutioncomponentsummaries
 */
export async function searchConnectors(
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
    $filter: buildConnectorFilter(solutionId, query),
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
      return await searchConnectors(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get custom connector count from msdyn_solutioncomponentcountsummaries
 */
export async function getConnectorCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 372`,
      },
      'v9.0'
    )

    // 获取 componenttype=372 (Custom Connector) 的数量
    const connectorRow = response.value?.find((row: any) => row.msdyn_componenttype === 372)
    return connectorRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get connector count:', error)
    return 0
  }
}
