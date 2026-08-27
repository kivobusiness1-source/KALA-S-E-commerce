'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelative } from './helpers'
import type { ActivityLogEntry } from './types'

export default function ActivityTimeline() {
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => fetch('/api/activity').then(r => r.json()).then(d => d.data as ActivityLogEntry[]),
  })

  const activity = activityData ?? []

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (activity.length === 0) {
    return (
      <div className="relative pl-6 space-y-0">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
        {[
          { text: 'Nouvelle commande reçue', time: 'il y a 2h' },
          { text: 'Produit mis à jour', time: 'il y a 5h' },
          { text: 'Email envoyé', time: 'hier' },
        ].map((item, i) => (
          <div key={i} className="relative pb-4 last:pb-0">
            <div className="absolute left-[-20px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            <div>
              <p className="text-sm text-gray-900">{item.text}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-emerald-200" />
      {activity.map((a, i) => (
        <div key={a.id} className={`relative pb-4 last:pb-0`}>
          <div className="absolute left-[-20px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          <div>
            <p className="text-sm text-gray-900">
              <span className="font-medium text-emerald-700">{a.adminName}</span>
              {' — '}
              {a.details || a.action}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}