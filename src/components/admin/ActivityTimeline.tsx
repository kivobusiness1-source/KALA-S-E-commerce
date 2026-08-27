'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, MessageCircle, Settings, Star, ShieldAlert, Palette, BarChart3, Users, Mail, ArrowRight } from 'lucide-react'
import { formatRelative } from './helpers'
import type { ActivityLogEntry } from './types'

function getActivityIcon(action: string) {
  const a = action.toLowerCase()
  if (a.includes('order') || a.includes('commande')) return <ShoppingCart className="w-3.5 h-3.5" />
  if (a.includes('product') || a.includes('produit') || a.includes('stock')) return <Package className="w-3.5 h-3.5" />
  if (a.includes('message') || a.includes('chat')) return <MessageCircle className="w-3.5 h-3.5" />
  if (a.includes('review') || a.includes('avis')) return <Star className="w-3.5 h-3.5" />
  if (a.includes('setting') || a.includes('param') || a.includes('config')) return <Settings className="w-3.5 h-3.5" />
  if (a.includes('email') || a.includes('subscriber') || a.includes('newsletter')) return <Mail className="w-3.5 h-3.5" />
  if (a.includes('alert') || a.includes('stock')) return <ShieldAlert className="w-3.5 h-3.5" />
  if (a.includes('category') || a.includes('catégor')) return <Palette className="w-3.5 h-3.5" />
  if (a.includes('customer') || a.includes('client')) return <Users className="w-3.5 h-3.5" />
  return <BarChart3 className="w-3.5 h-3.5" />
}

function getActivityColor(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('order') || a.includes('commande')) return 'bg-teal-500'
  if (a.includes('product') || a.includes('produit')) return 'bg-emerald-500'
  if (a.includes('message') || a.includes('chat')) return 'bg-cyan-500'
  if (a.includes('review') || a.includes('avis')) return 'bg-amber-500'
  if (a.includes('alert')) return 'bg-red-500'
  if (a.includes('email')) return 'bg-teal-400'
  return 'bg-gray-500'
}

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
      <div className="relative pl-8 space-y-0">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
        {[
          { text: 'Nouvelle commande reçue', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: 'bg-teal-500', time: 'il y a 2h' },
          { text: 'Produit mis à jour', icon: <Package className="w-3.5 h-3.5" />, color: 'bg-emerald-500', time: 'il y a 5h' },
          { text: 'Email envoyé', icon: <Mail className="w-3.5 h-3.5" />, color: 'bg-teal-400', time: 'hier' },
        ].map((item, i) => (
          <div key={i} className="relative pb-4 last:pb-0">
            <div className={`absolute left-[-24px] top-1.5 w-7 h-7 rounded-full ${item.color} flex items-center justify-center text-white shadow-sm`} />
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
    <div>
      <div className="relative pl-8 space-y-0 max-h-80 overflow-y-auto">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-emerald-200" />
        {activity.map((a) => (
          <div key={a.id} className="relative pb-4 last:pb-0">
            <div className={`absolute left-[-24px] top-1.5 w-7 h-7 rounded-full ${getActivityColor(a.action)} flex items-center justify-center text-white shadow-sm`} />
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
      <div className="mt-3 pt-3 border-t">
        <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 transition-colors">
          Voir tout
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
