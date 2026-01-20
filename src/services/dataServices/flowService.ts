// Flow Service - Fetch cloud flows (Power Automate) from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams, Workflow } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Flow 的 filter 条件（componenttype=29 且 workflowcategory=5）
 */
async function buildFlowFilter(solutionId: string, searchQuery?: string): Promise<string> {
  const flowTypeFilter = await getCategoryTypeFilter('flows', [29])
  const flowCategoryFilter = "msdyn_workflowcategory eq '5'"
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${flowTypeFilter} and ${flowCategoryFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
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
  const filter = await buildFlowFilter(solutionId)

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
  const filter = await buildFlowFilter(solutionId, query)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  try {
    return await d365ApiClient.getCollection<SolutionComponentSummary>(
      D365_API_CONFIG.endpoints.solutionComponentSummaries,
      params,
      'v9.1',
      { maxPageSize: pageSize }
    )
  } catch (error) {
    if (handleWorkflowIdUniqueUnsupported(error)) {
      return await searchFlows(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get flow count from msdyn_solutioncomponentcountsummaries
 */
export async function getFlowCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('flows', [29])
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total,msdyn_workflowcategory',
        $filter: `${typeFilter} and msdyn_workflowcategory eq '5' and msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    let count = 0
    for (const row of response.value || []) {
      if (row.msdyn_workflowcategory === 5 || row.msdyn_workflowcategory === '5') {
        count += typeof row.msdyn_total === 'number' ? row.msdyn_total : 0
      }
    }
    return count
  } catch (error) {
    console.warn('Failed to get flow count:', error)
    return 0
  }
}

/**
 * Fetch individual flow details by workflowidunique
 * Used in detail dialog to get complete flow information including modernflowtype
 */
export async function fetchFlowDetails(workflowidunique: string): Promise<Workflow | null> {
  try {
    const params: ODataParams = {
      $select: 'workflowid,workflowidunique,name,type,category,primaryentity,description,statecode,statuscode,ismanaged,iscustomizable,createdon,modifiedon,modernflowtype,clientdata,_ownerid_value,_owninguser_value,_owningteam_value',
      $expand: 'owninguser($select=fullname),owningteam($select=name)',
      $filter: `workflowidunique eq ${workflowidunique}`,
    }

    const response = await d365ApiClient.getCollection<Workflow>(
      D365_API_CONFIG.endpoints.workflows,
      params,
      'v9.2'
    )

    return response.value?.[0] || null
  } catch (error) {
    console.error('Failed to fetch flow details:', error)
    throw error
  }
}

/**
 * Fetch flow editor identifiers (workflowidunique + solutionid) by workflowid.
 * Used as a fallback when search results don't include required fields.
 */
export async function fetchFlowEditorInfoByWorkflowId(
  workflowid: string
): Promise<{ workflowidunique: string; solutionid: string } | null> {
  const params: ODataParams = {
    $select: 'workflowidunique,solutionid,category',
    $filter: `workflowid eq ${workflowid}`,
  }

  const response = await d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params,
    'v9.2'
  )

  const workflow = response.value?.[0]
  if (!workflow) return null

  // Only cloud flows (modern flows) are supported by the Flow Editor URL.
  if (workflow.category !== 5) return null

  const workflowidunique = workflow.workflowidunique
  const solutionid = workflow.solutionid
  if (!workflowidunique || !solutionid) return null

  return { workflowidunique, solutionid }
}
