// Cache Service - Browser-based caching for D365 data

import { D365_API_CONFIG } from './api/d365ApiConfig'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: string
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>>
  private version: string
  private enabled: boolean

  constructor() {
    this.memoryCache = new Map()
    this.version = D365_API_CONFIG.apiVersion
    // 默认启用缓存，可以通过 setEnabled() 方法切换
    this.enabled = false
  }

  /**
   * 启用或禁用缓存
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    console.log(`Cache ${enabled ? 'enabled' : 'disabled'}`)

    // 如果禁用缓存，清空所有缓存
    if (!enabled) {
      this.clear()
    }
  }

  /**
   * 检查缓存是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Generate cache key
   */
  private generateKey(category: string, filters?: string): string {
    const filterPart = filters ? `:${filters}` : ''
    return `d365:${this.version}:${category}${filterPart}`
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now()
    return now - entry.timestamp < entry.ttl && entry.version === this.version
  }

  /**
   * Get data from cache (memory -> sessionStorage -> localStorage)
   */
  get<T>(key: string): T | null {
    // 如果缓存被禁用，直接返回 null
    if (!this.enabled) {
      return null
    }

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data as T
    }

    // Check sessionStorage
    try {
      const sessionData = sessionStorage.getItem(key)
      if (sessionData) {
        const entry: CacheEntry<T> = JSON.parse(sessionData)
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry)
          return entry.data
        } else {
          // Remove expired entry
          sessionStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error)
    }

    // Check localStorage
    try {
      const localData = localStorage.getItem(key)
      if (localData) {
        const entry: CacheEntry<T> = JSON.parse(localData)
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry)
          return entry.data
        } else {
          // Remove expired entry
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }

    return null
  }

  /**
   * Set data in cache (memory + sessionStorage + localStorage)
   */
  set<T>(key: string, data: T, ttl: number): void {
    // 如果缓存被禁用，直接返回，不存储任何数据
    if (!this.enabled) {
      return
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.version,
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)

    // Store in sessionStorage
    try {
      sessionStorage.setItem(key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to write to sessionStorage:', error)
      // If quota exceeded, clear old entries
      this.clearOldEntries('session')
      try {
        sessionStorage.setItem(key, JSON.stringify(entry))
      } catch {
        // Still failed, skip sessionStorage
      }
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to write to localStorage:', error)
      // If quota exceeded, clear old entries
      this.clearOldEntries('local')
      try {
        localStorage.setItem(key, JSON.stringify(entry))
      } catch {
        // Still failed, skip localStorage
      }
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key)
    try {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from storage:', error)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.memoryCache.clear()

    // Clear all d365 entries from storage
    try {
      const keysToRemove: string[] = []

      // SessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key?.startsWith('d365:')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))

      // LocalStorage
      keysToRemove.length = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('d365:')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }

  /**
   * Clear old/expired entries from storage
   */
  private clearOldEntries(storageType: 'session' | 'local'): void {
    const storage = storageType === 'session' ? sessionStorage : localStorage

    try {
      const keysToRemove: string[] = []
      const now = Date.now()

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith('d365:')) {
          try {
            const data = storage.getItem(key)
            if (data) {
              const entry: CacheEntry<any> = JSON.parse(data)
              // Remove if expired or old version
              if (now - entry.timestamp >= entry.ttl || entry.version !== this.version) {
                keysToRemove.push(key)
              }
            }
          } catch {
            // Invalid entry, remove it
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => storage.removeItem(key))
    } catch (error) {
      console.warn('Failed to clear old entries:', error)
    }
  }

  /**
   * Get cache key for component list
   */
  getComponentListKey(category: string, searchQuery?: string): string {
    const filters = searchQuery ? `search:${searchQuery}` : ''
    return this.generateKey(`components:${category}`, filters)
  }

  /**
   * Get cache key for component detail
   */
  getComponentDetailKey(id: string): string {
    return this.generateKey(`component:${id}`)
  }

  /**
   * Get cache key for category count
   */
  getCategoryCountKey(category: string): string {
    return this.generateKey(`count:${category}`)
  }

  /**
   * Cache component list
   */
  cacheComponentList<T>(category: string, data: T, searchQuery?: string): void {
    const key = this.getComponentListKey(category, searchQuery)
    this.set(key, data, D365_API_CONFIG.cache.componentList)
  }

  /**
   * Get cached component list
   */
  getCachedComponentList<T>(category: string, searchQuery?: string): T | null {
    const key = this.getComponentListKey(category, searchQuery)
    return this.get<T>(key)
  }

  /**
   * Cache component detail
   */
  cacheComponentDetail<T>(id: string, data: T): void {
    const key = this.getComponentDetailKey(id)
    this.set(key, data, D365_API_CONFIG.cache.componentDetail)
  }

  /**
   * Get cached component detail
   */
  getCachedComponentDetail<T>(id: string): T | null {
    const key = this.getComponentDetailKey(id)
    return this.get<T>(key)
  }

  /**
   * Cache category count
   */
  cacheCategoryCount(category: string, count: number): void {
    const key = this.getCategoryCountKey(category)
    this.set(key, count, D365_API_CONFIG.cache.categoryCount)
  }

  /**
   * Get cached category count
   */
  getCachedCategoryCount(category: string): number | null {
    const key = this.getCategoryCountKey(category)
    return this.get<number>(key)
  }

  /**
   * Invalidate all caches for a category
   */
  invalidateCategory(category: string): void {
    // Clear memory cache entries for this category
    const keysToDelete: string[] = []
    this.memoryCache.forEach((_, key) => {
      if (key.includes(`:${category}`) || key.includes(`:components:${category}`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.memoryCache.delete(key))

    // Clear storage entries for this category
    try {
      const storages = [sessionStorage, localStorage]
      storages.forEach(storage => {
        const keysToRemove: string[] = []
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i)
          if (key && (key.includes(`:${category}`) || key.includes(`:components:${category}`))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => storage.removeItem(key))
      })
    } catch (error) {
      console.warn('Failed to invalidate category cache:', error)
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()
