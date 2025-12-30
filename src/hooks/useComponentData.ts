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
import { fetchForms, searchForms, getFormCount } from '@/services/dataServices/formService'
import { fetchAllViews, searchSystemViews, searchPersonalViews, getViewCount } from '@/services/dataServices/viewService'
import { fetchWorkflows, searchWorkflows, getWorkflowCount } from '@/services/dataServices/workflowService'
import { fetchAllPlugins, searchPluginAssemblies, searchPluginSteps, getPluginCount } from '@/services/dataServices/pluginService'
import { fetchWebResources, searchWebResources, getWebResourceCount } from '@/services/dataServices/webResourceService'
import { fetchApps, searchApps, getAppCount } from '@/services/dataServices/appService'
import { fetchFlows, searchFlows, getFlowCount } from '@/services/dataServices/flowService'
import { fetchSecurityRoles, searchSecurityRoles, getSecurityRoleCount } from '@/services/dataServices/securityRoleService'
import { fetchChoices, searchChoices, getChoiceCount } from '@/services/dataServices/choiceService'
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
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Fetch data for a specific category
   */
  const fetchCategoryData = useCallback(
    async (page: number = 0): Promise<Component[]> => {
      const pageSize = D365_API_CONFIG.pagination.defaultPageSize
      const skip = page * pageSize

      try {
        let components: Component[] = []

        // NEW: If search query exists and is >= 2 chars, use server-side search
        // EXCEPTION: Some categories (flows, workflows) need specialized search to filter correctly
        const useGeneralSearch = searchQuery && searchQuery.trim().length >= 2 && !['flows', 'workflows', 'choices'].includes(category)
        if (useGeneralSearch) {
          console.log('[useComponentData] Using server-side search:', { searchQuery, category, pageSize, skip })
          const response = await searchComponents(searchQuery, category, pageSize, skip)
          console.log('[useComponentData] Search response:', response)
          components = response.value.map(transformSearchResult)
          console.log('[useComponentData] Transformed components:', components)
          setHasMore(!!response['@odata.nextLink'])
          return components
        }

        // EXISTING: Otherwise use current fetch logic (or specialized search for flows/workflows)
        switch (category) {
          case 'all': {
            // Fetch all components in a single query without componenttype filter
            const solutionId = await getDefaultSolutionId()

            const params: ODataParams = {
              $filter: `msdyn_solutionid eq ${solutionId}`,
              $orderby: 'msdyn_displayname asc',
              $top: pageSize,
            }

            // Add search filter if provided
            if (searchQuery && searchQuery.trim()) {
              const sanitizedQuery = searchQuery.replace(/'/g, "''").trim()
              const searchFilter = `(contains(msdyn_name, '${sanitizedQuery}') or contains(msdyn_displayname, '${sanitizedQuery}'))`
              params.$filter = `${params.$filter} and ${searchFilter}`
            }

            const response = await d365ApiClient.getCollection<SolutionComponentSummary>(
              D365_API_CONFIG.endpoints.solutionComponentSummaries,
              params,
              'v9.0'
            )

            components = response.value.map(transformSearchResult)
            setHasMore(!!response['@odata.nextLink'])
            break
          }

          case 'entities': {
            if (searchQuery) {
              const response = await searchEntities(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchEntities(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'forms': {
            if (searchQuery) {
              const response = await searchForms(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchForms(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'views': {
            if (searchQuery) {
              const [systemResponse, personalResponse] = await Promise.all([
                searchSystemViews(searchQuery, Math.floor(pageSize / 2), skip),
                searchPersonalViews(searchQuery, Math.floor(pageSize / 2), skip),
              ])
              components = [
                ...systemResponse.value.map(transformSearchResult),
                ...personalResponse.value.map(transformSearchResult),
              ]
              setHasMore(!!systemResponse['@odata.nextLink'] || !!personalResponse['@odata.nextLink'])
            } else {
              const response = await fetchAllViews(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'workflows': {
            if (searchQuery) {
              const response = await searchWorkflows(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchWorkflows(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'plugins': {
            if (searchQuery) {
              const [assembliesResponse, stepsResponse] = await Promise.all([
                searchPluginAssemblies(searchQuery, Math.floor(pageSize / 2), skip),
                searchPluginSteps(searchQuery, Math.floor(pageSize / 2), skip),
              ])
              components = [
                ...assembliesResponse.value.map(transformSearchResult),
                ...stepsResponse.value.map(transformSearchResult),
              ]
              setHasMore(!!assembliesResponse['@odata.nextLink'] || !!stepsResponse['@odata.nextLink'])
            } else {
              const response = await fetchAllPlugins(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'webresources': {
            if (searchQuery) {
              const response = await searchWebResources(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchWebResources(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'apps': {
            if (searchQuery) {
              const response = await searchApps(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchApps(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'flows': {
            if (searchQuery) {
              const response = await searchFlows(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchFlows(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'securityroles': {
            if (searchQuery) {
              const response = await searchSecurityRoles(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchSecurityRoles(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          case 'choices': {
            if (searchQuery) {
              const response = await searchChoices(searchQuery, pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            } else {
              const response = await fetchChoices(pageSize, skip)
              components = response.value.map(transformSearchResult)
              setHasMore(!!response['@odata.nextLink'])
            }
            break
          }

          default:
            components = []
        }

        return components
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
        'forms',
        'views',
        'workflows',
        'plugins',
        'webresources',
        'apps',
        'flows',
        'securityroles',
        'choices',
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
        case 'forms':
          count = await getFormCount()
          break
        case 'views':
          count = await getViewCount()
          break
        case 'workflows':
          count = await getWorkflowCount()
          break
        case 'plugins':
          count = await getPluginCount()
          break
        case 'webresources':
          count = await getWebResourceCount()
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
        case 'choices':
          count = await getChoiceCount()
          break
        case 'all': {
          // Sum all counts
          const [entities, forms, views, workflows, plugins, webResources, apps, flows, securityRoles, choices] = await Promise.all([
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
          count = entities + forms + views + workflows + plugins + webResources + apps + flows + securityRoles + choices
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
      setLoading(true)
      setError(null)

      try {
        // Check cache first (only for first page without search)
        if (page === 0 && !searchQuery) {
          const cachedData = cacheService.getCachedComponentList<Component[]>(category)
          if (cachedData) {
            setData(cachedData)
            setLoading(false)
            setHasMore(cachedData.length >= D365_API_CONFIG.pagination.defaultPageSize)
            return
          }
        }

        // Fetch data
        const components = await fetchCategoryData(page)

        // Update state
        if (append) {
          setData(prev => [...prev, ...components])
        } else {
          setData(components)
          // Cache first page data
          if (page === 0 && !searchQuery) {
            cacheService.cacheComponentList(category, components)
          }
        }

        setCurrentPage(page)
      } catch (err) {
        setError(handleApiError(err))
        if (!append) {
          setData([])
        }
      } finally {
        setLoading(false)
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
    loadData(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchQuery])

  /**
   * Fetch total count
   */
  useEffect(() => {
    fetchCategoryCount().then(setTotalCount)
  }, [category, fetchCategoryCount])

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
