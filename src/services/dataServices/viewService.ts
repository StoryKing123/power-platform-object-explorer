// View Service - Fetch views from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SavedQuery, UserQuery, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { combineFilters, buildViewSearchFilter } from '@/utils/odataHelper'

/**
 * Fetch system views with pagination
 */
export async function fetchSystemViews(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SavedQuery>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.systemViews,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SavedQuery>(
    D365_API_CONFIG.endpoints.systemViews,
    params
  )
}

/**
 * Fetch personal views with pagination
 */
export async function fetchPersonalViews(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<UserQuery>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.personalViews,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<UserQuery>(
    D365_API_CONFIG.endpoints.personalViews,
    params
  )
}

/**
 * Fetch all views (system + personal)
 */
export async function fetchAllViews(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<{ systemViews: SavedQuery[]; personalViews: UserQuery[] }> {
  const [systemResponse, personalResponse] = await Promise.all([
    fetchSystemViews(pageSize, skip),
    fetchPersonalViews(pageSize, skip),
  ])

  return {
    systemViews: systemResponse.value,
    personalViews: personalResponse.value,
  }
}

/**
 * Search system views by query string
 */
export async function searchSystemViews(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SavedQuery>> {
  const searchFilter = buildViewSearchFilter(query)
  const baseFilter = D365_API_CONFIG.queries.systemViews.$filter

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.systemViews.$select,
    $filter: combineFilters(baseFilter, searchFilter),
    $orderby: D365_API_CONFIG.queries.systemViews.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SavedQuery>(
    D365_API_CONFIG.endpoints.systemViews,
    params
  )
}

/**
 * Search personal views by query string
 */
export async function searchPersonalViews(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<UserQuery>> {
  const searchFilter = buildViewSearchFilter(query)
  const baseFilter = D365_API_CONFIG.queries.personalViews.$filter

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.personalViews.$select,
    $filter: combineFilters(baseFilter, searchFilter),
    $orderby: D365_API_CONFIG.queries.personalViews.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<UserQuery>(
    D365_API_CONFIG.endpoints.personalViews,
    params
  )
}

/**
 * Get view count (system + personal)
 */
export async function getViewCount(): Promise<number> {
  const [systemCount, personalCount] = await Promise.all([
    getSystemViewCount(),
    getPersonalViewCount(),
  ])

  return systemCount + personalCount
}

/**
 * Get system view count
 */
export async function getSystemViewCount(): Promise<number> {
  const params: ODataParams = {
    $filter: D365_API_CONFIG.queries.systemViews.$filter,
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<SavedQuery>(
    D365_API_CONFIG.endpoints.systemViews,
    params
  )

  return response['@odata.count'] || 0
}

/**
 * Get personal view count
 */
export async function getPersonalViewCount(): Promise<number> {
  const params: ODataParams = {
    $filter: D365_API_CONFIG.queries.personalViews.$filter,
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<UserQuery>(
    D365_API_CONFIG.endpoints.personalViews,
    params
  )

  return response['@odata.count'] || 0
}
