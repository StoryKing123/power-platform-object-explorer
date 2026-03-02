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
  | 'webresources'
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
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function logicalName(row: SolutionComponentCountSummary): string {
  return String(row.msdyn_componentlogicalname || '').toLowerCase()
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizeLogicalName(row: SolutionComponentCountSummary): string {
  return normalizeToken(logicalName(row))
}

function safeType(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function matchesLogicalName(name: string, aliases: string[]): boolean {
  if (!name) return false
  return aliases.some(alias => name === alias || name.endsWith(alias))
}

function computeCategoryCounts(rows: SolutionComponentCountSummary[]): { counts: CategoryCounts; types: CategoryComponentTypes } {
  const typeSets: Record<CategoryCountId, Set<number>> = {
    all: new Set<number>(),
    entities: new Set<number>(),
    apps: new Set<number>(),
    flows: new Set<number>(),
    securityroles: new Set<number>(),
    webresources: new Set<number>(),
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
    webresources: 0,
    choices: 0,
    connectionreferences: 0,
    connectors: 0,
    environmentvariables: 0,
  }

  function categorize(row: SolutionComponentCountSummary): CategoryCountId[] {
    const categories: CategoryCountId[] = []
    const normalizedName = normalizeLogicalName(row)
    const type = safeType(row.msdyn_componenttype)
    const total = safeNumber(row.msdyn_total)
    const workflowCategory = safeType(row.msdyn_workflowcategory)

    if (type === 1 || matchesLogicalName(normalizedName, ['entity', 'table'])) {
      counts.entities += total
      categories.push('entities')
    }

    if (type === 80 || type === 300 || matchesLogicalName(normalizedName, ['appmodule', 'canvasapp', 'modeldrivenapp'])) {
      counts.apps += total
      categories.push('apps')
    }

    if (type === 20 || matchesLogicalName(normalizedName, ['role', 'securityrole'])) {
      counts.securityroles += total
      categories.push('securityroles')
    }

    if (type === 61 || matchesLogicalName(normalizedName, ['webresource'])) {
      counts.webresources += total
      categories.push('webresources')
    }

    if (type === 9 || matchesLogicalName(normalizedName, ['optionset', 'globaloptionset', 'globaloptionsetdefinition', 'choice'])) {
      counts.choices += total
      categories.push('choices')
    }

    if (type === 10150 || matchesLogicalName(normalizedName, ['connectionreference'])) {
      counts.connectionreferences += total
      categories.push('connectionreferences')
    }

    if (type === 372 || matchesLogicalName(normalizedName, ['connector', 'customconnector'])) {
      counts.connectors += total
      categories.push('connectors')
    }

    const isEnvVar =
      type === 380 ||
      type === 381 ||
      matchesLogicalName(normalizedName, ['environmentvariabledefinition', 'environmentvariablevalue', 'environmentvariable'])
    if (isEnvVar) {
      counts.environmentvariables += total
      categories.push('environmentvariables')
    }

    const isWorkflow = type === 29 || matchesLogicalName(normalizedName, ['workflow', 'flow'])
    const isFlowCategory = workflowCategory === 5
    if (isWorkflow && isFlowCategory) {
      counts.flows += total
      categories.push('flows')
    }

    return categories
  }

  rows.forEach(row => {
    const categories = categorize(row)
    if (categories.length === 0) return

    const type = safeType(row.msdyn_componenttype)
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
    counts.webresources +
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
  const response = await d365ApiClient.getAllCollection<SolutionComponentCountSummary>(
    D365_API_CONFIG.endpoints.solutionComponentCountSummaries,
    {
      $select: 'msdyn_componentlogicalname,msdyn_componenttype,msdyn_total,msdyn_workflowcategory,msdyn_subtype',
      $filter: `msdyn_solutionid eq ${solutionId}`,
    },
    COUNT_API_VERSION,
    { maxPageSize: D365_API_CONFIG.pagination.maxPageSize }
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
  const detectedTypes = await getCategoryComponentTypes(category)
  // Prefer environment-detected types; only fall back when detection is unavailable.
  // Mixing detected and fallback values can introduce invalid componenttype codes in some environments.
  if (detectedTypes && detectedTypes.length > 0) {
    return buildComponentTypeFilter(detectedTypes) ?? ''
  }
  return buildComponentTypeFilter(fallbackTypes) ?? ''
}
