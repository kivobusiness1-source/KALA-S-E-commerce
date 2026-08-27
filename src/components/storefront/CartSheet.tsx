'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Package, Plus, Minus, Trash2, ChevronRight, Truck, MessageCircle, ShoppingBag, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { formatPrice, getCategoryColor, getCategoryInitial, getInitials } from './helpers'
import type { CartItem } from '@/stores/cart-store'
import type { ProductType, ReviewType } from './types'

export const DELIVERY_ZONES = [
  { id: 'centre-ville', label: 'Centre-ville (Pointe-Noire)', fee: 0, freeThreshold: 0 },
  { id: 'peripherique', label: 'Quartiers périphériques', fee: 1500, freeThreshold: 25000 },
  { id: 'loango-tchimbamba', label: 'Loango / Tchimbamba', fee: 3000, freeThreshold: 25000 },
  { id: 'hopital-diosso', label: 'Hôpital / Diosso', fee: 5000, freeThreshold: 25000 },
  { id: 'autres', label: 'Autres zones', fee: 8000, freeThreshold: 25000 },
] as const

export type DeliveryZoneId = (typeof DELIVERY_ZONES)[number]['id']

interface OrderForm {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
}

interface ReviewForm {
  customerName: string
  rating: number
  comment: string
}

interface CartSheetProps {
  // Cart
  items: CartItem[]
  cartIsOpen: boolean
  setCartOpen: (open: boolean) => void
  totalItems: number
  totalPrice: number
  updateQuantity: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  scrollToSection: (id: string) => void
  // Delivery zone
  deliveryZone: DeliveryZoneId
  setDeliveryZone: (zone: DeliveryZoneId) => void
  // Order dialog
  orderDialogOpen: boolean
  setOrderDialogOpen: (open: boolean) => void
  orderForm: OrderForm
  setOrderForm: (form: OrderForm) => void
  orderLoading: boolean
  onOrderSubmit: (e: React.FormEvent) => void
  // Product detail dialog
  selectedProduct: ProductType | null
  setSelectedProduct: (product: ProductType | null) => void
  onAddToCart: (product: ProductType) => void
  // Reviews
  reviews: ReviewType[]
  avgRating: number
  totalReviews: number
  reviewForm: ReviewForm
  setReviewForm: (form: ReviewForm) => void
  reviewLoading: boolean
  showReviewForm: boolean
  setShowReviewForm: (show: boolean) => void
  onReviewSubmit: (e: React.FormEvent) => void
}

function getCategoryBorderColor(slug: string): string {
  switch (slug) {
    case 'savon-liquide':
      return 'border-l-emerald-500'
    case 'detergent':
      return 'border-l-amber-500'
    case 'eau-de-javel':
      return 'border-l-cyan-500'
    default:
      return 'border-l-emerald-500'
  }
}

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 overflow-hidden">
      <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200"
        aria-label="Diminuer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums select-none">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-200"
        aria-label="Augmenter"
        disabled={quantity >= 99}
      >
        <Plus className={`w-3 h-3 ${quantity >= 99 ? 'opacity-30' : ''}`} />
      </button>
    </div>
  )
}

function OrderProgressIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: 'Informations' },
    { num: 2, label: 'Livraison' },
    { num: 3, label: 'Confirmation' },
  ]
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
                step >= s.num
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-[11px] font-medium ${step >= s.num ? 'text-emerald-700' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${step > s.num ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export function CartSheet({
  items,
  cartIsOpen,
  setCartOpen,
  totalItems,
  totalPrice,
  updateQuantity,
  removeItem,
  clearCart,
  scrollToSection,
  deliveryZone,
  setDeliveryZone,
  orderDialogOpen,
  setOrderDialogOpen,
  orderForm,
  setOrderForm,
  orderLoading,
  onOrderSubmit,
  selectedProduct,
  setSelectedProduct,
  onAddToCart,
  reviews,
  avgRating,
  totalReviews,
  reviewForm,
  setReviewForm,
  reviewLoading,
  showReviewForm,
  setShowReviewForm,
  onReviewSubmit,
}: CartSheetProps) {
  const [orderStep, setOrderStep] = useState<1 | 2 | 3>(1)
  const zone = DELIVERY_ZONES.find((z) => z.id === deliveryZone) || DELIVERY_ZONES[0]
  const deliveryFee = useMemo(() => {
    if (zone.freeThreshold === 0) return 0
    if (totalPrice >= zone.freeThreshold) return 0
    return zone.fee
  }, [zone, totalPrice])
  const freeThreshold = zone.freeThreshold
  const progressPct = freeThreshold > 0 ? Math.min((totalPrice / freeThreshold) * 100, 100) : 100

  const handleUpdateQty = (id: string, qty: number) => {
    if (qty < 1) return
    if (qty > 99) return
    updateQuantity(id, qty)
  }

  return (
    <>
      <Sheet open={cartIsOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {/* Gradient header area */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-4 pt-5 pb-4">
            <SheetHeader className="text-white">
              <SheetTitle className="flex items-center gap-2 text-white">
                <ShoppingCart className="w-5 h-5" />
                Panier
                {totalItems > 0 && (
                  <Badge className="bg-white/20 text-white backdrop-blur-sm ml-1 border-white/30">{totalItems} article(s)</Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-emerald-100">Vos produits sélectionnés</SheetDescription>
            </SheetHeader>
          </div>

          {/* Delivery zone selector */}
          {items.length > 0 && (
            <div className="px-4 py-2 bg-emerald-50/50 border-b border-emerald-100">
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-gray-700">Zone de livraison</span>
              </div>
              <Select value={deliveryZone} onValueChange={(v) => setDeliveryZone(v as DeliveryZoneId)}>
                <SelectTrigger className="w-full h-8 text-xs bg-white border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_ZONES.map((z) => (
                    <SelectItem key={z.id} value={z.id} className="text-xs">
                      {z.label} {z.fee === 0 ? '(Gratuit)' : `— ${z.fee.toLocaleString('fr-FR')} FCFA`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Free delivery progress bar */}
          {items.length > 0 && freeThreshold > 0 && (
            <div className="px-4 py-2 bg-emerald-50/30">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {totalPrice >= freeThreshold ? (
                  <span className="text-emerald-600 font-medium">Livraison gratuite !</span>
                ) : (
                  <>Plus que <span className="font-semibold text-emerald-700">{(freeThreshold - totalPrice).toLocaleString('fr-FR')} FCFA</span> pour la livraison gratuite !</>
                )}
              </p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                {/* Decorative shopping bag with dashed circle */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full bg-emerald-50/60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-1.5 max-w-[200px] mx-auto">Ajoutez des produits pour commencer vos achats</p>
                <Button
                  className="mt-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold px-6 shadow-lg shadow-emerald-600/20 transition-all duration-300"
                  onClick={() => {
                    setCartOpen(false)
                    scrollToSection('products')
                  }}
                >
                  Découvrez nos produits
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
                <button
                  onClick={() => {
                    setCartOpen(false)
                    // Trigger chat open via custom event
                    document.dispatchEvent(new CustomEvent('open-chat'))
                  }}
                  className="mt-3 text-sm text-gray-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Besoin d&rsquo;aide ?
                </button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div className="space-y-3 py-2">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-3 p-3 bg-gray-50 rounded-xl border-l-[3px] ${getCategoryBorderColor(item.id)} hover:bg-emerald-50/40 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300 group/item`}
                    >
                      {/* Item image */}
                      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg group-hover/item:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Package className="w-6 h-6 text-white/60" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        {item.volume && (
                          <p className="text-xs text-gray-500">{item.volume}</p>
                        )}
                        {/* Price × Qty = Total */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-400">{formatPrice(item.price)} × {item.quantity}</span>
                          <span className="text-xs text-gray-300">=</span>
                          <span className="text-sm font-bold text-emerald-700">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <QuantityControl
                            quantity={item.quantity}
                            onDecrease={() => handleUpdateQty(item.id, item.quantity - 1)}
                            onIncrease={() => handleUpdateQty(item.id, item.quantity + 1)}
                          />
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors duration-200 ml-auto"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <SheetFooter className="border-t bg-white p-4 gap-3">
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="text-gray-700 font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Livraison ({zone.label})</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-600 font-medium' : 'text-gray-700 font-medium'}>
                      {deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <span className="text-xl font-bold text-emerald-700">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                  <Button
                    onClick={() => { setOrderStep(1); setOrderDialogOpen(true) }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold h-11 shadow-md shadow-emerald-600/25 transition-all duration-300"
                  >
                    Commander
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Order Dialog with Progress Indicator */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <OrderProgressIndicator step={orderStep} />
          <DialogHeader>
            <DialogTitle className="text-xl">Passer la commande</DialogTitle>
            <DialogDescription>
              Total : <span className="font-semibold text-emerald-700">{formatPrice(totalPrice + deliveryFee)}</span>
              {deliveryFee > 0 && (
                <span className="text-gray-500"> (dont {formatPrice(deliveryFee)} de livraison)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Main form */}
            <form onSubmit={onOrderSubmit} className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-name">Nom complet <span className="text-red-500">*</span></Label>
                <Input
                  id="order-name"
                  placeholder="Votre nom"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  required
                  className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="order-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={orderForm.customerEmail}
                  onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                  required
                  className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-phone">Téléphone <span className="text-red-500">*</span></Label>
                <Input
                  id="order-phone"
                  placeholder="+242 06 XXX XXXX"
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                  required
                  className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-address">Adresse de livraison <span className="text-red-500">*</span></Label>
                <Input
                  id="order-address"
                  placeholder="Votre adresse complète"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  required
                  className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={orderLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {orderLoading ? 'Envoi en cours...' : 'Confirmer la commande'}
                </Button>
              </div>
            </form>

            {/* Summary sidebar */}
            <div className="md:w-56 shrink-0">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sticky top-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Récapitulatif</h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-gray-200">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <Package className="w-3 h-3 text-white/60" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500">×{item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3 bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Livraison</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-600' : ''}>{deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total</span>
                    <span className="text-emerald-700">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog with Tabs */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedProduct?.category && (
                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">{selectedProduct.category.name}</Badge>
              )}
              {selectedProduct?.volume && <Badge variant="secondary">{selectedProduct.volume}</Badge>}
              </div>
              <DialogTitle className="text-xl">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Rating summary */}
            {selectedProduct && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-4 h-4 ${si < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {avgRating > 0 ? `${avgRating}/5` : 'Pas encore d\'avis'}
                  {totalReviews > 0 && ` (${totalReviews})`}
                </span>
              </div>
            )}
            {/* Taller image with gradient overlay */}
            <div className="h-56 rounded-xl bg-gray-100 overflow-hidden relative">
              {selectedProduct?.image ? (
                <>
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </>
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${selectedProduct ? getCategoryColor(selectedProduct.category?.slug || '') : ''} flex items-center justify-center`}>
                  <span className="text-7xl font-bold text-white/30">{selectedProduct ? getCategoryInitial(selectedProduct.category?.slug || '') : ''}</span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-emerald-700">{selectedProduct ? formatPrice(selectedProduct.price) : ''}</span>
              {selectedProduct?.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(selectedProduct.comparePrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${selectedProduct?.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">{selectedProduct?.inStock ? 'En stock' : 'Rupture de stock'}</span>
            </div>

            {/* Tabs: Description & Avis */}
            {selectedProduct && (
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full bg-gray-100">
                  <TabsTrigger value="description" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Avis clients ({totalReviews})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-3">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {selectedProduct.longDescription || selectedProduct.description || 'Aucune description disponible pour ce produit.'}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-3">
                  {/* Reviews list */}
                  {reviews.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-emerald-700 font-semibold text-xs">{getInitials(review.customerName)}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={`w-3 h-3 ${si < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm">Aucun avis pour le moment</p>
                    </div>
                  )}

                  {/* Review form toggle */}
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {showReviewForm ? 'Fermer le formulaire' : 'Laisser un avis'}
                  </Button>

                  {/* Review form */}
                  <AnimatePresence>
                    {showReviewForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onSubmit={onReviewSubmit}
                        className="space-y-3 border border-gray-200 rounded-lg p-4 mt-3 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="review-name">Nom <span className="text-red-500">*</span></Label>
                          <Input
                            id="review-name"
                            placeholder="Votre nom"
                            value={reviewForm.customerName}
                            onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                            required
                            className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Note</Label>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <button
                                key={si}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: si + 1 })}
                                className="p-0.5 hover:scale-110 transition-transform"
                                aria-label={`${si + 1} étoile(s)`}
                              >
                                <Star className={`w-6 h-6 ${si < reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="review-comment">Commentaire (optionnel)</Label>
                          <Textarea
                            id="review-comment"
                            placeholder="Votre avis sur ce produit..."
                            rows={3}
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            maxLength={500}
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={reviewLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {reviewLoading ? 'Envoi en cours...' : 'Publier l\'avis'}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            )}
          </div>
          <DialogFooter>
            {selectedProduct?.inStock && (
              <Button onClick={() => { if (selectedProduct) { onAddToCart(selectedProduct); setSelectedProduct(null) } }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
