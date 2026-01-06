// Transform search results from msdyn_solutioncomponentsummaries to Component format

import type { Component } from '@/data/mockData'
import type { SolutionComponentSummary } from '@/services/api/d365ApiTypes'

/**
 * Get category name from component summary data
 */
function getCategoryFromComponentType(result: SolutionComponentSummary): string {
  const categoryMap: Record<number, string> = {
    1: 'entities',
    80: 'apps',    // Model-driven App
    300: 'apps',   // Canvas App
    29: 'workflows',  // Will be filtered by category in flowService
    20: 'securityRoles',
    9: 'choices',  // OptionSet (Choice)
    10150: 'connectionreferences',  // Connection Reference
    372: 'connectors',  // Custom Connector
    380: 'environmentvariables',  // Environment Variable Definition
    381: 'environmentvariables',  // Environment Variable Value
  }
  const fromType = categoryMap[result.msdyn_componenttype]
  if (fromType) return fromType

  const logicalName = (result.msdyn_componentlogicalname || '').toLowerCase()
  if (logicalName === 'entity') return 'entities'
  if (logicalName === 'appmodule' || logicalName === 'canvasapp') return 'apps'
  if (logicalName === 'role') return 'securityroles'
  if (logicalName === 'optionset') return 'choices'
  if (logicalName === 'connectionreference') return 'connectionreferences'
  if (logicalName === 'connector') return 'connectors'
  if (logicalName === 'environmentvariabledefinition' || logicalName === 'environmentvariablevalue') return 'environmentvariables'
  if ((logicalName === 'workflow' || logicalName === 'flow') && (result.msdyn_workflowcategory === 5 || result.msdyn_workflowcategory === '5')) {
    return 'flows'
  }

  return 'unknown'
}

/**
 * Get component type label from component type code
 * 根据 componentType 和 subtype 获取组件类型标签
 */
function getComponentTypeLabel(componentType: number, subtype?: number | string | null, componentTypeName?: string): string {
  // Canvas App 的 subtype 处理
  if (componentType === 300) {
    if (subtype === 0 || subtype === '0') {
      return 'Classic Canvas App'
    } else if (subtype === 4 || subtype === '4') {
      return 'Modern Canvas App'
    }
    return 'Canvas App'
  }

  const labelMap: Record<number, string> = {
    1: 'Entity',
    80: 'Model-driven App',
    300: 'Canvas App',
    29: 'Workflow',
    20: 'Security Role',
    9: 'Choice',
    10150: 'Connection Reference',
    372: 'Custom Connector',
    380: 'Environment Variable Definition',
    381: 'Environment Variable Value',
  }
  return labelMap[componentType] || componentTypeName || 'Component'
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
    type: getComponentTypeLabel(result.msdyn_componenttype, result.msdyn_subtype, result.msdyn_componenttypename),
    category: getCategoryFromComponentType(result),
    status: 'active', // Search results don't include status, default to active
    lastModified: result.msdyn_modifiedon ? formatDate(result.msdyn_modifiedon) : 'N/A',
    description: result.msdyn_description || `${result.msdyn_componenttypename}: ${result.msdyn_name}`,
    solutions: [], // Not available in summary table
    metadata: {
      componentType: result.msdyn_componenttype,
      componentTypeName: result.msdyn_componenttypename,
      objectId: result.msdyn_objectid,
      objectTypeCode: result.msdyn_objecttypecode,
      schemaName: result.msdyn_schemaname ?? undefined,
      primaryIdAttribute: result.msdyn_primaryidattribute,
      isManaged: result.msdyn_ismanaged,
      isCustom: result.msdyn_iscustom,
      subtype: result.msdyn_subtype,
      canvasAppUniqueId: result.msdyn_canvasappuniqueid,
      workflowidunique: result.msdyn_workflowidunique,
      solutionid: result.msdyn_solutionid,
      msdyn_name: result.msdyn_name,
      // Store original search result for reference
      _searchResult: result,
    },
  }
}
