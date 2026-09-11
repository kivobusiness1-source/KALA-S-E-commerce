'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error('[Page Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-6">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Oups, une erreur !
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cette page a rencontré un problème
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed">
            Une erreur inattendue s&apos;est produite lors du chargement de cette page.
            Cela peut être un problème temporaire.
          </p>

          {/* Error reference */}
          {error.digest && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 font-mono">
                Réf : {error.digest}
              </p>
            </div>
          )}

          {/* Error details toggle (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Détails techniques
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </button>
              {showDetails && (
                <div className="mt-3 text-left bg-red-50 rounded-lg p-3 text-xs font-mono text-red-700 overflow-auto max-h-40">
                  <p className="font-bold mb-1">{error.message}</p>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 active:scale-95"
            >
              <Home className="w-4 h-4" />
              Accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
