'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { toast } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status
                if (status >= 400 && status < 500) return false
              }
              // Retry up to 2 times for server errors
              return failureCount < 2
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: undefined, // Use default
      })
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}

/**
 * Utility to handle fetch errors consistently across the app.
 * Parses API error responses and shows user-friendly toast messages.
 */
export async function handleFetchError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    const message = data?.error?.message || data?.error || 'Une erreur est survenue'

    // Show toast for user-facing errors
    if (response.status >= 500) {
      toast.error('Erreur serveur', {
        description: 'Un problème technique est survenu. Veuillez réessayer.',
      })
    } else if (response.status === 401) {
      toast.error('Session expirée', {
        description: 'Veuillez vous reconnecter.',
      })
    } else if (response.status === 403) {
      toast.error('Accès refusé', {
        description: "Vous n'avez pas les permissions nécessaires.",
      })
    } else if (response.status === 429) {
      toast.error('Trop de requêtes', {
        description: 'Veuillez patienter avant de réessayer.',
      })
    } else {
      toast.error(message)
    }

    return message
  } catch {
    toast.error('Erreur de connexion', {
      description: 'Impossible de communiquer avec le serveur.',
    })
    return 'Erreur de connexion'
  }
}

/**
 * Safe fetch wrapper with error handling
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  onSuccess?: (data: T) => void,
  onError?: (message: string) => void
): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(url, options)

    if (!response.ok) {
      const errorMsg = await handleFetchError(response)
      onError?.(errorMsg)
      return { error: errorMsg }
    }

    const result = await response.json()
    const data = result.data ?? result
    onSuccess?.(data as T)
    return { data: data as T }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    toast.error('Erreur réseau', {
      description: 'Vérifiez votre connexion internet.',
    })
    onError?.(message)
    return { error: message }
  }
}
