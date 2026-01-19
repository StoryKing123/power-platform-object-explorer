// Solution Service - Fetch solution data from D365

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG, COMPONENT_TYPE_CODES } from '../api/d365ApiConfig'
import type { ODataResponse, Solution as D365Solution, SolutionComponent } from '../api/d365ApiTypes'
import type { Solution } from '@/data/mockData'

/**
 * Get component type code based on category
 */
function getComponentTypeCode(category: string): number | null {
  const typeMap: Record<string, number> = {
    entities: COMPONENT_TYPE_CODES.entity,
    // Cloud flows are stored as workflows (category = 5)
    flows: COMPONENT_TYPE_CODES.workflow,
    workflows: COMPONENT_TYPE_CODES.workflow,
    apps: COMPONENT_TYPE_CODES.canvasApp, // Both model-driven and canvas apps
    securityroles: COMPONENT_TYPE_CODES.securityRole,
    webresources: COMPONENT_TYPE_CODES.webResource,
    choices: 9, // OptionSet
    connectionreferences: 10150, // Connection Reference
    connectors: 372, // Custom Connector
    environmentvariables: 380, // Environment Variable Definition
  }
  return typeMap[category] ?? null
}

/**
 * Transform D365 Solution to app Solution format
 */
function transformSolution(d365Solution: D365Solution): Solution {
  return {
    id: d365Solution.solutionid,
    name: d365Solution.uniquename,
    displayName: d365Solution.friendlyname,
    version: d365Solution.version,
    publisher: d365Solution.publisherid?.friendlyname || 'Unknown Publisher',
    isManaged: d365Solution.ismanaged,
    installedOn: d365Solution.installedon,
  }
}

/**
 * Fetch solutions for a specific component
 * @param componentId - The ID of the component (MetadataId for entities, formid for forms, etc.)
 * @param category - The category of the component (entities, forms, views, etc.)
 */
export async function fetchComponentSolutions(
  componentId: string,
  category: string,
  componentTypeOverride?: number | null
): Promise<Solution[]> {
  try {
    const componentType = componentTypeOverride ?? getComponentTypeCode(category)

    if (!componentType) {
      console.warn(`Unknown component category: ${category}`)
      return getDefaultSolution()
    }

    // Build filter based on category
    let filter = ''
    if (category === 'plugins') {
      // For plugins, check both assembly (91) and step (92)
      filter = `(objectid eq ${componentId} and (componenttype eq ${COMPONENT_TYPE_CODES.pluginAssembly} or componenttype eq ${COMPONENT_TYPE_CODES.pluginStep}))`
    } else if (category === 'apps') {
      // For apps, check both model-driven (80) and canvas (300)
      filter = `(objectid eq ${componentId} and (componenttype eq ${COMPONENT_TYPE_CODES.app} or componenttype eq ${COMPONENT_TYPE_CODES.canvasApp}))`
    } else if (category === 'environmentvariables') {
      // Environment variables can be both definition (380) and value (381)
      filter = `(objectid eq ${componentId} and (componenttype eq 380 or componenttype eq 381))`
    } else {
      filter = `objectid eq ${componentId} and componenttype eq ${componentType}`
    }

    const params = {
      ...D365_API_CONFIG.queries.solutionComponents,
      $filter: filter,
    }

    const response = await d365ApiClient.get<ODataResponse<SolutionComponent>>(
      D365_API_CONFIG.endpoints.solutionComponents,
      params
    )

    // Extract unique solutions from solution components
    const solutionsMap = new Map<string, Solution>()

    response.value.forEach(component => {
      if (component.solutionid) {
        const solution: Solution = {
          id: component.solutionid.solutionid,
          name: component.solutionid.uniquename,
          displayName: component.solutionid.friendlyname,
          version: component.solutionid.version,
          publisher: component.solutionid.publisherid?.friendlyname || 'Unknown Publisher',
          isManaged: component.solutionid.ismanaged,
          installedOn: component.solutionid.installedon,
        }
        solutionsMap.set(solution.id, solution)
      }
    })

    const solutions = Array.from(solutionsMap.values())

    // If no solutions found, return default solution
    if (solutions.length === 0) {
      return getDefaultSolution()
    }

    return solutions
  } catch (error) {
    console.error('Failed to fetch component solutions:', error)
    // Return default solution on error
    return getDefaultSolution()
  }
}

/**
 * Fetch all solutions
 */
export async function fetchAllSolutions(): Promise<D365Solution[]> {
  const params = D365_API_CONFIG.queries.solutions

  const response = await d365ApiClient.get<ODataResponse<D365Solution>>(
    D365_API_CONFIG.endpoints.solutions,
    params
  )

  return response.value
}

/**
 * Get solution count
 */
export async function getSolutionCount(): Promise<number> {
  const response = await d365ApiClient.get<ODataResponse<D365Solution>>(
    D365_API_CONFIG.endpoints.solutions,
    { $count: true, $top: 0 }
  )

  return response['@odata.count'] || 0
}

/**
 * Get default solution (fallback)
 */
function getDefaultSolution(): Solution[] {
  return [{
    id: 'default',
    name: 'Default',
    displayName: 'Default Solution',
    version: '1.0.0.0',
    publisher: 'Default Publisher',
    isManaged: false,
  }]
}
