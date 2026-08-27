'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Package, ChevronDown } from 'lucide-react'
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
            {trackedOrders.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Résultats ({trackedOrders.length})</h3>
                {trackedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
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
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Articles</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-gray-400" />
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
                ))}
              </div>
            )}
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}