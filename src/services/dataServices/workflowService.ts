// Workflow Service - Fetch workflows from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 Workflow 的 filter 条件
 * componenttype=29 表示 Workflow, workflowcategory!='5' (不是 Modern Flow)
 */
function buildWorkflowFilter(solutionId: string, searchQuery?: string): string {
  const workflowTypeFilter = "msdyn_componenttype eq 29 and msdyn_workflowcategory ne '5'"
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${workflowTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch workflows with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchWorkflows(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildWorkflowFilter(solutionId),
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
 * Search workflows by query string using msdyn_solutioncomponentsummaries
 */
export async function searchWorkflows(
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
    $filter: buildWorkflowFilter(solutionId, query),
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
 * Get workflow count from msdyn_solutioncomponentcountsummaries
 */
export async function getWorkflowCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total,msdyn_workflowcategory',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 29 and msdyn_workflowcategory ne '5'`,
      },
      'v9.0'
    )

    // 获取 componenttype=29 (Workflow) 且 workflowcategory!='5' 的数量
    const workflowRow = response.value?.find((row: any) =>
      row.msdyn_componenttype === 29 && row.msdyn_workflowcategory !== 5 && row.msdyn_workflowcategory !== '5'
    )
    return workflowRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get workflow count:', error)
    return 0
  }
}
