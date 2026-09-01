'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ShoppingCart, Package, Plus, Minus, Trash2, ChevronRight, Truck, Star, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { formatPrice, getInitials } from './helpers'
import type { CartItem } from '@/stores/cart-store'
import type { ProductType, ReviewType } from './types'

export const DELIVERY_ZONES = [
  { id: 'centre-ville', label: 'Centre-ville (Pointe-Noire)', fee: 0, freeThreshold: 0 },
  { id: 'peripherique', label: 'Quartiers peripheriques', fee: 1500, freeThreshold: 25000 },
  { id: 'loango-tchimbamba', label: 'Loango / Tchimbamba', fee: 3000, freeThreshold: 25000 },
  { id: 'hopital-diosso', label: 'Hopital / Diosso', fee: 5000, freeThreshold: 25000 },
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
  onAddToCart: (product: ProductType, quantity?: number) => void
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
  // Loyalty
  earnedPoints: number
  // Related products
  products: ProductType[]
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
    <div className="inline-flex items-center rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
      <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#64748b]"
        aria-label="Diminuer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums select-none text-[#1a1a2e]">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#64748b]"
        aria-label="Augmenter"
        disabled={quantity >= 99}
      >
        <Plus className={`w-3 h-3 ${quantity >= 99 ? 'opacity-30' : ''}`} />
      </button>
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
  earnedPoints,
  products: allProducts,
}: CartSheetProps) {
  const [productQty, setProductQty] = useState(1)
  const [isFavorited, setIsFavorited] = useState(false)
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
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-[#e2e8f0]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-[#1a1a2e]">
                <ShoppingCart className="w-5 h-5" />
                Panier
                {totalItems > 0 && (
                  <span className="text-sm font-normal text-[#64748b]">({totalItems})</span>
                )}
              </SheetTitle>
              <SheetDescription className="text-[#64748b]">Vos produits selectionnes</SheetDescription>
            </SheetHeader>
          </div>

          {/* Delivery zone selector */}
          {items.length > 0 && (
            <div className="px-4 py-3 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-[#64748b]" />
                <span className="text-xs font-medium text-[#1a1a2e]">Zone de livraison</span>
              </div>
              <Select value={deliveryZone} onValueChange={(v) => setDeliveryZone(v as DeliveryZoneId)}>
                <SelectTrigger className="w-full h-8 text-xs bg-white border-[#e2e8f0]">
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

          {/* Free delivery progress */}
          {items.length > 0 && freeThreshold > 0 && (
            <div className="px-4 py-2.5 border-b border-[#e2e8f0] bg-[#fafafa]">
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#1a1a2e] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-[#64748b] mt-1.5">
                {totalPrice >= freeThreshold ? (
                  <span className="text-[#16a34a] font-medium">Livraison gratuite !</span>
                ) : (
                  <>Plus que <span className="font-semibold text-[#1a1a2e]">{(freeThreshold - totalPrice).toLocaleString('fr-FR')} FCFA</span> pour la livraison gratuite</>
                )}
              </p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#1a1a2e] font-semibold">Votre panier est vide</p>
                <p className="text-[#64748b] text-sm mt-1 max-w-[200px] mx-auto">Ajoutez des produits pour commencer vos achats</p>
                <Button
                  className="mt-5 bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white font-medium"
                  onClick={() => {
                    setCartOpen(false)
                    scrollToSection('products')
                  }}
                >
                  Decouvrez nos produits
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-4" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                <div className="space-y-0 py-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 py-3 border-b border-[#e2e8f0] last:border-0"
                    >
                      {/* Item image */}
                      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#1a1a2e] text-sm truncate">{item.name}</h4>
                        {item.volume && (
                          <p className="text-xs text-[#64748b]">{item.volume}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-[#64748b]">{formatPrice(item.price)} x {item.quantity}</span>
                          <span className="text-xs text-gray-300">=</span>
                          <span className="text-sm font-bold text-[#1a1a2e]">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <QuantityControl
                            quantity={item.quantity}
                            onDecrease={() => handleUpdateQty(item.id, item.quantity - 1)}
                            onIncrease={() => handleUpdateQty(item.id, item.quantity + 1)}
                          />
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-[#dc2626] transition-colors duration-150 ml-auto"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <SheetFooter className="border-t border-[#e2e8f0] bg-white p-4 gap-3">
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748b]">Sous-total</span>
                    <span className="text-[#1a1a2e] font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748b]">Livraison ({zone.label})</span>
                    <span className={deliveryFee === 0 ? 'text-[#16a34a] font-medium' : 'text-[#1a1a2e] font-medium'}>
                      {deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {earnedPoints > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#c8a951]">Points fidelite gagnes</span>
                      <span className="text-[#c8a951] font-medium">+{earnedPoints}</span>
                    </div>
                  )}
                  <Separator className="bg-[#e2e8f0]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[#1a1a2e] font-semibold">Total</span>
                    <span className="text-xl font-bold text-[#1a1a2e]">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                  <Button
                    onClick={() => { setOrderDialogOpen(true) }}
                    className="w-full bg-[#c8a951] hover:bg-[#c8a951]/90 text-[#1a1a2e] font-semibold h-11"
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

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Passer la commande</DialogTitle>
            <DialogDescription>
              Total : <span className="font-semibold text-[#1a1a2e]">{formatPrice(totalPrice + deliveryFee)}</span>
              {deliveryFee > 0 && (
                <span className="text-[#64748b]"> (dont {formatPrice(deliveryFee)} de livraison)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Main form */}
            <form onSubmit={onOrderSubmit} className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-name">Nom complet <span className="text-[#dc2626]">*</span></Label>
                <Input
                  id="order-name"
                  placeholder="Votre nom"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  required
                  className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-email">Email <span className="text-[#dc2626]">*</span></Label>
                <Input
                  id="order-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={orderForm.customerEmail}
                  onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                  required
                  className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-phone">Telephone <span className="text-[#dc2626]">*</span></Label>
                <Input
                  id="order-phone"
                  placeholder="+242 06 XXX XXXX"
                  value={orderForm.customerPhone}
                  onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                  required
                  className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-address">Adresse de livraison <span className="text-[#dc2626]">*</span></Label>
                <Input
                  id="order-address"
                  placeholder="Votre adresse complete"
                  value={orderForm.address}
                  onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                  required
                  className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[#e2e8f0] text-[#1a1a2e]"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={orderLoading}
                  className="flex-1 bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white font-semibold"
                >
                  {orderLoading ? 'Envoi en cours...' : 'Confirmer la commande'}
                </Button>
              </div>
            </form>

            {/* Summary sidebar */}
            <div className="md:w-56 shrink-0">
              <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e2e8f0] sticky top-0">
                <h4 className="text-sm font-semibold text-[#1a1a2e] mb-3">Recapitulatif</h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-3 h-3 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1a1a2e] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#64748b]">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#1a1a2e]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3 bg-[#e2e8f0]" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#64748b]">
                    <span>Livraison</span>
                    <span className={deliveryFee === 0 ? 'text-[#16a34a]' : ''}>{deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator className="bg-[#e2e8f0]" />
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-[#1a1a2e]">Total</span>
                    <span className="text-[#1a1a2e]">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setProductQty(1); setIsFavorited(false) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedProduct?.category && (
                <span className="text-xs text-[#64748b]">{selectedProduct.category.name}</span>
              )}
              {selectedProduct?.volume && <span className="text-xs text-[#64748b]">{selectedProduct.volume}</span>}
            </div>
            <DialogTitle className="text-xl">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Rating summary */}
            {selectedProduct && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className={`w-4 h-4 ${si < Math.round(avgRating) ? 'text-[#c8a951] fill-[#c8a951]' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-[#64748b]">
                  {avgRating > 0 ? `${avgRating}/5` : 'Pas encore d\'avis'}
                  {totalReviews > 0 && ` (${totalReviews})`}
                </span>
              </div>
            )}
            {/* Image */}
            <div className="h-56 rounded-xl bg-gray-100 overflow-hidden">
              {selectedProduct?.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#1a1a2e]">{selectedProduct ? formatPrice(selectedProduct.price) : ''}</span>
              {selectedProduct?.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                <span className="text-lg text-[#64748b] line-through">{formatPrice(selectedProduct.comparePrice)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedProduct?.inStock ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
              <span className="text-sm text-[#64748b]">{selectedProduct?.inStock ? 'En stock' : 'Rupture de stock'}</span>
            </div>

            {/* Quantity selector */}
            {selectedProduct?.inStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1a1a2e]">Quantite :</span>
                <div className="inline-flex items-center rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
                  <button
                    onClick={() => setProductQty(Math.max(1, productQty - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150"
                    aria-label="Diminuer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">{productQty}</span>
                  <button
                    onClick={() => setProductQty(Math.min(99, productQty + 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150"
                    aria-label="Augmenter"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabs: Description & Avis */}
            {selectedProduct && (
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full bg-gray-100 h-auto p-0.5">
                  <TabsTrigger value="description" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-none rounded-md">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1 data-[state=active]:bg-white data-[state=active]:shadow-none rounded-md">
                    Avis clients ({totalReviews})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-3">
                  <div className="bg-[#fafafa] rounded-lg p-4 border border-[#e2e8f0]">
                    <p className="text-[#64748b] leading-relaxed text-sm">
                      {selectedProduct.longDescription || selectedProduct.description || 'Aucune description disponible pour ce produit.'}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="mt-3">
                  {reviews.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-[#fafafa] rounded-lg p-3 border border-[#e2e8f0]">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-[#1a1a2e] font-semibold text-xs">{getInitials(review.customerName)}</span>
                              </div>
                              <span className="text-sm font-medium text-[#1a1a2e]">{review.customerName}</span>
                            </div>
                            <span className="text-xs text-[#64748b]">
                              {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={`w-3 h-3 ${si < review.rating ? 'text-[#c8a951] fill-[#c8a951]' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-[#64748b] leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[#64748b]">
                      <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm">Aucun avis pour le moment</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-3 border-[#e2e8f0] text-[#1a1a2e]"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {showReviewForm ? 'Fermer le formulaire' : 'Laisser un avis'}
                  </Button>

                  <AnimatePresence>
                    {showReviewForm && (
                      <form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        onSubmit={onReviewSubmit}
                        className="space-y-3 border border-[#e2e8f0] rounded-lg p-4 mt-3 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="review-name">Nom <span className="text-[#dc2626]">*</span></Label>
                          <Input
                            id="review-name"
                            placeholder="Votre nom"
                            value={reviewForm.customerName}
                            onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                            required
                            className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
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
                                className="p-0.5"
                                aria-label={`${si + 1} etoile(s)`}
                              >
                                <Star className={`w-6 h-6 ${si < reviewForm.rating ? 'text-[#c8a951] fill-[#c8a951]' : 'text-gray-300'}`} />
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
                            className="border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={reviewLoading}
                          className="w-full bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white font-semibold"
                        >
                          {reviewLoading ? 'Envoi en cours...' : 'Publier l\'avis'}
                        </Button>
                      </form>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </Tabs>
            )}
          </div>
          <DialogFooter>
            {selectedProduct?.inStock && (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => setIsFavorited(!isFavorited)}
                  variant="outline"
                  className="shrink-0 border-[#e2e8f0] hover:bg-red-50 hover:border-red-200 hover:text-[#dc2626] transition-colors duration-150"
                  aria-label="Favoris"
                >
                  <Heart className={`w-4 h-4 mr-0 ${isFavorited ? 'fill-[#dc2626] text-[#dc2626]' : ''}`} />
                </Button>
                <Button
                  onClick={() => { if (selectedProduct) { onAddToCart(selectedProduct, productQty); setSelectedProduct(null); setProductQty(1) } }}
                  className="flex-1 bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au panier
                </Button>
              </div>
            )}
          </DialogFooter>

          {/* Produits similaires */}
          {selectedProduct && (() => {
            const related = allProducts
              .filter((p) => p.id !== selectedProduct.id && p.categoryId === selectedProduct.categoryId)
              .slice(0, 3)
            if (related.length === 0) return null
            return (
              <div className="border-t border-[#e2e8f0] mt-4 pt-4">
                <p className="text-sm font-semibold text-[#1a1a2e] mb-3">Produits similaires</p>
                <div className="grid grid-cols-3 gap-2">
                  {related.map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => { setSelectedProduct(rp); setProductQty(1); setIsFavorited(false) }}
                      className="text-left group"
                    >
                      <div className="h-16 rounded-lg overflow-hidden bg-gray-100 mb-1.5">
                        {rp.image ? (
                          <img src={rp.image} alt={rp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#1a1a2e] line-clamp-1 group-hover:text-[#c8a951] transition-colors duration-150">{rp.name}</p>
                      <p className="text-xs font-bold text-[#1a1a2e]">{formatPrice(rp.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
