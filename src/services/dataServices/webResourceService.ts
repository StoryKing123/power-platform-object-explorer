// Web Resource Service - Fetch web resources from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { WebResource, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { combineFilters, buildWebResourceSearchFilter } from '@/utils/odataHelper'

/**
 * Fetch web resources with pagination
 */
export async function fetchWebResources(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<WebResource>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.webResources,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<WebResource>(
    D365_API_CONFIG.endpoints.webResources,
    params
  )
}

/**
 * Fetch web resource by ID
 */
export async function fetchWebResourceById(webResourceId: string): Promise<WebResource> {
  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.webResources.$select,
  }

  return d365ApiClient.getById<WebResource>(
    D365_API_CONFIG.endpoints.webResources,
    webResourceId,
    params
  )
}

/**
 * Search web resources by query string
 */
export async function searchWebResources(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<WebResource>> {
  const searchFilter = buildWebResourceSearchFilter(query)

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.webResources.$select,
    $filter: searchFilter,
    $orderby: D365_API_CONFIG.queries.webResources.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<WebResource>(
    D365_API_CONFIG.endpoints.webResources,
    params
  )
}

/**
 * Get web resource count
 */
export async function getWebResourceCount(): Promise<number> {
  const params: ODataParams = {
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<WebResource>(
    D365_API_CONFIG.endpoints.webResources,
    params
  )

  return response['@odata.count'] || 0
}
