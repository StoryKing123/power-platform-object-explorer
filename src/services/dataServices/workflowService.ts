// Workflow Service - Fetch workflows from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { Workflow, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { combineFilters, buildWorkflowSearchFilter } from '@/utils/odataHelper'

/**
 * Fetch workflows with pagination
 */
export async function fetchWorkflows(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Workflow>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.workflows,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params
  )
}

/**
 * Fetch workflow by ID
 */
export async function fetchWorkflowById(workflowId: string): Promise<Workflow> {
  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.workflows.$select,
  }

  return d365ApiClient.getById<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    workflowId,
    params
  )
}

/**
 * Search workflows by query string
 */
export async function searchWorkflows(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Workflow>> {
  const searchFilter = buildWorkflowSearchFilter(query)
  const baseFilter = D365_API_CONFIG.queries.workflows.$filter

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.workflows.$select,
    $filter: combineFilters(baseFilter, searchFilter),
    $orderby: D365_API_CONFIG.queries.workflows.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params
  )
}

/**
 * Get workflow count
 */
export async function getWorkflowCount(): Promise<number> {
  const params: ODataParams = {
    $filter: D365_API_CONFIG.queries.workflows.$filter,
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params
  )

  return response['@odata.count'] || 0
}
