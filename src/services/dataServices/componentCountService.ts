// Component Count Service - Fetch category counts using msdyn_solutioncomponentcountsummaries

import { d365ApiClient } from '../api/d365ApiClient'
import { D365_API_CONFIG } from '../api/d365ApiConfig'
import type { SolutionComponentCountSummary } from '../api/d365ApiTypes'
import { getDefaultSolutionId } from './searchService'
import { cacheService } from '../cacheService'

export type CategoryCountId =
  | 'all'
  | 'entities'
  | 'forms'
  | 'views'
  | 'workflows'
  | 'plugins'
  | 'webresources'
  | 'apps'
  | 'flows'
  | 'securityroles'
  | 'choices'

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

  const forms = rows.reduce((sum, row) => {
    const isForm = row.msdyn_componenttype === 60 || row.msdyn_componenttype === 24 || logicalName(row) === 'systemform'
    return sum + (isForm ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const views = rows.reduce((sum, row) => {
    const name = logicalName(row)
    const isView = row.msdyn_componenttype === 26 || name === 'savedquery' || name === 'userquery'
    return sum + (isView ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const plugins = rows.reduce((sum, row) => {
    const name = logicalName(row)
    const isPlugin =
      row.msdyn_componenttype === 91 ||
      row.msdyn_componenttype === 92 ||
      name === 'pluginassembly' ||
      name === 'sdkmessageprocessingstep'
    return sum + (isPlugin ? safeNumber(row.msdyn_total) : 0)
  }, 0)

  const webresources = rows.reduce((sum, row) => {
    const isWebResource = row.msdyn_componenttype === 61 || logicalName(row) === 'webresource'
    return sum + (isWebResource ? safeNumber(row.msdyn_total) : 0)
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

  const { workflows, flows } = rows.reduce(
    (acc, row) => {
      const isWorkflow = row.msdyn_componenttype === 29 || logicalName(row) === 'workflow'
      if (!isWorkflow) return acc

      const total = safeNumber(row.msdyn_total)
      if (row.msdyn_workflowcategory === 5) {
        acc.flows += total
      } else {
        acc.workflows += total
      }

      return acc
    },
    { workflows: 0, flows: 0 }
  )

  const all = entities + forms + views + workflows + plugins + webresources + apps + flows + securityroles + choices

  return {
    all,
    entities,
    forms,
    views,
    workflows,
    plugins,
    webresources,
    apps,
    flows,
    securityroles,
    choices,
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

