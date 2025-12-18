// Category Service - Fetch category data and counts from D365

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { Category } from '@/data/mockData'
import { getCanvasAppCount } from './canvasAppService'

/**
 * Fetch all categories with their counts
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    // Fetch counts for all categories in parallel
    const [
      entityCount,
      formCount,
      viewCount,
      workflowCount,
      pluginCount,
      webResourceCount,
      appCount,
      flowCount,
      securityRoleCount,
      choiceCount,
    ] = await Promise.all([
      getEntityCount(),
      getFormCount(),
      getViewCount(),
      getWorkflowCount(),
      getPluginCount(),
      getWebResourceCount(),
      getAppCount(),
      getFlowCount(),
      getSecurityRoleCount(),
      getChoiceCount(),
    ])

    const totalCount =
      entityCount +
      formCount +
      viewCount +
      workflowCount +
      pluginCount +
      webResourceCount +
      appCount +
      flowCount +
      securityRoleCount +
      choiceCount

    // Build categories array with real counts
    const categories: Category[] = [
      { id: 'all', name: 'All Components', icon: 'LayoutGrid', count: totalCount },
      { id: 'entities', name: 'Entities', icon: 'Database', count: entityCount },
      { id: 'forms', name: 'Forms', icon: 'FileText', count: formCount },
      { id: 'views', name: 'Views', icon: 'Table2', count: viewCount },
      { id: 'workflows', name: 'Workflows', icon: 'GitBranch', count: workflowCount },
      { id: 'plugins', name: 'Plugins', icon: 'Puzzle', count: pluginCount },
      { id: 'webresources', name: 'Web Resources', icon: 'Globe', count: webResourceCount },
      { id: 'apps', name: 'Apps', icon: 'Package', count: appCount },
      { id: 'flows', name: 'Flows', icon: 'Zap', count: flowCount },
      { id: 'securityroles', name: 'Security Roles', icon: 'Shield', count: securityRoleCount },
      { id: 'choices', name: 'Choices', icon: 'List', count: choiceCount },
    ]

    return categories
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    throw error
  }
}

/**
 * Get entity count
 */
async function getEntityCount(): Promise<number> {
  try {
    const response = await d365ApiClient.get<{ value: any[] }>(
      D365_API_CONFIG.endpoints.entities
    )
    return response.value?.length || 0
  } catch (error) {
    console.warn('Failed to get entity count:', error)
    return 0
  }
}

/**
 * Get form count
 */
async function getFormCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.forms,
      {
        $count: true,
        $top: 1,
        $filter: D365_API_CONFIG.queries.forms.$filter,
      }
    )
    return response['@odata.count'] || 0
  } catch (error) {
    console.warn('Failed to get form count:', error)
    return 0
  }
}

/**
 * Get view count (system + personal views)
 */
async function getViewCount(): Promise<number> {
  try {
    const [systemViewResponse, personalViewResponse] = await Promise.all([
      d365ApiClient.getCollection<any>(
        D365_API_CONFIG.endpoints.systemViews,
        {
          $count: true,
          $top: 1,
          $filter: D365_API_CONFIG.queries.systemViews.$filter,
        }
      ),
      d365ApiClient.getCollection<any>(
        D365_API_CONFIG.endpoints.personalViews,
        {
          $count: true,
          $top: 1,
          $filter: D365_API_CONFIG.queries.personalViews.$filter,
        }
      ),
    ])

    const systemCount = systemViewResponse['@odata.count'] || 0
    const personalCount = personalViewResponse['@odata.count'] || 0
    return systemCount + personalCount
  } catch (error) {
    console.warn('Failed to get view count:', error)
    return 0
  }
}

/**
 * Get workflow count
 */
async function getWorkflowCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.workflows,
      {
        $count: true,
        $top: 1,
        $filter: D365_API_CONFIG.queries.workflows.$filter,
      }
    )
    return response['@odata.count'] || 0
  } catch (error) {
    console.warn('Failed to get workflow count:', error)
    return 0
  }
}

/**
 * Get plugin count (assemblies + steps)
 */
async function getPluginCount(): Promise<number> {
  try {
    const [assemblyResponse, stepResponse] = await Promise.all([
      d365ApiClient.getCollection<any>(
        D365_API_CONFIG.endpoints.pluginAssemblies,
        {
          $count: true,
          $top: 1,
        }
      ),
      d365ApiClient.getCollection<any>(
        D365_API_CONFIG.endpoints.pluginSteps,
        {
          $count: true,
          $top: 1,
          $filter: D365_API_CONFIG.queries.pluginSteps.$filter,
        }
      ),
    ])

    const assemblyCount = assemblyResponse['@odata.count'] || 0
    const stepCount = stepResponse['@odata.count'] || 0
    return assemblyCount + stepCount
  } catch (error) {
    console.warn('Failed to get plugin count:', error)
    return 0
  }
}

/**
 * Get web resource count
 */
async function getWebResourceCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.webResources,
      {
        $count: true,
        $top: 1,
      }
    )
    return response['@odata.count'] || 0
  } catch (error) {
    console.warn('Failed to get web resource count:', error)
    return 0
  }
}

/**
 * Get app count (Model-driven apps)
 */
async function getAppCount(): Promise<number> {
  try {
    // Model-driven apps are stored in appmodule entity
    const response = await d365ApiClient.getCollection<any>(
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

/**
 * Get flow count (Cloud flows)
 */
async function getFlowCount(): Promise<number> {
  try {
    // Flows with category 5 are modern flows (Power Automate)
    const response = await d365ApiClient.getCollection<any>(
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

/**
 * Get security role count
 */
async function getSecurityRoleCount(): Promise<number> {
  try {
    const response = await d365ApiClient.getCollection<any>(
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

/**
 * Get choice (option set) count
 */
async function getChoiceCount(): Promise<number> {
  try {
    // Global option sets are in GlobalOptionSetDefinitions metadata
    const response = await d365ApiClient.get<{ value: any[] }>(
      'GlobalOptionSetDefinitions'
    )
    return response.value?.length || 0
  } catch (error) {
    console.warn('Failed to get choice count:', error)
    return 0
  }
}
