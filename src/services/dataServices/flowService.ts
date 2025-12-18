// Flow Service - Fetch cloud flows (Power Automate) from D365 Web API

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { Workflow, ODataResponse, ODataParams } from '../api/d365ApiTypes'

/**
 * Fetch flows with pagination
 * Flows are workflows with category = 5 (Modern Flow)
 * Note: workflows entity doesn't support $skip
 */
export async function fetchFlows(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Workflow>> {
  const params: ODataParams = {
    $select: 'workflowid,workflowidunique,solutionid,name,type,category,primaryentity,description,statecode,statuscode,ismanaged,createdon,modifiedon,modernflowtype,clientdata,_ownerid_value,_owninguser_value,_owningteam_value,_createdby_value',
    $expand: 'owninguser($select=fullname),createdby($select=fullname)',
    $filter: 'category eq 5 and statecode eq 1', // Modern flows, activated
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by workflows entity
  }

  return await d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params
  )
}

/**
 * Fetch flow by ID
 */
export async function fetchFlowById(flowId: string): Promise<Workflow> {
  const params: ODataParams = {
    $select: 'workflowid,workflowidunique,solutionid,name,type,category,primaryentity,description,statecode,statuscode,ismanaged,createdon,modifiedon,modernflowtype,clientdata,_ownerid_value,_owninguser_value,_owningteam_value,_createdby_value',
    $expand: 'owninguser($select=fullname),createdby($select=fullname)',
  }

  return await d365ApiClient.get<Workflow>(
    `${D365_API_CONFIG.endpoints.workflows}(${flowId})`,
    params
  )
}

/**
 * Search flows by query string
 * Note: workflows entity doesn't support $skip
 */
export async function searchFlows(
  query: string,
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<Workflow>> {
  const params: ODataParams = {
    $select: 'workflowid,workflowidunique,solutionid,name,type,category,primaryentity,description,statecode,statuscode,ismanaged,createdon,modifiedon,modernflowtype,clientdata,_ownerid_value,_owninguser_value,_owningteam_value,_createdby_value',
    $expand: 'owninguser($select=fullname),createdby($select=fullname)',
    $filter: `category eq 5 and statecode eq 1 and (contains(name,'${query}') or contains(description,'${query}'))`,
    $orderby: 'name asc',
    $top: pageSize,
    // Note: $skip is not supported by workflows entity
  }

  return await d365ApiClient.getCollection<Workflow>(
    D365_API_CONFIG.endpoints.workflows,
    params
  )
}

/**
 * Get flow count
 */
export async function getFlowCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<Workflow>(
      D365_API_CONFIG.endpoints.workflows,
      {
        $count: true,
        $top: 1,
        $filter: 'category eq 5 and statecode eq 1', // Modern flows, activated
      }
    )
    return response['@odata.count'] || 0
  } catch (error) {
    console.warn('Failed to get flow count:', error)
    return 0
  }
}
