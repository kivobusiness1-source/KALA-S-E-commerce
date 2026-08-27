'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface LoyaltyBadgeProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoyaltyBadge({ points, size = 'sm', className = '' }: LoyaltyBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 text-amber-700 font-semibold ${sizeClasses[size]} ${className}`}
    >
      <Sparkles className={`${iconSizes[size]} text-amber-500`} />
      <span>{points} pt{points !== 1 ? 's' : ''} fidélité</span>
    </motion.div>
  )
}
