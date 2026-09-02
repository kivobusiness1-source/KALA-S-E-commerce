'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { X, CheckCircle2 } from 'lucide-react'
import type { ProductType } from './types'

const sampleNames = [
  'Marie N.',
  'Jean-Pierre M.',
  'Aline K.',
  'Patrick B.',
  'Chloe L.',
  'Fabrice O.',
]

const sampleTimes = [
  'il y a 2 minutes',
  'il y a 5 minutes',
  'il y a 8 minutes',
  'il y a 12 minutes',
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
  const [dismissed, setDismissed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    if (dismissed || notificationCount >= 2) return

    if (!products || products.length === 0) {
      const genericNames = [
        'Savon Liquide Premium',
        'Detergent Concentre',
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
  }, [products, notificationCount, dismissed])

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!notification) return
    timerRef.current = setTimeout(() => {
      setNotification(null)
    }, 4000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [notification])

  // Schedule periodic notifications
  useEffect(() => {
    if (dismissed || notificationCount >= 2) return
    const initialDelay = 10000
    timerRef.current = setTimeout(() => {
      showNotification()
    }, initialDelay)
    const interval = setInterval(() => {
      if (notificationCount < 2 && !dismissed) {
        const delay = 18000 + Math.random() * 5000
        timerRef.current = setTimeout(() => {
          showNotification()
        }, delay)
      }
    }, 18000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(interval)
    }
  }, [dismissed, notificationCount, showNotification])

  const handleDismiss = () => {
    setNotification(null)
    setDismissed(true)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 hidden md:block">
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-lg border border-[#e5e5e5] shadow-sm p-3 w-64 overflow-hidden"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-[#1a1a1a] transition-colors duration-150"
              aria-label="Fermer"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#fafafa] border border-[#e5e5e5] flex items-center justify-center shrink-0">
                <span className="text-[#1a1a1a] font-semibold text-[10px]">
                  {getInitials(notification.buyerName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#16a34a] shrink-0" />
                  <span className="text-[11px] text-[#888888] font-medium">Achat verifie</span>
                </div>
                <p className="text-xs font-semibold text-[#1a1a1a] mt-0.5 truncate">
                  {notification.buyerName}
                </p>
                <p className="text-[11px] text-[#888888] truncate">
                  {notification.productName}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{notification.timeAgo}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}