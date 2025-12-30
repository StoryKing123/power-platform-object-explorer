// Choice Service - Fetch choices (option sets) from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 Choice 的 filter 条件
 * componenttype=9 表示 OptionSet (Choice)
 */
function buildChoiceFilter(solutionId: string, searchQuery?: string): string {
  const choiceTypeFilter = 'msdyn_componenttype eq 9'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${choiceTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
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
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildChoiceFilter(solutionId),
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

  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildChoiceFilter(solutionId, query),
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
 * Get choice count from msdyn_solutioncomponentcountsummaries
 */
export async function getChoiceCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and msdyn_componenttype eq 9`,
      },
      'v9.0'
    )

    // 获取 componenttype=9 (Choice) 的数量
    const choiceRow = response.value?.find((row: any) => row.msdyn_componenttype === 9)
    return choiceRow?.msdyn_total || 0
  } catch (error) {
    console.warn('Failed to get choice count:', error)
    return 0
  }
}
