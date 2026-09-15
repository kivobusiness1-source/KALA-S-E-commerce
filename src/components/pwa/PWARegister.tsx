'use client'

import { useEffect } from 'react'

/**
 * Registers the KALA'S service worker (public/sw.js).
 *
 * - Registers on mount (after hydration) to never compete with initial render.
 * - sw.js uses skipWaiting + clientsClaim, so updated versions take over
 *   quickly; we reload once when a NEW worker takes control (update scenario
 *   only — first install has no controller, so no reload for new visitors).
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Only register on http(s)
    if (!window.location.protocol.startsWith('http')) return

    // Keep local dev clean: never register (and clean up any stray SW) in
    // development, so HMR chunks are never served stale from a cache.
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {})
      return
    }

    let reloading = false
    const hadController = !!navigator.serviceWorker.controller

    const onControllerChange = () => {
      if (reloading || !hadController) return
      reloading = true
      window.location.reload()
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err)
      })

    if (hadController) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}
