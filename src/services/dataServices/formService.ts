// Form Service - Fetch forms from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SystemForm, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { combineFilters, buildFormSearchFilter } from '@/utils/odataHelper'

/**
 * Fetch forms with pagination
 */
export async function fetchForms(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SystemForm>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.forms,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SystemForm>(
    D365_API_CONFIG.endpoints.forms,
    params
  )
}

/**
 * Fetch form by ID
 */
export async function fetchFormById(formId: string): Promise<SystemForm> {
  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.forms.$select,
  }

  return d365ApiClient.getById<SystemForm>(
    D365_API_CONFIG.endpoints.forms,
    formId,
    params
  )
}

/**
 * Search forms by query string
 */
export async function searchForms(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SystemForm>> {
  const searchFilter = buildFormSearchFilter(query)
  const baseFilter = D365_API_CONFIG.queries.forms.$filter

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.forms.$select,
    $filter: combineFilters(baseFilter, searchFilter),
    $orderby: D365_API_CONFIG.queries.forms.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SystemForm>(
    D365_API_CONFIG.endpoints.forms,
    params
  )
}

/**
 * Get form count
 */
export async function getFormCount(): Promise<number> {
  const params: ODataParams = {
    $filter: D365_API_CONFIG.queries.forms.$filter,
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<SystemForm>(
    D365_API_CONFIG.endpoints.forms,
    params
  )

  return response['@odata.count'] || 0
}
