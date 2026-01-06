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
export type CategoryComponentTypes = Partial<Record<CategoryCountId, number[]>>

const COUNT_API_VERSION = 'v9.0'
const COUNT_CACHE_TTL_MS = D365_API_CONFIG.cache.categoryCount

let cachedCounts: { value: CategoryCounts; types: CategoryComponentTypes; cachedAt: number } | null = null
let pendingFetch: Promise<CategoryCounts> | null = null

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function logicalName(row: SolutionComponentCountSummary): string {
  return String(row.msdyn_componentlogicalname || '').toLowerCase()
}

function computeCategoryCounts(rows: SolutionComponentCountSummary[]): { counts: CategoryCounts; types: CategoryComponentTypes } {
  const typeSets: Record<CategoryCountId, Set<number>> = {
    all: new Set<number>(),
    entities: new Set<number>(),
    apps: new Set<number>(),
    flows: new Set<number>(),
    securityroles: new Set<number>(),
    choices: new Set<number>(),
    connectionreferences: new Set<number>(),
    connectors: new Set<number>(),
    environmentvariables: new Set<number>(),
  }

  const counts: CategoryCounts = {
    all: 0,
    entities: 0,
    apps: 0,
    flows: 0,
    securityroles: 0,
    choices: 0,
    connectionreferences: 0,
    connectors: 0,
    environmentvariables: 0,
  }

  function categorize(row: SolutionComponentCountSummary): CategoryCountId[] {
    const categories: CategoryCountId[] = []
    const name = logicalName(row)
    const type = row.msdyn_componenttype
    const total = safeNumber(row.msdyn_total)

    if (type === 1 || name === 'entity') {
      counts.entities += total
      categories.push('entities')
    }

    if (type === 80 || type === 300 || name === 'appmodule' || name === 'canvasapp') {
      counts.apps += total
      categories.push('apps')
    }

    if (type === 20 || name === 'role') {
      counts.securityroles += total
      categories.push('securityroles')
    }

    if (type === 9 || name === 'optionset') {
      counts.choices += total
      categories.push('choices')
    }

    if (type === 10150 || name === 'connectionreference') {
      counts.connectionreferences += total
      categories.push('connectionreferences')
    }

    if (type === 372 || name === 'connector') {
      counts.connectors += total
      categories.push('connectors')
    }

    const isEnvVar = type === 380 || type === 381 || name === 'environmentvariabledefinition' || name === 'environmentvariablevalue'
    if (isEnvVar) {
      counts.environmentvariables += total
      categories.push('environmentvariables')
    }

    const isWorkflow = type === 29 || name === 'workflow'
    const isFlowCategory = row.msdyn_workflowcategory === 5 || row.msdyn_workflowcategory === '5'
    if (isWorkflow && isFlowCategory) {
      counts.flows += total
      categories.push('flows')
    }

    return categories
  }

  rows.forEach(row => {
    const categories = categorize(row)
    if (categories.length === 0) return

    const type = typeof row.msdyn_componenttype === 'number' ? row.msdyn_componenttype : null
    categories.forEach(category => {
      if (type !== null) {
        typeSets[category].add(type)
        typeSets.all.add(type)
      }
    })
  })

  counts.all =
    counts.entities +
    counts.apps +
    counts.flows +
    counts.securityroles +
    counts.choices +
    counts.connectionreferences +
    counts.connectors +
    counts.environmentvariables

  const types: CategoryComponentTypes = {}
  ;(Object.keys(typeSets) as CategoryCountId[]).forEach(category => {
    if (typeSets[category].size > 0) {
      types[category] = Array.from(typeSets[category])
    }
  })

  return { counts, types }
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

  const { counts, types } = computeCategoryCounts(response.value || [])

  // Populate per-category cache for fast reads (same TTL as categoryCount)
  ;(Object.keys(counts) as CategoryCountId[]).forEach(category => {
    cacheService.cacheCategoryCount(category, counts[category])
  })
  cachedCounts = {
    value: counts,
    types,
    cachedAt: Date.now(),
  }

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

async function ensureCategoryTypesLoaded(): Promise<void> {
  const now = Date.now()
  if (cachedCounts && now - cachedCounts.cachedAt < COUNT_CACHE_TTL_MS) return
  await fetchCategoryCounts()
}

export async function getCategoryComponentTypes(category: CategoryCountId): Promise<number[] | undefined> {
  try {
    await ensureCategoryTypesLoaded()
    return cachedCounts?.types[category]
  } catch (error) {
    console.warn('Failed to load category component types:', error)
    return undefined
  }
}

export function buildComponentTypeFilter(types?: number[]): string | null {
  if (!types || types.length === 0) return null
  if (types.length === 1) return `msdyn_componenttype eq ${types[0]}`
  return `(${types.map(type => `msdyn_componenttype eq ${type}`).join(' or ')})`
}

export async function getCategoryTypeFilter(category: CategoryCountId, fallbackTypes: number[]): Promise<string> {
  const types = (await getCategoryComponentTypes(category)) ?? fallbackTypes
  return buildComponentTypeFilter(types) ?? buildComponentTypeFilter(fallbackTypes) ?? ''
}
