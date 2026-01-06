// Choice Service - Fetch choices (option sets) from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Choice 的 filter 条件
 * componenttype=9 表示 OptionSet (Choice)
 */
async function buildChoiceFilter(searchQuery?: string): Promise<string> {
  const choiceTypeFilter = await getCategoryTypeFilter('choices', [9])
  const solutionId = await getDefaultSolutionId()
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${choiceTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch choices with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchChoices(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const filter = await buildChoiceFilter()

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
 * Search choices by query string using msdyn_solutioncomponentsummaries
 */
export async function searchChoices(
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

  const filter = await buildChoiceFilter(query)

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
      return await searchChoices(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get choice count from msdyn_solutioncomponentcountsummaries
 */
export async function getChoiceCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('choices', [9])
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
    console.warn('Failed to get choice count:', error)
    return 0
  }
}
