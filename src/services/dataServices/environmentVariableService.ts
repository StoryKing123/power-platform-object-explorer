// Environment Variable Service - Fetch environment variables from msdyn_solutioncomponentsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type {
  SolutionComponentSummary,
  ODataResponse,
  ODataParams,
  EnvironmentVariableDefinition,
  EnvironmentVariableValue,
  EnvironmentVariableInfo
} from '../api/d365ApiTypes'
import { buildSolutionComponentSummarySearchClause, getDefaultSolutionId, handleWorkflowIdUniqueUnsupported } from './searchService'
import { getCategoryTypeFilter } from './componentCountService'

// 环境变量类型映射
const ENV_VAR_TYPE_NAMES: Record<number, string> = {
  100000000: 'String',
  100000001: 'Number',
  100000002: 'Boolean',
  100000003: 'JSON',
  100000004: 'Data Source',
  100000005: 'Secret',
}

/**
 * 构建 Environment Variable 的 filter 条件
 * componenttype=380 表示 Environment Variable Definition
 * componenttype=381 表示 Environment Variable Value
 */
async function buildEnvironmentVariableFilter(searchQuery?: string): Promise<string> {
  const environmentVariableTypeFilter = await getCategoryTypeFilter('environmentvariables', [380, 381])
  const solutionId = await getDefaultSolutionId()
  const solutionFilter = `msdyn_solutionid eq ${solutionId}`
  const baseFilter = `${environmentVariableTypeFilter} and ${solutionFilter}`

  if (searchQuery && searchQuery.trim()) {
    return `${baseFilter} and ${buildSolutionComponentSummarySearchClause(searchQuery)}`
  }

  return baseFilter
}

/**
 * Fetch environment variables with pagination using msdyn_solutioncomponentsummaries
 */
export async function fetchEnvironmentVariables(
  pageSize: number = D365_API_CONFIG.pagination.defaultPageSize,
  skip?: number
): Promise<ODataResponse<SolutionComponentSummary>> {
  const filter = await buildEnvironmentVariableFilter()

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
 * Search environment variables by query string using msdyn_solutioncomponentsummaries
 */
export async function searchEnvironmentVariables(
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

  const filter = await buildEnvironmentVariableFilter(query)

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
      return await searchEnvironmentVariables(query, pageSize, skip)
    }
    throw error
  }
}

/**
 * Get environment variable count from msdyn_solutioncomponentcountsummaries
 */
export async function getEnvironmentVariableCount(): Promise<number> {
  try {
    const solutionId = await getDefaultSolutionId()
    const typeFilter = await getCategoryTypeFilter('environmentvariables', [380, 381])
    const response = await d365ApiClient.getCollection<any>(
      D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
      {
        $select: 'msdyn_componenttype,msdyn_total',
        $filter: `${typeFilter} and msdyn_solutionid eq ${solutionId}`,
      },
      'v9.0'
    )

    // 获取 Environment Variable 相关组件的总数量
    const total = response.value?.reduce((sum: number, row: any) => {
      return sum + (typeof row.msdyn_total === 'number' ? row.msdyn_total : 0)
    }, 0)

    return total || 0
  } catch (error) {
    console.warn('Failed to get environment variable count:', error)
    return 0
  }
}

/**
 * 获取环境变量的默认值和当前值
 * @param definitionId - 环境变量定义的 ID (MetadataId 或 environmentvariabledefinitionid)
 * @returns EnvironmentVariableInfo 包含 defaultValue 和 currentValue
 */
export async function fetchEnvironmentVariableInfo(
  definitionId: string
): Promise<EnvironmentVariableInfo | null> {
  try {
    // 1. 获取环境变量定义（包含 default value）
    const definitionResponse = await d365ApiClient.getCollection<EnvironmentVariableDefinition>(
      D365_API_CONFIG.endpoints.environmentVariables,
      {
        $filter: `environmentvariabledefinitionid eq ${definitionId}`,
        $select: 'environmentvariabledefinitionid,schemaname,displayname,defaultvalue,type',
      },
      'v9.2'
    )

    if (!definitionResponse.value || definitionResponse.value.length === 0) {
      console.warn(`Environment variable definition not found: ${definitionId}`)
      return null
    }

    const definition = definitionResponse.value[0]

    // 2. 获取环境变量的当前值（如果存在）
    let currentValue: string | undefined
    try {
      const valueResponse = await d365ApiClient.getCollection<EnvironmentVariableValue>(
        D365_API_CONFIG.endpoints.environmentVariableValues,
        {
          $filter: `_environmentvariabledefinitionid_value eq ${definitionId}`,
          $select: 'environmentvariablevalueid,value',
          $top: 1,
        },
        'v9.2'
      )

      if (valueResponse.value?.[0]?.value) {
        currentValue = valueResponse.value[0].value
      }
    } catch (error) {
      console.warn('Failed to fetch environment variable value:', error)
      // 即使获取当前值失败，仍然返回默认值
    }

    return {
      defaultValue: definition?.defaultvalue,
      currentValue,
      type: definition?.type ?? 100000000, // Default to String type if undefined
      typeName: ENV_VAR_TYPE_NAMES[definition?.type ?? 100000000] || 'Unknown',
    }
  } catch (error) {
    console.error('Failed to fetch environment variable info:', error)
    throw error
  }
}
