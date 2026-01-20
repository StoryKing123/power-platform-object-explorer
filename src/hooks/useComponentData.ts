// useComponentData Hook - Fetch and manage component data from D365

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Component } from '@/data/mockData'
import type { ApiError, ODataParams, SolutionComponentSummary } from '@/services/api/d365ApiTypes'
import { cacheService } from '@/services/cacheService'
import { handleApiError } from '@/utils/errorHandler'
import { D365_API_CONFIG } from '@/services/api/d365ApiConfig'
import { d365ApiClient } from '@/services/api/d365ApiClient'

// Import services
import { fetchEntities, searchEntities, getEntityCount } from '@/services/dataServices/entityService'
import { fetchApps, searchApps, getAppCount } from '@/services/dataServices/appService'
import { fetchFlows, searchFlows, getFlowCount } from '@/services/dataServices/flowService'
import { fetchSecurityRoles, searchSecurityRoles, getSecurityRoleCount } from '@/services/dataServices/securityRoleService'
import { fetchWebResources, searchWebResources, getWebResourceCount } from '@/services/dataServices/webResourceService'
import { fetchChoices, searchChoices, getChoiceCount } from '@/services/dataServices/choiceService'
import { fetchConnectionReferences, searchConnectionReferences, getConnectionReferenceCount } from '@/services/dataServices/connectionReferenceService'
import { fetchConnectors, searchConnectors, getConnectorCount } from '@/services/dataServices/connectorService'
import { fetchEnvironmentVariables, searchEnvironmentVariables, getEnvironmentVariableCount } from '@/services/dataServices/environmentVariableService'
import { searchComponents, getDefaultSolutionId } from '@/services/dataServices/searchService'
import { getCategoryCount as getSummaryCategoryCount } from '@/services/dataServices/componentCountService'
import type { CategoryCountId } from '@/services/dataServices/componentCountService'

// Import transformers
import { transformSearchResult } from '@/services/transformers/searchTransformer'

interface UseComponentDataResult {
  data: Component[]
  loading: boolean
  error: ApiError | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
  totalCount: number
}

