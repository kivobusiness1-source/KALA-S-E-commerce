'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'

interface ErrorHandlerOptions {
  /** Default error message when error has no message */
  defaultMessage?: string
  /** Whether to show toast notifications automatically */
  showToast?: boolean
  /** Custom toast title */
  toastTitle?: string
  /** Callback on error */
  onError?: (error: Error) => void
}

interface ErrorHandlerResult<T> {
  /** The error, if any */
  error: Error | null
  /** Whether an operation is in progress */
  loading: boolean
  /** Execute an async operation with automatic error handling */
  execute: (operation: () => Promise<T>) => Promise<T | undefined>
  /** Clear the current error */
  clearError: () => void
  /** Whether there is an error */
  hasError: boolean
}

/**
 * Hook for handling async operations with loading state and error handling.
 *
 * @example
 * ```tsx
 * const { execute, loading, error } = useErrorHandler<Order>()
 *
 * const handleSubmit = () => {
 *   execute(async () => {
 *     const res = await fetch('/api/orders', { method: 'POST', body: ... })
 *     if (!res.ok) throw new Error('Order failed')
 *     return res.json()
 *   })
 * }
 * ```
 */
export function useErrorHandler<T = void>(
  options: ErrorHandlerOptions = {}
): ErrorHandlerResult<T> {
  const {
    defaultMessage = 'Une erreur inattendue est survenue',
    showToast = true,
    toastTitle,
    onError,
  } = options

  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      clearError()
      setLoading(true)

      try {
        const result = await operation()
        return result
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err) || defaultMessage)
        setError(error)

        if (showToast) {
          if (toastTitle) {
            toast.error(toastTitle, { description: error.message })
          } else {
            toast.error(error.message)
          }
        }

        onError?.(error)
        return undefined
      } finally {
        setLoading(false)
      }
    },
    [clearError, defaultMessage, showToast, toastTitle, onError]
  )

  return {
    error,
    loading,
    execute,
    clearError,
    hasError: error !== null,
  }
}

/**
 * Hook for handling API fetch calls with standardized error processing.
 */
export function useApiCall<T = unknown>() {
  const { execute, loading, error, clearError, hasError } = useErrorHandler<T>({
    showToast: false, // We'll handle toasts manually based on response
  })

  const call = useCallback(
    async (url: string, options?: RequestInit): Promise<T | undefined> => {
      return execute(async () => {
        const response = await fetch(url, options)

        if (!response.ok) {
          let message = 'Une erreur est survenue'
          try {
            const data = await response.json()
            message = data?.error?.message || data?.message || message
          } catch {
            // Use default message
          }

          // Show appropriate toast based on status
          if (response.status === 401) {
            toast.error('Session expirée', {
              description: 'Veuillez vous reconnecter.',
            })
          } else if (response.status === 403) {
            toast.error('Accès refusé')
          } else if (response.status === 429) {
            toast.error('Trop de requêtes', {
              description: 'Veuillez patienter avant de réessayer.',
            })
          } else if (response.status >= 500) {
            toast.error('Erreur serveur', {
              description: 'Un problème technique est survenu.',
            })
          } else {
            toast.error(message)
          }

          throw new Error(message)
        }

        const data = await response.json()
        return (data?.data ?? data) as T
      })
    },
    [execute]
  )

  return { call, loading, error, clearError, hasError }
}
