// D365 Web API Client

import { D365_API_CONFIG } from './d365ApiConfig'
import type { ODataParams, ODataResponse, ApiError, ApiErrorResponse } from './d365ApiTypes'

class D365ApiClient {
  private baseUrl: string
  private timeout: number
  private pendingRequests: Map<string, Promise<any>>

  constructor() {
    this.baseUrl = D365_API_CONFIG.baseUrl
    this.timeout = D365_API_CONFIG.timeout
    this.pendingRequests = new Map()
  }

  /**
   * Build full URL with OData query parameters
   */
  private buildUrl(endpoint: string, params?: ODataParams, apiVersion?: string): string {
    // Use provided version or extract from baseUrl, default to v9.2
    const version = apiVersion || this.baseUrl.match(/v\d+\.\d+/)?.[0] || 'v9.2'
    const baseUrlWithVersion = this.baseUrl.replace(/v\d+\.\d+/, version)

    const url = new URL(endpoint, window.location.origin + baseUrlWithVersion)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Get standard headers for D365 Web API requests
   */
  private getHeaders(maxPageSize?: number): HeadersInit {
    const effectivePageSize = maxPageSize ?? D365_API_CONFIG.pagination.defaultPageSize
    return {
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Content-Type': 'application/json',
      // D365 uses server-driven paging; @odata.nextLink is returned when more data exists.
      // $top limits total results and can suppress nextLink, so use Prefer to control page size.
      'Prefer': `odata.maxpagesize=${effectivePageSize}`,
    }
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      await this.handleError(response)
    }

    const data = await response.json()
    return data as T
  }

  /**
   * Handle API errors and throw appropriate ApiError
   */
  private async handleError(response: Response): Promise<never> {
    let errorDetails: ApiErrorResponse | null = null

    try {
      errorDetails = await response.json()
    } catch {
      // Response body is not JSON
    }

    const error: ApiError = {
      type: this.classifyError(response.status),
      message: this.getErrorMessage(response.status, errorDetails),
      details: errorDetails,
      statusCode: response.status,
      retryable: this.isRetryable(response.status),
    }

    throw error
  }

  /**
   * Classify error type based on status code
   */
  private classifyError(statusCode: number): ApiError['type'] {
    if (statusCode === 401 || statusCode === 403) {
      return 'auth'
    } else if (statusCode === 404) {
      return 'notfound'
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'validation'
    } else if (statusCode >= 500) {
      return 'server'
    }
    return 'network'
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(statusCode: number, errorDetails: ApiErrorResponse | null): string {
    if (errorDetails?.error?.message) {
      return errorDetails.error.message
    }

    switch (statusCode) {
      case 401:
      case 403:
        return "You don't have permission to access this data"
      case 404:
        return "Component not found"
      case 500:
      case 503:
        return "Server error. Please try again later"
      default:
        return `Request failed with status ${statusCode}`
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(statusCode: number): boolean {
    // Retry on server errors and rate limiting
    return statusCode >= 500 || statusCode === 429
  }

  /**
   * Implement exponential backoff retry logic
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = D365_API_CONFIG.retry.maxRetries
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && (error as ApiError).retryable) {
        const delay = Math.min(
          D365_API_CONFIG.retry.initialDelay *
          Math.pow(D365_API_CONFIG.retry.backoffMultiplier, D365_API_CONFIG.retry.maxRetries - retries),
          D365_API_CONFIG.retry.maxDelay
        )

        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retryWithBackoff(fn, retries - 1)
      }
      throw error
    }
  }

  /**
   * Implement request deduplication
   */
  private async deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request and store it
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  /**
   * Make GET request with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = {
          type: 'network',
          message: 'Request timed out. Please try again',
          retryable: true,
        }
        throw timeoutError
      }

      // Network error
      const networkError: ApiError = {
        type: 'network',
        message: 'Connection lost. Check your internet connection',
        retryable: true,
      }
      throw networkError
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Generic GET method for fetching data
   */
  async get<T>(
    endpoint: string,
    params?: ODataParams,
    apiVersion?: string,
    options?: { maxPageSize?: number }
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params, apiVersion)
    const requestKey = url

    return this.deduplicateRequest(requestKey, () =>
      this.retryWithBackoff(async () => {
        const response = await this.fetchWithTimeout(url, {
          method: 'GET',
          headers: this.getHeaders(options?.maxPageSize),
        })

        return this.handleResponse<T>(response)
      })
    )
  }

  /**
   * Fetch OData collection with pagination support
   */
  async getCollection<T>(
    endpoint: string,
    params?: ODataParams,
    apiVersion?: string,
    options?: { maxPageSize?: number }
  ): Promise<ODataResponse<T>> {
    return this.get<ODataResponse<T>>(endpoint, params, apiVersion, options)
  }

  /**
   * Fetch single entity by ID
   */
  async getById<T>(endpoint: string, id: string, params?: ODataParams): Promise<T> {
    const fullEndpoint = `${endpoint}(${id})`
    return this.get<T>(fullEndpoint, params)
  }

  /**
   * Fetch next page using @odata.nextLink
   */
  async getNextPage<T>(nextLink: string): Promise<ODataResponse<T>> {
    // nextLink is a full URL, so we need to extract the path and query
    const url = new URL(nextLink)
    const pathAndQuery = url.pathname + url.search

    return this.retryWithBackoff(async () => {
      const response = await this.fetchWithTimeout(nextLink, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      return this.handleResponse<ODataResponse<T>>(response)
    })
  }
}

// Export singleton instance
export const d365ApiClient = new D365ApiClient()
