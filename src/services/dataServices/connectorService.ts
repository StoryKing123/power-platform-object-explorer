// Connector Service - Fetch custom connectors from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Custom Connector 的 filter 条件
 * componenttype=372 表示 Custom Connector
 */
async function buildConnectorFilter(searchQuery?: string): Promise<string> {
  const connectorTypeFilter = await getCategoryTypeFilter('connectors', [372])
  const solutionId = await getDefaultSolutionId()
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
  const filter = await buildConnectorFilter()

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

  const filter = await buildConnectorFilter(query)

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
    const typeFilter = await getCategoryTypeFilter('connectors', [372])
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
    console.warn('Failed to get connector count:', error)
    return 0
  }
}
