'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react'
import type { ProductType } from './types'

const sampleNames = [
  'Marie N.',
  'Jean-Pierre M.',
  'Aline K.',
  'Patrick B.',
  'Chloé L.',
  'Fabrice O.',
  'Grâce T.',
  'Hervé D.',
]

const sampleTimes = [
  'il y a 2 minutes',
  'il y a 5 minutes',
  'il y a 8 minutes',
  'il y a 12 minutes',
  'il y a 15 minutes',
  'il y a 20 minutes',
]

interface NotificationData {
  id: number
  productName: string
  buyerName: string
  timeAgo: string
}

export function SocialProofToast({ products }: { products: ProductType[] | undefined }) {
  const [notification, setNotification] = useState<NotificationData | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [progress, setProgress] = useState(100)
  const [dismissed, setDismissed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationIdRef = useRef(0)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRandomElement = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  const showNotification = useCallback(() => {
    if (dismissed || notificationCount >= 3) return

    if (!products || products.length === 0) {
      // Show generic product if no products loaded yet
      const genericNames = [
        'Savon Liquide Premium',
        'Détergent Concentré',
        'Eau de Javel Classic',
      ]
      setNotification({
        id: notificationIdRef.current++,
        productName: getRandomElement(genericNames),
        buyerName: getRandomElement(sampleNames),
        timeAgo: getRandomElement(sampleTimes),
      })
    } else {
      const product = getRandomElement(products)
      setNotification({
        id: notificationIdRef.current++,
        productName: product.name,
        buyerName: getRandomElement(sampleNames),
        timeAgo: getRandomElement(sampleTimes),
      })
    }

    setNotificationCount((prev) => prev + 1)
    setProgress(100)
  }, [products, notificationCount, dismissed])

  // Show notification and auto-dismiss
  useEffect(() => {
    if (!notification) return

    // Start progress bar countdown (4 seconds)
    const startTime = Date.now()
    const duration = 4000

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
    }, 50)

    // Auto-dismiss after 4 seconds
    timerRef.current = setTimeout(() => {
      setNotification(null)
      setProgress(100)
      if (progressRef.current) clearInterval(progressRef.current)
    }, duration)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [notification])

  // Schedule periodic notifications
  useEffect(() => {
    if (dismissed || notificationCount >= 3) return

    // Show first notification after 8 seconds, then every 15-20 seconds
    const initialDelay = 8000
    const scheduleNext = () => {
      const delay = initialDelay + Math.random() * 12000 // 15-20 seconds total
      timerRef.current = setTimeout(() => {
        showNotification()
      }, delay)
    }

    timerRef.current = setTimeout(scheduleNext, initialDelay)

    // After initial, schedule repeatedly
    const interval = setInterval(() => {
      if (notificationCount < 3 && !dismissed) {
        const delay = 15000 + Math.random() * 5000
        timerRef.current = setTimeout(() => {
          showNotification()
        }, delay)
      }
    }, 15000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(interval)
    }
  }, [dismissed, notificationCount, showNotification])

  const handleDismiss = () => {
    setNotification(null)
    setProgress(100)
    setDismissed(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  const handleClose = () => {
    setNotification(null)
    setProgress(100)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) clearInterval(progressRef.current)
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden md:block">
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-80 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-start gap-3">
              {/* Avatar with initials */}
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-emerald-700 font-semibold text-sm">
                  {getInitials(notification.buyerName)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">Achat vérifié</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                  {notification.buyerName}
                </p>
                <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 shrink-0" />
                  <span className="font-medium">{notification.productName}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{notification.timeAgo}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.05, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}