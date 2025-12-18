// Plugin Service - Fetch plugins from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { PluginAssembly, SdkMessageProcessingStep, ODataResponse, ODataParams } from '../api/d365ApiTypes'
import { combineFilters, buildPluginSearchFilter } from '@/utils/odataHelper'

/**
 * Fetch plugin assemblies with pagination
 */
export async function fetchPluginAssemblies(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<PluginAssembly>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.pluginAssemblies,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<PluginAssembly>(
    D365_API_CONFIG.endpoints.pluginAssemblies,
    params
  )
}

/**
 * Fetch plugin steps with pagination
 */
export async function fetchPluginSteps(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SdkMessageProcessingStep>> {
  const params: ODataParams = {
    ...D365_API_CONFIG.queries.pluginSteps,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SdkMessageProcessingStep>(
    D365_API_CONFIG.endpoints.pluginSteps,
    params
  )
}

/**
 * Fetch all plugins (assemblies + steps)
 */
export async function fetchAllPlugins(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<{ assemblies: PluginAssembly[]; steps: SdkMessageProcessingStep[] }> {
  const [assembliesResponse, stepsResponse] = await Promise.all([
    fetchPluginAssemblies(pageSize, skip),
    fetchPluginSteps(pageSize, skip),
  ])

  return {
    assemblies: assembliesResponse.value,
    steps: stepsResponse.value,
  }
}

/**
 * Search plugin assemblies by query string
 */
export async function searchPluginAssemblies(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<PluginAssembly>> {
  const searchFilter = buildPluginSearchFilter(query)

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.pluginAssemblies.$select,
    $filter: searchFilter,
    $orderby: D365_API_CONFIG.queries.pluginAssemblies.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<PluginAssembly>(
    D365_API_CONFIG.endpoints.pluginAssemblies,
    params
  )
}

/**
 * Search plugin steps by query string
 */
export async function searchPluginSteps(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SdkMessageProcessingStep>> {
  const searchFilter = buildPluginSearchFilter(query)
  const baseFilter = D365_API_CONFIG.queries.pluginSteps.$filter

  const params: ODataParams = {
    $select: D365_API_CONFIG.queries.pluginSteps.$select,
    $expand: D365_API_CONFIG.queries.pluginSteps.$expand,
    $filter: combineFilters(baseFilter, searchFilter),
    $orderby: D365_API_CONFIG.queries.pluginSteps.$orderby,
    $top: pageSize,
  }

  if (skip !== undefined && skip > 0) {
    params.$skip = skip
  }

  return d365ApiClient.getCollection<SdkMessageProcessingStep>(
    D365_API_CONFIG.endpoints.pluginSteps,
    params
  )
}

/**
 * Get plugin count (assemblies + steps)
 */
export async function getPluginCount(): Promise<number> {
  const [assemblyCount, stepCount] = await Promise.all([
    getPluginAssemblyCount(),
    getPluginStepCount(),
  ])

  return assemblyCount + stepCount
}

/**
 * Get plugin assembly count
 */
export async function getPluginAssemblyCount(): Promise<number> {
  const params: ODataParams = {
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<PluginAssembly>(
    D365_API_CONFIG.endpoints.pluginAssemblies,
    params
  )

  return response['@odata.count'] || 0
}

/**
 * Get plugin step count
 */
export async function getPluginStepCount(): Promise<number> {
  const params: ODataParams = {
    $filter: D365_API_CONFIG.queries.pluginSteps.$filter,
    $count: true,
    $top: 1,
  }

  const response = await d365ApiClient.getCollection<SdkMessageProcessingStep>(
    D365_API_CONFIG.endpoints.pluginSteps,
    params
  )

  return response['@odata.count'] || 0
}
