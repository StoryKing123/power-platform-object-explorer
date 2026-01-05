// Shared helpers for building safe/robust OData search filters

/**
 * Escapes a user-provided string for safe usage inside OData string literals: '...'
 */
export function sanitizeODataStringLiteral(value: string): string {
  return value
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .trim()
}

/**
 * Extract a GUID from arbitrary user input.
 *
 * Supports inputs like:
 * - 00000000-0000-0000-0000-000000000000
 * - {00000000-0000-0000-0000-000000000000}
 * - .../workflows(00000000-0000-0000-0000-000000000000)
 */
export function extractGuidFromQuery(query: string): string | null {
  const match = query.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
  return match ? match[0].toLowerCase() : null
}

