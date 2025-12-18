// Security Role Service - Fetch security roles from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { Role, ODataResponse, ODataParams } from '../api/d365ApiTypes'

/**
 * Fetch security roles with pagination
 * Note: roles entity doesn't support $skip
 */
export async function fetchSecurityRoles(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Role>> {
  const params: ODataParams = {
    $select: 'roleid,name,description,ismanaged,modifiedon',
    $expand: 'businessunitid($select=name)',
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by roles entity
  }

  return await d365ApiClient.getCollection<Role>('roles', params)
}

/**
 * Fetch security role by ID
 */
export async function fetchSecurityRoleById(roleId: string): Promise<Role> {
  const params: ODataParams = {
    $select: 'roleid,name,description,ismanaged,modifiedon',
    $expand: 'businessunitid($select=name)',
  }

  return await d365ApiClient.get<Role>(`roles(${roleId})`, params)
}

/**
 * Search security roles by query string
 * Note: roles entity doesn't support $skip
 */
export async function searchSecurityRoles(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Role>> {
  const params: ODataParams = {
    $select: 'roleid,name,description,ismanaged,modifiedon',
    $expand: 'businessunitid($select=name)',
    $filter: `contains(name,'${query}')`,
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by roles entity
  }

  return await d365ApiClient.getCollection<Role>('roles', params)
}

/**
 * Get security role count
 */
export async function getSecurityRoleCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<Role>(
      'roles',
      {
        $count: true,
        $top: 1,
      }
    )
    return response['@odata.count'] || 0
  } catch (error) {
    console.warn('Failed to get security role count:', error)
    return 0
  }
}
