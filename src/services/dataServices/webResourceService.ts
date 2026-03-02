// Web Resource Service - Fetch web resources from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams, WebResource } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 WebResource 的 filter 条件
 * 默认 componenttype=61 表示 WebResource（优先使用环境探测值）
 */
async function buildWebResourceFilter(solutionId: string, searchQuery?: string): Promise<string> {
  const webResourceTypeFilter = await getCategoryTypeFilter('webresources', [61])
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${webResourceTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch web resources with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchWebResources(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()
  const filter = await buildWebResourceFilter(solutionId)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0',
    { maxPageSize: pageSize }
  )
}

/**
 * Search web resources by query string using msdyn_solutioncomponentsummaries
 */
export async function searchWebResources(
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
  const filter = await buildWebResourceFilter(solutionId, query)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
  }

  return await d365ApiClient.getCollection<SolutionComponentSummary>(
    D365_API_CONFIG.endpoints.solutionComponentSummaries,
    params,
    'v9.0',
    { maxPageSize: pageSize }
  )
}

/**
 * Get web resource count from msdyn_solutioncomponentcountsummaries
 */
export async function getWebResourceCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('webresources', [61])
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
    console.warn('Failed to get web resource count:', error)
    return 0
  }
}

/**
 * 通过 webresourceid 获取单个 Web Resource 的详细信息
 */
export async function fetchWebResourceDetails(webresourceid: string): Promise<WebResource> {
  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.webResources.$select,
  }

  return await d365ApiClient.get<WebResource>(
    `${D365_API_CONFIG.endpoints.webResources}(${webresourceid})`,
    params,
    'v9.2'
  )
}
