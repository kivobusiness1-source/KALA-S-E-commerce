'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical errors for monitoring
    console.error('[Global Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center space-y-6">
              {/* Error icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Erreur critique
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Une erreur irrécupérable s&apos;est produite
                </p>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                L&apos;application a rencontré une erreur inattendue qui l&apos;empêche de fonctionner correctement.
                Cela peut être dû à un problème temporaire. Veuillez réessayer.
              </p>

              {/* Error reference */}
              {error.digest && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 font-mono">
                    Référence d&apos;erreur : {error.digest}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all duration-200 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                >
                  <Home className="w-4 h-4" />
                  Retour à l&apos;accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
