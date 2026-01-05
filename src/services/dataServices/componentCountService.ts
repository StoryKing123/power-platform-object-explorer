// Component Count Service - Fetch category counts using msdyn_solutioncomponentcountsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentCountSummary } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { cacheService } from '../cacheService'

export type CategoryCountId =
  | 'all'
  | 'entities'
  | 'apps'
  | 'flows'
  | 'securityroles'
  | 'choices'
  | 'connectionreferences'
  | 'connectors'
  | 'environmentvariables'

export type CategoryCounts = Record<CategoryCountId, number>

const COUNT_API_VERSION = 'v9.0'
const COUNT_CACHE_TTL_MS = D365_API_CONFIG.cache.categoryCount

let cachedCounts: { value: CategoryCounts; cachedAt: number } | null = null
let pendingFetch: Promise<CategoryCounts> | null = null

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function logicalName(row: SolutionComponentCountSummary): string {
  return String(row.msdyn_componentlogicalname || '').toLowerCase()
}

function computeCategoryCounts(rows: SolutionComponentCountSummary[]): CategoryCounts {
  const entities = rows.reduce((sum, row) => {
    return sum + (row.msdyn_componenttype === 1 || logicalName(row) === 'entity' ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const apps = rows.reduce((sum, row) => {
    const name = logicalName(row)
    const isApp = row.msdyn_componenttype === 80 || row.msdyn_componenttype === 300 || name === 'appmodule' || name === 'canvasapp'
    return sum + (isApp ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const securityroles = rows.reduce((sum, row) => {
    const isRole = row.msdyn_componenttype === 20 || logicalName(row) === 'role'
    return sum + (isRole ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const choices = rows.reduce((sum, row) => {
    const isOptionSet = row.msdyn_componenttype === 9 || logicalName(row) === 'optionset'
    return sum + (isOptionSet ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const connectionreferences = rows.reduce((sum, row) => {
    const isConnectionRef = row.msdyn_componenttype === 10150 || logicalName(row) === 'connectionreference'
    return sum + (isConnectionRef ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const connectors = rows.reduce((sum, row) => {
    const isConnector = row.msdyn_componenttype === 372 || logicalName(row) === 'connector'
    return sum + (isConnector ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const environmentvariables = rows.reduce((sum, row) => {
    const name = logicalName(row)
    const isEnvVar = row.msdyn_componenttype === 380 || row.msdyn_componenttype === 381 || name === 'environmentvariabledefinition' || name === 'environmentvariablevalue'
    return sum + (isEnvVar ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  // Only count flows (category 5 workflows)
  const flows = rows.reduce((sum, row) => {
    const isWorkflow = row.msdyn_componenttype === 29 || logicalName(row) === 'workflow'
    if (!isWorkflow) return sum

    const total = safeNumber(row.msdyn_total)
    if (row.msdyn_workflowcategory === 5) {
      return sum + total
    }

    return sum
  }, 0)

  const all = entities + apps + flows + securityroles + choices + connectionreferences + connectors + environmentvariables

  return {
    all,
    entities,
    apps,
    flows,
    securityroles,
    choices,
    connectionreferences,
    connectors,
    environmentvariables,
  }
}

async function fetchCategoryCountsFromApi(): Promise<CategoryCounts> {
  const solutionId = await getDefaultSolutionId()
  const response = await d365ApiClient.getCollection<SolutionComponentCountSummary>(
    D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
    {
      $select: 'msdyn_componentlogicalname,msdyn_componenttype,msdyn_total,msdyn_workflowcategory,msdyn_subtype',
      $filter: `msdyn_solutionid eq ${solutionId}`,
    },
    COUNT_API_VERSION
  )

  const counts = computeCategoryCounts(response.value || [])

  // Populate per-category cache for fast reads (same TTL as categoryCount)
  ;(Object.keys(counts) as CategoryCountId[]).forEach(category => {
    cacheService.cacheCategoryCount(category, counts[category])
  })

  return counts
}

export async function fetchCategoryCounts(options?: { forceRefresh?: boolean }): Promise<CategoryCounts> {
  const now = Date.now()
  if (!options?.forceRefresh && cachedCounts && now - cachedCounts.cachedAt < COUNT_CACHE_TTL_MS) {
    return cachedCounts.value
  }

  if (pendingFetch) return pendingFetch

  pendingFetch = (async () => {
    try {
      const counts = await fetchCategoryCountsFromApi()
      cachedCounts = { value: counts, cachedAt: Date.now() }
      return counts
    } finally {
      pendingFetch = null
    }
  })()

  return pendingFetch
}

export async function getCategoryCount(category: CategoryCountId): Promise<number> {
  const cached = cacheService.getCachedCategoryCount(category)
  if (cached !== null) return cached

  const counts = await fetchCategoryCounts()
  return counts[category] ?? 0
}

export function clearCategoryCountsCache(): void {
  cachedCounts = null
  pendingFetch = null
}

