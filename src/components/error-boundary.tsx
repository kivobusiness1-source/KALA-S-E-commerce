'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  /** Optional title for the error message */
  title?: string
  /** Optional description */
  description?: string
  /** Whether to show a compact inline error */
  compact?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Section-level error boundary for catching errors in specific UI sections
 * without crashing the entire page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const title = this.props.title || 'Erreur de chargement'
      const description = this.props.description || 'Cette section n\'a pas pu se charger correctement.'

      if (this.props.compact) {
        return (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 flex-1">{title}</p>
            <button
              onClick={this.handleRetry}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Réessayer
            </button>
          </div>
        )
      }

      return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