export function useComponentData(
  category: string,
  searchQuery?: string
): UseComponentDataResult {
  const [data, setData] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const requestIdRef = useRef(0)
  const nextLinkRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Fetch data for a specific category
   */
  const fetchCategoryData = useCallback(
    async (): Promise<{ components: Component[]; nextLink?: string }> => {
      const pageSize = D365_API_CONFIG.pagination.defaultPageSize

      try {
        let components: Component[] = []
        let nextLink: string | undefined

        // NEW: If search query exists and is >= 2 chars, use server-side search
        // EXCEPTION: Some categories (flows, workflows) need specialized search to filter correctly
        const useGeneralSearch = searchQuery && searchQuery.trim().length >= 2 && !['flows', 'workflows', 'choices', 'webresources'].includes(category)
        if (useGeneralSearch) {
          console.log('[useComponentData] Using server-side search:', { searchQuery, category, pageSize })
          const response = await searchComponents(searchQuery, category, pageSize, 0)
          components = response.value.map(transformSearchResult)
          nextLink = response['@odata.nextLink']
          return { components, nextLink }
        }

        // EXISTING: Otherwise use current fetch logic (or specialized search for flows/workflows)
        switch (category) {
          case 'all': {
            // Fetch all components in a single query without componenttype filter
            const params: ODataParams = {
              $filter: '',
              $orderby: 'msdyn_displayname asc',
            }

            const solutionId = await getDefaultSolutionId()
            params.$filter = `msdyn_solutionid eq ${solutionId}`

            // Add search filter if provided
            if (searchQuery && searchQuery.trim()) {
              const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
              const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
              params.$filter = `${params.$filter} and ${searchFilter}`
            }

            const response = await d365ApiClient.getCollection<SolutionComponentSummary>(
              D365_API_CONFIG.endpoints.solutionComponentSummaries,
              params,
              'v9.0',
              { maxPageSize: pageSize }
            )

            components = response.value.map(transformSearchResult)
            nextLink = response['@odata.nextLink']
            break
          }

          case 'entities': {
            if (searchQuery) {
              const response = await searchEntities(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchEntities(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'apps': {
            if (searchQuery) {
              const response = await searchApps(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchApps(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'flows': {
            if (searchQuery) {
              const response = await searchFlows(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchFlows(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'securityroles': {
            if (searchQuery) {
              const response = await searchSecurityRoles(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchSecurityRoles(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'webresources': {
            if (searchQuery) {
              const response = await searchWebResources(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchWebResources(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'choices': {
            if (searchQuery) {
              const response = await searchChoices(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchChoices(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'connectionreferences': {
            if (searchQuery) {
              const response = await searchConnectionReferences(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchConnectionReferences(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'connectors': {
            if (searchQuery) {
              const response = await searchConnectors(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchConnectors(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          case 'environmentvariables': {
            if (searchQuery) {
              const response = await searchEnvironmentVariables(searchQuery, pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            } else {
              const response = await fetchEnvironmentVariables(pageSize, 0)
              components = response.value.map(transformSearchResult)
              nextLink = response['@odata.nextLink']
            }
            break
          }

          default:
            components = []
        }

        return { components, nextLink }
      } catch (err) {
        throw handleApiError(err)
      }
    },
    [category, searchQuery]
  )

  /**
   * Fetch category count
   */
  const fetchCategoryCount = useCallback(async (): Promise<number> => {
    try {
      // Check cache first
      const cachedCount = cacheService.getCachedCategoryCount(category)
      if (cachedCount !== null) {
        return cachedCount
      }

      const summarySupportedCategories: CategoryCountId[] = [
        'all',
        'entities',
        'apps',
        'flows',
        'securityroles',
        'webresources',
        'choices',
        'connectionreferences',
        'connectors',
        'environmentvariables',
      ]

      const isSummarySupportedCategory = (value: string): value is CategoryCountId =>
        summarySupportedCategories.includes(value as CategoryCountId)

      let count = 0

      // Prefer msdyn_solutioncomponentcountsummaries (single endpoint for all categories)
      try {
        if (isSummarySupportedCategory(category)) {
          count = await getSummaryCategoryCount(category)
          cacheService.cacheCategoryCount(category, count)
          return count
        }
      } catch (summaryError) {
        console.warn('Failed to get count from msdyn_solutioncomponentcountsummaries, falling back:', summaryError)
      }

      // Fallback to legacy per-category counting
      switch (category) {
        case 'entities':
          count = await getEntityCount()
          break
        case 'apps':
          count = await getAppCount()
          break
        case 'flows':
          count = await getFlowCount()
          break
        case 'securityroles':
          count = await getSecurityRoleCount()
          break
        case 'webresources':
          count = await getWebResourceCount()
          break
        case 'choices':
          count = await getChoiceCount()
          break
        case 'connectionreferences':
          count = await getConnectionReferenceCount()
          break
        case 'connectors':
          count = await getConnectorCount()
          break
        case 'environmentvariables':
          count = await getEnvironmentVariableCount()
          break
        case 'all': {
          // Sum all counts
          const [entities, apps, flows, securityRoles, webResources, choices, connectionReferences, connectors, environmentVariables] = await Promise.all([
            getEntityCount(),
            getAppCount(),
            getFlowCount(),
            getSecurityRoleCount(),
            getWebResourceCount(),
            getChoiceCount(),
            getConnectionReferenceCount(),
            getConnectorCount(),
            getEnvironmentVariableCount(),
          ])
          count = entities + apps + flows + securityRoles + webResources + choices + connectionReferences + connectors + environmentVariables
          break
        }
        default:
          count = 0
      }

      cacheService.cacheCategoryCount(category, count)
      return count
    } catch (err) {
      console.warn('Failed to fetch category count:', err)
      return 0
    }
  }, [category])

  /**
   * Load data (with caching)
   */
  const loadData = useCallback(
    async (page: number = 0, append: boolean = false) => {
      const requestId = ++requestIdRef.current
      setLoading(true)
      setError(null)

      const isStaleRequest = () => requestId !== requestIdRef.current

      try {
        // Check cache first (only for first page without search)
        // 注意：缓存不包含 nextLink，因此仍需要请求一次首屏以启用分页。
        if (page === 0 && !append && !searchQuery) {
          const cachedData = cacheService.getCachedComponentList<Component[]>(category)
          if (cachedData) {
            if (isStaleRequest()) return
            setData(cachedData)
            setHasMore(cachedData.length >= D365_API_CONFIG.pagination.defaultPageSize)
          }
        }

        // Fetch data
        let components: Component[] = []
        let nextLink: string | undefined

        if (append) {
          const next = nextLinkRef.current
          if (!next) {
            setHasMore(false)
            setCurrentPage(page)
            return
          }

          const response = await d365ApiClient.getNextPage<SolutionComponentSummary>(next)
          components = response.value.map(transformSearchResult)
          nextLink = response['@odata.nextLink']
        } else {
          nextLinkRef.current = null
          const result = await fetchCategoryData()
          components = result.components
          nextLink = result.nextLink
        }

        if (isStaleRequest()) return

        nextLinkRef.current = nextLink || null

        // Update state
        if (append) {
          setData(prev => {
            const newData = [...prev, ...components]
            // Update totalCount for search results to reflect actual loaded count
            if (searchQuery && searchQuery.trim()) {
              setTotalCount(newData.length)
            }
            return newData
          })
        } else {
          setData(components)
          // Update totalCount for search results to reflect actual loaded count
          if (searchQuery && searchQuery.trim()) {
            setTotalCount(components.length)
          }
          // Cache first page data
          if (page === 0 && !searchQuery) {
            cacheService.cacheComponentList(category, components)
          }
        }

        if (isStaleRequest()) return

        setHasMore(!!nextLinkRef.current)
        setCurrentPage(page)
      } catch (err) {
        if (isStaleRequest()) return

        setError(handleApiError(err))
        if (!append) {
          setData([])
        }
      } finally {
        if (!isStaleRequest()) {
          setLoading(false)
        }
      }
    },
    [category, fetchCategoryData, searchQuery]
  )

  /**
   * Load more data (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(currentPage + 1, true)
    }
  }, [loading, hasMore, currentPage, loadData])

  /**
   * Refresh data (clear cache and reload)
   */
  const refresh = useCallback(() => {
    cacheService.invalidateCategory(category)
    setCurrentPage(0)
    nextLinkRef.current = null
    loadData(0, false)
  }, [category, loadData])

  /**
   * Cleanup abort controller on unmount or category change
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [category])

  /**
   * Load data when category or search query changes
   */
  useEffect(() => {
    setCurrentPage(0)
    setData([])
    setHasMore(false)
    setError(null)
    loadData(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchQuery])

  /**
   * Fetch category total count asynchronously (only when NOT searching)
   * During search, totalCount is set to loaded results count in loadData()
   */
  useEffect(() => {
    // Reset count to 0 to avoid showing stale data
    setTotalCount(0)

    // Skip fetching category count during search - totalCount will be set to results count
    if (searchQuery && searchQuery.trim()) {
      return
    }

    // Async load count for non-search views
    let cancelled = false

    fetchCategoryCount().then(count => {
      if (!cancelled) {
        setTotalCount(count)
      }
    }).catch(err => {
      console.warn('Failed to fetch category count:', err)
      if (!cancelled) {
        setTotalCount(0)
      }
    })

    return () => {
      cancelled = true
    }
  }, [category, searchQuery, fetchCategoryCount])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    totalCount,
  }
}
