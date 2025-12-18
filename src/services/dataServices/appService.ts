// App Service - Fetch model-driven apps from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { AppModule, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { getCanvasAppCount } from './canvasAppService'

/**
 * Fetch apps with pagination
 * Note: appmodules entity doesn't support $skip, so we use $top only
 */
export async function fetchApps(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<AppModule>> {
  const params: ODataParams = {
    $select: 'appmoduleid,name,uniquename,description,statecode,statuscode,modifiedon,createdon',
    $filter: 'statecode eq 0', // Active apps only
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by appmodules entity
  }

  return await d365ApiClient.getCollection<AppModule>('appmodules', params)
}

/**
 * Fetch app by ID
 */
export async function fetchAppById(appId: string): Promise<AppModule> {
  const params: ODataParams = {
    $select: 'appmoduleid,name,uniquename,description,statecode,statuscode,modifiedon,createdon',
  }

  return await d365ApiClient.get<AppModule>(`appmodules(${appId})`, params)
}

/**
 * Search apps by query string
 * Note: appmodules entity doesn't support $skip
 */
export async function searchApps(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<AppModule>> {
  const params: ODataParams = {
    $select: 'appmoduleid,name,uniquename,description,statecode,statuscode,modifiedon,createdon',
    $filter: `statecode eq 0 and (contains(name,'${query}') or contains(uniquename,'${query}'))`,
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by appmodules entity
  }

  return await d365ApiClient.getCollection<AppModule>('appmodules', params)
}

/**
 * Get app count
 */
export async function getAppCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<AppModule>(
      'appmodules',
      {
        $count: true,
        $top: 1,
        $filter: 'statecode eq 0', // Active apps only
      }
    )
    const modelDrivenCount = response['@odata.count'] || 0
    const canvasCount = await getCanvasAppCount()
    return modelDrivenCount + canvasCount
  } catch (error) {
    console.warn('Failed to get app count:', error)
    try {
      return await getCanvasAppCount()
    } catch {
      return 0
    }
  }
}
