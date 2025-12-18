// Environment Service - Retrieve Dynamics 365 Environment ID

import { d365ApiClient } from '../api/d365ApiClient'
import { cacheService } from '../cacheService'

const ENVIRONMENT_CACHE_KEY = 'd365:v9.2:environment:id'
const ENVIRONMENT_CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Response type for RetrieveCurrentOrganization Function
 */
interface RetrieveCurrentOrganizationResponse {
  '@odata.context': string
  Detail: {
    OrganizationId: string
    FriendlyName: string
    OrganizationVersion: string
    EnvironmentId: string
    DatacenterId: string
    Geo: string
    TenantId: string
    UrlName: string
    UniqueName: string
    State: string
    SchemaType: string
    OrganizationType: string
    Endpoints: {
      Count: number
      IsReadOnly: boolean
      Keys: string[]
      Values: string[]
    }
  }
}

/**
 * Get environment ID from D365 RetrieveCurrentOrganization Function
 *
 * This function retrieves the environment ID by calling the RetrieveCurrentOrganization Function.
 * The result is cached for 1 hour to avoid repeated API calls.
 *
 * @returns Promise<string> - The environment ID (OrganizationId)
 * @throws Error if the API call fails or no organization ID is found
 */
export async function getEnvironmentId(): Promise<string> {
  // Check cache first
  const cached = cacheService.get<string>(ENVIRONMENT_CACHE_KEY)
  if (cached) {
    console.log('[EnvironmentService] Using cached environment ID:', cached)
    return cached
  }

  try {
    // Call RetrieveCurrentOrganization Function with AccessType='Default'
    console.log('[EnvironmentService] Fetching environment ID from RetrieveCurrentOrganization Function...')
    const response = await d365ApiClient.get<RetrieveCurrentOrganizationResponse>(
      "RetrieveCurrentOrganization(AccessType='Default')"
    )

    if (!response || !response.Detail) {
      throw new Error('No response from RetrieveCurrentOrganization')
    }

    const environmentId = response.Detail.EnvironmentId

    if (!environmentId) {
      throw new Error('Environment ID is missing from the response')
    }

    // Cache the result
    cacheService.set(ENVIRONMENT_CACHE_KEY, environmentId, ENVIRONMENT_CACHE_TTL)
    console.log('[EnvironmentService] Environment ID retrieved and cached:', environmentId)
    console.log('[EnvironmentService] Organization details:', {
      friendlyName: response.Detail.FriendlyName,
      organizationType: response.Detail.OrganizationType,
      state: response.Detail.State
    })

    return environmentId
  } catch (error) {
    console.error('[EnvironmentService] Failed to get environment ID:', error)
    throw new Error('Failed to retrieve environment ID from Dynamics 365 API')
  }
}

/**
 * Clear cached environment ID
 * Useful for forcing a refresh of the environment ID
 */
export function clearEnvironmentIdCache(): void {
  cacheService.invalidate(ENVIRONMENT_CACHE_KEY)
  console.log('[EnvironmentService] Environment ID cache cleared')
}
