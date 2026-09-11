'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* 404 number */}
        <div className="relative">
          <div className="text-[120px] sm:text-[160px] font-black text-gray-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-300" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Page non trouvée
          </h1>
          <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
            Vérifiez l&apos;adresse URL ou retournez à l&apos;accueil.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200 active:scale-95 shadow-lg shadow-gray-900/20"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-gray-600 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  )
}
