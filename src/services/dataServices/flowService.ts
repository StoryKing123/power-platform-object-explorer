// Flow Service - Fetch cloud flows (Power Automate) from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 Flow 的 filter 条件
 * componenttype=29 表示 Workflow, workflowcategory='5' 表示 Modern Flow (Power Automate)
 */
function buildFlowFilter(solutionId: string, searchQuery?: string): string {
  const flowTypeFilter = "msdyn_componenttype eq 29 and msdyn_workflowcategory eq '5'"
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${flowTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch flows with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchFlows(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildFlowFilter(solutionId),
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
 * Search flows by query string using msdyn_solutioncomponentsummaries
 */
export async function searchFlows(
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
    $filter: buildFlowFilter(solutionId, query),
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
 * Get flow count from msdyn_solutioncomponentcountsummaries
 */
export async function getFlowCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total,msdyn_workflowcategory',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 29 and msdyn_workflowcategory eq '5'`,
      },
      'v9.0'
    )

    // 获取 componenttype=29 (Workflow) 且 workflowcategory='5' (Modern Flow) 的数量
    const flowRow = response.value?.find((row: any) =>
      row.msdyn_componenttype === 29 && (row.msdyn_workflowcategory === 5 || row.msdyn_workflowcategory === '5')
    )
    return flowRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get flow count:', error)
    return 0
  }
}
