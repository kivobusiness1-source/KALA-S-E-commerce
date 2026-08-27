import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
}

export const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

export const statusDotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-teal-400',
  processing: 'bg-violet-400',
  shipped: 'bg-cyan-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

export const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316']

export const PIE_COLORS = ['#10b981', '#f59e0b', '#14b8a6']

export const CATEGORY_PIE_DATA = [
  { name: 'Savon Liquide', value: 45, fill: PIE_COLORS[0] },
  { name: 'Détergent', value: 35, fill: PIE_COLORS[1] },
  { name: 'Eau de Javel', value: 20, fill: PIE_COLORS[2] },
]

export const CATEGORY_PIE_CONFIG = {
  'Savon Liquide': { label: 'Savon Liquide', color: PIE_COLORS[0] },
  'Détergent': { label: 'Détergent', color: PIE_COLORS[1] },
  'Eau de Javel': { label: 'Eau de Javel', color: PIE_COLORS[2] },
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200'} flex items-center gap-1.5`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColors[status] || 'bg-gray-400'}`} />
      {statusLabels[status] || status}
    </Badge>
  )
}
