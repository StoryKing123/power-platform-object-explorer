// Connection Reference Service - Fetch connection references from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type {
  ConnectionReference,
  ConnectionReferenceBindingInfo,
  ODataParams,
  ODataResponse,
  SolutionComponentSummary,
  SystemUser
} from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

/**
 * 构建 Connection Reference 的 filter 条件
 * componenttype=10150 表示 Connection Reference
 */
async function buildConnectionReferenceFilter(searchQuery?: string): Promise<string> {
  const connectionReferenceTypeFilter = await getCategoryTypeFilter('connectionreferences', [10150])
  const solutionId = await getDefaultSolutionId()
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${connectionReferenceTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch connection references with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchConnectionReferences(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const filter = await buildConnectionReferenceFilter()

  const params: ODataParams = {
    $filter: filter,
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
 * Search connection references by query string using msdyn_solutioncomponentsummaries
 */
export async function searchConnectionReferences(
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

  const filter = await buildConnectionReferenceFilter(query)

  const params: ODataParams = {
    $filter: filter,
    $orderby: 'msdyn_displayname asc',
    $top: pageSize,
  }

  try {
    return await d365ApiClient.getCollection<SolutionComponentSummary>(
      D365_API_CONFIG.endpoints.solutionComponentSummaries,
      params,
      'v9.0'
    )
  } catch (error) {
    if (handleWorkflowIdUniqueUnsupported(error)) {
      return await searchConnectionReferences(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get connection reference count from msdyn_solutioncomponentcountsummaries
 */
export async function getConnectionReferenceCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('connectionreferences', [10150])
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
    console.warn('Failed to get connection reference count:', error)
    return 0
  }
}

function normalizeGuid(value: string): string {
  return (value || '').replace(/[{}]/g, '')
}

async function fetchSystemUserById(systemUserId: string): Promise<SystemUser | null> {
  const id = normalizeGuid(systemUserId)
  if (!id) return null

  try {
    const user = await d365ApiClient.getById<SystemUser>(
      D365_API_CONFIG.endpoints.systemUsers,
      id,
      { $select: 'systemuserid,fullname,internalemailaddress' }
    )
    return user || null
  } catch (error) {
    console.warn('Failed to fetch system user:', error)
    return null
  }
}

/**
 * 获取 Connection Reference 当前绑定的 Connection，以及该 Connection 的 owner 信息
 */
export async function fetchConnectionReferenceBindingInfo(
  connectionReferenceId: string
): Promise<ConnectionReferenceBindingInfo | null> {
  const id = normalizeGuid(connectionReferenceId)
  if (!id) return null

  const response = await d365ApiClient.getCollection<ConnectionReference>(
    D365_API_CONFIG.endpoints.connectionReferences,
    {
      $filter: `connectionreferenceid eq ${id}`,
      $select: 'connectionreferenceid,connectionreferencedisplayname,connectionid,connectorid,connectionreferencelogicalname,_owninguser_value,_ownerid_value,_createdby_value',
      $top: 1,
    },
    'v9.2'
  )

  const connectionReference = response.value?.[0]
  if (!connectionReference) return null

  const connectionId = connectionReference.connectionid
  const connectionName = connectionReference.connectionreferencedisplayname

  const ownerUserId =
    connectionReference._owninguser_value ||
    connectionReference._ownerid_value ||
    connectionReference._createdby_value
  const ownerUser = ownerUserId ? await fetchSystemUserById(ownerUserId) : null

  return {
    connectionId,
    connectionName,
    ownerName: ownerUser?.fullname,
    ownerEmail: ownerUser?.internalemailaddress,
  }
}
