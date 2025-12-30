// Plugin Service - Fetch plugins from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentSummary, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'

/**
 * 构建 Plugin 的 filter 条件
 * componenttype=91 表示 PluginAssembly, componenttype=92 表示 SdkMessageProcessingStep
 */
function buildPluginFilter(solutionId: string, searchQuery?: string): string {
  const pluginTypeFilter = '(msdyn_componenttype eq 91 or msdyn_componenttype eq 92)'
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${pluginTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
    const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
    return `${baseFilter} and ${searchFilter}`
  }

  return baseFilter
}

/**
 * Fetch all plugins with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchAllPlugins(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const solutionId = await getDefaultSolutionId()

  const params: ODataParams = {
    $filter: buildPluginFilter(solutionId),
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
 * Search plugin assemblies by query string using msdyn_solutioncomponentsummaries
 */
export async function searchPluginAssemblies(
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
    $filter: buildPluginFilter(solutionId, query),
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
 * Search plugin steps by query string (same as assemblies since both are in componenttype 91/92)
 */
export async function searchPluginSteps(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  return searchPluginAssemblies(query, pageSize, skip)
}

/**
 * Get plugin count from msdyn_solutioncomponentcountsummaries
 */
export async function getPluginCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `msdyn_solutionid eq ${solutionId} and (msdyn_componenttype eq 91 or msdyn_componenttype eq 92)`,
      },
      'v9.0'
    )

    // Sum both componenttype 91 and 92
    let count = 0
    for (const row of response.value || []) {
      if (row.msdyn_componenttype === 91 || row.msdyn_componenttype === 92) {
        count += typeof row.msdyn_total === 'number' ? row.msdyn_total : 0
      }
    }
    return count
  } catch (error) {
    console.warn('Failed to get plugin count:', error)
    return 0
  }
}
