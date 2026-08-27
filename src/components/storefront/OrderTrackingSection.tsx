'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, ChevronDown, Clock, CheckCircle, Truck, Loader2, XCircle, CalendarDays, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeInSection } from './AnimatedComponents'
import { formatPrice, getStatusColor, getStatusLabel } from './helpers'
import type { TrackedOrder } from './types'

interface OrderTrackingSectionProps {
  trackedOrders: TrackedOrder[]
  trackLoading: boolean
  onTrackOrder: (e: React.FormEvent) => void
  trackEmail: string
  setTrackEmail: (val: string) => void
}

const ORDER_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

const STEP_CONFIG: Record<string, { icon: typeof Clock; colorClass: string; bgClass: string; label: string }> = {
  pending:    { icon: Clock,       colorClass: 'text-amber-600', bgClass: 'bg-amber-100', label: 'En attente' },
  confirmed:  { icon: CheckCircle, colorClass: 'text-teal-600', bgClass: 'bg-teal-100', label: 'Confirmée' },
  processing: { icon: Loader2,     colorClass: 'text-cyan-600', bgClass: 'bg-cyan-100', label: 'En traitement' },
  shipped:    { icon: Truck,       colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100', label: 'Expédiée' },
  delivered:  { icon: CheckCircle, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100', label: 'Livrée' },
  cancelled:  { icon: XCircle,     colorClass: 'text-red-500', bgClass: 'bg-red-100', label: 'Annulée' },
}

function getEstimatedDelivery(status: string, createdAt: string): string | null {
  if (status === 'delivered' || status === 'cancelled') return null
  const base = new Date(createdAt)
  const daysMap: Record<string, number> = { pending: 3, confirmed: 2, processing: 1, shipped: 0 }
  const daysToAdd = daysMap[status] ?? 2
  const est = new Date(base)
  est.setDate(est.getDate() + daysToAdd + 1)
  return est.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function OrderTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    const cfg = STEP_CONFIG.cancelled
    const Icon = cfg.icon
    return (
      <div className="flex items-center gap-3 py-2">
        <div className={`w-8 h-8 rounded-full ${cfg.bgClass} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${cfg.colorClass}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Commande annulée</p>
          <p className="text-xs text-gray-500">Cette commande a été annulée</p>
        </div>
      </div>
    )
  }

  const currentIdx = ORDER_STEPS.indexOf(status as typeof ORDER_STEPS[number])

  return (
    <div className="py-2">
      <div className="flex items-center justify-between relative">
        {/* Progress line behind steps */}
        <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-200 rounded-full" />
        <div
          className="absolute top-4 left-4 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
          style={{ width: currentIdx >= 0 ? `${(currentIdx / (ORDER_STEPS.length - 1)) * (100 - 12.5)}%` : '0%' }}
        />

        {ORDER_STEPS.map((step, i) => {
          const isCompleted = i <= currentIdx
          const isCurrent = i === currentIdx
          const cfg = STEP_CONFIG[step]
          const Icon = cfg.icon

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? `bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20 ${isCurrent ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}`
                  : 'bg-gray-100'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Icon className={`w-4 h-4 ${cfg.colorClass} opacity-40`} />
                )}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${isCurrent ? 'text-emerald-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                {cfg.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OrderTrackingSection({
  trackedOrders,
  trackLoading,
  onTrackOrder,
  trackEmail,
  setTrackEmail,
}: OrderTrackingSectionProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Suivi de Commande</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Entrez votre email pour retrouver et suivre l&rsquo;état de vos commandes
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="max-w-lg mx-auto">
            <form onSubmit={onTrackOrder} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Votre email de commande"
                  value={trackEmail}
                  onChange={(e) => setTrackEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <Button
                type="submit"
                disabled={trackLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
              >
                {trackLoading ? '...' : 'Rechercher'}
                <Search className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Tracked Orders Results */}
            {trackedOrders.length > 0 ? (
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Résultats ({trackedOrders.length})</h3>
                {trackedOrders.map((order) => {
                  const statusCfg = STEP_CONFIG[order.status]
                  const StatusIcon = statusCfg?.icon || Package
                  const estDelivery = getEstimatedDelivery(order.status, order.createdAt)

                  return (
                    <Card key={order.id} className="overflow-hidden border-gray-200">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="w-full p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${statusCfg?.colorClass || ''}`} />
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-700">{formatPrice(order.totalAmount)}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 border-t border-gray-100">
                              {/* Timeline stepper */}
                              <div className="pt-4 pb-3">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Progression de la commande</p>
                                <OrderTimeline status={order.status} />
                              </div>

                              {/* Estimated delivery date */}
                              {estDelivery && (
                                <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 mb-4">
                                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm text-emerald-700 font-medium">
                                    Livraison estimée : {estDelivery}
                                  </span>
                                </div>
                              )}

                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Articles</p>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <Box className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="text-gray-700">{item.productName}</span>
                                      <span className="text-gray-400">x{item.quantity}</span>
                                    </div>
                                    <span className="text-gray-900 font-medium">{formatPrice(item.totalPrice)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* Searched but no results - empty state */
              <div className="mt-12 text-center">
                {/* Package illustration */}
                <div className="relative w-28 h-28 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200" />
                  <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-teal-100 border border-teal-200" />
                </div>
                <p className="text-gray-400 text-sm">Entrez votre email pour retrouver vos commandes</p>
              </div>
            )}
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}