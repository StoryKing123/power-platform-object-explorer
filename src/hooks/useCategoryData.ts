// useCategoryData Hook - Fetch and manage category data

import { useState, useEffect, useCallback } from 'react'
import type { Category } from '@/data/mockData'
import type { ApiError } from '@/services/api/d365ApiTypes'
import { fetchCategories } from '@/services/dataServices/categoryService'
import { handleApiError } from '@/utils/errorHandler'
import { cacheService } from '@/services/cacheService'

interface UseCategoryDataResult {
  categories: Category[]
  loading: boolean
  error: ApiError | null
  refresh: () => void
}

const CATEGORY_CACHE_KEY = 'categories'
const CATEGORY_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * Custom hook to fetch and manage category data
 */
export function useCategoryData(): UseCategoryDataResult {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)

  /**
   * Load categories from API or cache
   */
  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cachedCategories = cacheService.getCachedComponentList<Category[]>(CATEGORY_CACHE_KEY)
      if (cachedCategories) {
        setCategories(cachedCategories)
        setLoading(false)
        return
      }

      // Fetch from API
      const fetchedCategories = await fetchCategories()
      setCategories(fetchedCategories)

      // Cache the result
      cacheService.cacheComponentList(CATEGORY_CACHE_KEY, fetchedCategories)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError)

      // Fallback to default categories on error
      setCategories(getDefaultCategories())
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Refresh categories (clear cache and reload)
   */
  const refresh = useCallback(() => {
    cacheService.invalidateCategory(CATEGORY_CACHE_KEY)
    loadCategories()
  }, [loadCategories])

  /**
   * Load categories on mount
   */
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  return {
    categories,
    loading,
    error,
    refresh,
  }
}

/**
 * Get default categories as fallback
 */
function getDefaultCategories(): Category[] {
  return [
    { id: 'all', name: 'All Components', icon: 'LayoutGrid', count: 0 },
    { id: 'entities', name: 'Entities', icon: 'Database', count: 0 },
    { id: 'apps', name: 'Apps', icon: 'Package', count: 0 },
    { id: 'flows', name: 'Flows', icon: 'Zap', count: 0 },
    { id: 'securityroles', name: 'Security Roles', icon: 'Shield', count: 0 },
    { id: 'webresources', name: 'Web Resources', icon: 'Globe', count: 0 },
    { id: 'choices', name: 'Choices', icon: 'List', count: 0 },
    { id: 'connectionreferences', name: 'Connection References', icon: 'Link', count: 0 },
    { id: 'connectors', name: 'Custom Connectors', icon: 'Plug', count: 0 },
    { id: 'environmentvariables', name: 'Environment Variables', icon: 'Variable', count: 0 },
  ]
}
