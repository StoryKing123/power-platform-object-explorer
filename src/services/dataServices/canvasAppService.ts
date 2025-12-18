// Canvas App Service - Fetch canvas apps from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { CanvasApp, ODataResponse, ODataParams } from '../api/d365ApiTypes'

let supportsCanvasAppsQueryOptions = true
let supportsCanvasAppsServerSideSearch = true
let supportsCanvasAppsCount = true

function buildPreferredCanvasAppQuery(pageSize: number): ODataParams {
  return {
    $select: 'canvasappid,name,displayname,description,statecode,statuscode,modifiedon,createdon',
    $filter: 'statecode eq 0',
    $orderby: 'displayname asc',
    $top: pageSize,
  }
}

/**
 * Fetch canvas apps with pagination.
 * Note: some environments may not support all query options/fields, so we fallback on error.
 */
export async function fetchCanvasApps(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  _skip?: number
): Promise<ODataResponse<CanvasApp>> {
  if (!supportsCanvasAppsQueryOptions) {
    return await d365ApiClient.getCollection<CanvasApp>(D365_API_CONFIG.endpoints.canvasApps, { $top: pageSize })
  }

  try {
    return await d365ApiClient.getCollection<CanvasApp>(
      D365_API_CONFIG.endpoints.canvasApps,
      buildPreferredCanvasAppQuery(pageSize)
    )
  } catch (error) {
    supportsCanvasAppsQueryOptions = false
    return await d365ApiClient.getCollection<CanvasApp>(D365_API_CONFIG.endpoints.canvasApps, { $top: pageSize })
  }
}

export async function fetchCanvasAppById(appId: string): Promise<CanvasApp> {
  return await d365ApiClient.get<CanvasApp>(`${D365_API_CONFIG.endpoints.canvasApps}(${appId})`)
}

/**
 * Search canvas apps by query string.
 * Falls back to client-side filtering if server-side filter is not supported.
 */
export async function searchCanvasApps(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  _skip?: number
): Promise<ODataResponse<CanvasApp>> {
  const trimmed = query.trim()
  if (!trimmed) return { value: [], '@odata.count': 0 }

  // Basic OData string escaping for single quotes
  const escaped = trimmed.replace(/'/g, "''")

  if (!supportsCanvasAppsServerSideSearch) {
    const response = await fetchCanvasApps(pageSize)
    const lowered = trimmed.toLowerCase()
    return {
      value: response.value.filter((app) => {
        const name = String(app.displayname ?? app.name ?? '').toLowerCase()
        const description = String(app.description ?? '').toLowerCase()
        return name.includes(lowered) || description.includes(lowered)
      }),
      '@odata.count': response['@odata.count'],
      '@odata.nextLink': response['@odata.nextLink'],
    }
  }

  try {
    const params: ODataParams = {
      $select: 'canvasappid,name,displayname,description,statecode,statuscode,modifiedon,createdon',
      $filter: `statecode eq 0 and (contains(name,'${escaped}') or contains(displayname,'${escaped}'))`,
      $orderby: 'displayname asc',
      $top: pageSize,
    }
    return await d365ApiClient.getCollection<CanvasApp>(D365_API_CONFIG.endpoints.canvasApps, params)
  } catch (error) {
    supportsCanvasAppsServerSideSearch = false
    const response = await fetchCanvasApps(pageSize)
    const lowered = trimmed.toLowerCase()
    return {
      value: response.value.filter((app) => {
        const name = String(app.displayname ?? app.name ?? '').toLowerCase()
        const description = String(app.description ?? '').toLowerCase()
        return name.includes(lowered) || description.includes(lowered)
      }),
      '@odata.count': response['@odata.count'],
      '@odata.nextLink': response['@odata.nextLink'],
    }
  }
}

/**
 * Get canvas app count.
 * Falls back to 0 if $count is unsupported.
 */
export async function getCanvasAppCount(): Promise<number> {
  if (!supportsCanvasAppsCount) return 0

  try {
    const response = await d365ApiClient.getCollection<CanvasApp>(D365_API_CONFIG.endpoints.canvasApps, {
      $count: true,
      $top: 1,
      $filter: 'statecode eq 0',
    })
    return response['@odata.count'] || 0
  } catch (error) {
    try {
      const response = await d365ApiClient.getCollection<CanvasApp>(D365_API_CONFIG.endpoints.canvasApps, {
        $count: true,
        $top: 1,
      })
      return response['@odata.count'] || 0
    } catch {
      supportsCanvasAppsCount = false
      return 0
    }
  }
}
