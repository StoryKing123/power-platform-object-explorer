// Error Handler Utility

import type { ApiError } from '@/services/api/d365ApiTypes'

/**
 * Handle API error and return user-friendly message
 */
export function handleApiError(error: any): ApiError {
  // If it's already an ApiError, return it
  if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
    return error as ApiError
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Connection lost. Check your internet connection',
      retryable: true,
    }
  }

  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      type: 'network',
      message: 'Request timed out. Please try again',
      retryable: true,
    }
  }

  // Generic error
  return {
    type: 'server',
    message: error?.message || 'An unexpected error occurred',
    details: error,
    retryable: false,
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: ApiError): string {
  return error.message
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  return error.retryable
}

/**
 * Get error type for logging/analytics
 */
export function getErrorType(error: ApiError): string {
  return error.type
}

/**
 * Format error for toast notification
 */
export function formatErrorForToast(error: ApiError): {
  title: string
  description: string
  variant: 'destructive' | 'default'
} {
  const titles: Record<ApiError['type'], string> = {
    network: 'Connection Error',
    auth: 'Permission Denied',
    server: 'Server Error',
    validation: 'Validation Error',
    notfound: 'Not Found',
  }

  return {
    title: titles[error.type] || 'Error',
    description: error.message,
    variant: 'destructive',
  }
}

/**
 * Log error to console (can be extended to send to logging service)
 */
export function logError(error: ApiError, context?: string): void {
  const logMessage = context ? `[${context}] ${error.message}` : error.message

  console.error(logMessage, {
    type: error.type,
    statusCode: error.statusCode,
    retryable: error.retryable,
    details: error.details,
  })
}
