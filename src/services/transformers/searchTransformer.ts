// Transform search results from msdyn_solutioncomponentsummaries to Component format

import type { Component } from '@/data/mockData'
import type { SolutionComponentSummary } from '@/services/api/d365ApiTypes'

/**
 * Get category name from component type code
 */
function getCategoryFromComponentType(componentType: number): string {
  const categoryMap: Record<number, string> = {
    1: 'entities',
    24: 'forms',
    60: 'forms',
    26: 'views',
    29: 'workflows',
    91: 'plugins',
    92: 'plugins',
    61: 'webResources',
    300: 'apps',
    20: 'securityRoles',
  }
  return categoryMap[componentType] || 'unknown'
}

/**
 * Get component type label from component type code
 */
function getComponentTypeLabel(componentType: number): string {
  const labelMap: Record<number, string> = {
    1: 'Entity',
    24: 'Form',
    60: 'System Form',
    26: 'View',
    29: 'Workflow',
    91: 'Plugin Assembly',
    92: 'Plugin Step',
    61: 'Web Resource',
    300: 'App',
    20: 'Security Role',
  }
  return labelMap[componentType] || 'Component'
}

/**
 * Format date string to readable format
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'N/A'
  }
}

/**
 * Transform SolutionComponentSummary to Component
 * Converts raw search results to the Component interface used by the UI
 */
export function transformSearchResult(result: SolutionComponentSummary): Component {
  return {
    id: result.msdyn_objectid,
    name: result.msdyn_displayname || result.msdyn_name,
    type: getComponentTypeLabel(result.msdyn_componenttype),
    category: getCategoryFromComponentType(result.msdyn_componenttype),
    status: 'active', // Search results don't include status, default to active
    lastModified: 'N/A', // modifiedon not available in search results
    description: result.msdyn_description || `${result.msdyn_componenttypename}: ${result.msdyn_name}`,
    solutions: [], // Not available in summary table
    metadata: {
      componentType: result.msdyn_componenttype,
      componentTypeName: result.msdyn_componenttypename,
      objectId: result.msdyn_objectid,
      objectTypeCode: result.msdyn_objecttypecode,
      schemaName: result.msdyn_schemaname,
      isManaged: result.msdyn_ismanaged,
      isCustom: result.msdyn_iscustom,
      // Store original search result for reference
      _searchResult: result,
    },
  }
}
