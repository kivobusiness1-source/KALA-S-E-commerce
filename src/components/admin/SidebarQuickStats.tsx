'use client'

import { useQuery } from '@tanstack/react-query'
import type { StatsData } from './types'

export default function SidebarQuickStats() {
  const { data: stats } = useQuery({
    queryKey: ['sidebar-quick-stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()).then(d => d.data as StatsData),
    refetchInterval: 30000,
  })

  return (
    <div className="px-5 py-2 space-y-1.5 border-t border-gray-100">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Statistiques</p>
      <div className="space-y-1">
        <p className="text-xs text-gray-500">Produits actifs : <span className="text-gray-900 font-bold">{stats?.totalProducts ?? '—'}</span></p>
        <p className="text-xs text-gray-500">Commandes en attente : <span className="text-gray-900 font-bold">{stats?.pendingOrdersCount ?? '—'}</span></p>
        <p className="text-xs text-gray-500">Messages non lus : <span className="text-gray-900 font-bold">{stats?.unreadMessages ?? '—'}</span></p>
      </div>
    </div>
  )
}