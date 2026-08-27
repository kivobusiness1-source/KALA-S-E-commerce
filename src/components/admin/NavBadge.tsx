'use client'

import { useQuery } from '@tanstack/react-query'
import type { Section, StatsData } from './types'

export default function NavBadge({ itemKey, activeSection }: { itemKey: Section; activeSection: Section }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()).then(d => d.data as StatsData),
    enabled: true,
    refetchInterval: 30000,
  })
  
  let count = 0
  if (itemKey === 'messages') count = stats?.unreadMessages ?? 0
  else if (itemKey === 'contact') count = stats?.unreadContactCount ?? 0
  else if (itemKey === 'orders') count = stats?.pendingOrdersCount ?? 0

  // Pending reviews badge
  const { data: reviewsData } = useQuery({
    queryKey: ['admin-reviews-badge'],
    queryFn: () => fetch('/api/reviews').then(r => r.json()).then(d => d.data as { id: string; isApproved: boolean }[]),
    enabled: itemKey === 'reviews',
  })
  if (itemKey === 'reviews' && reviewsData) {
    count = reviewsData.filter(r => !r.isApproved).length
  }

  if (count === 0) return null
  return (
    <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold ${activeSection === itemKey ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
      {count}
    </span>
  )
}