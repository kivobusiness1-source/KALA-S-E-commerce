'use client'

import { useMemo } from 'react'
import { ShoppingCart, Package, Plus, Minus, Trash2, ChevronRight, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  const zone = DELIVERY_ZONES.find((z) => z.id === deliveryZone) || DELIVERY_ZONES[0]
  const deliveryFee = useMemo(() => {
    if (zone.freeThreshold === 0) return 0
    if (totalPrice >= zone.freeThreshold) return 0
    return zone.fee
  }, [zone, totalPrice])
  const freeThreshold = zone.freeThreshold
  const progressPct = freeThreshold > 0 ? Math.min((totalPrice / freeThreshold) * 100, 100) : 100
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
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-1">Ajoutez des produits pour commencer</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setCartOpen(false)
                    scrollToSection('products')
                  }}
                >
                  Voir les produits
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <div className="space-y-3 py-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50/50 transition-colors duration-200"
                    >
                      {/* Item image */}
                      <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
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
                        <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-red-50 text-red-500 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
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
                    onClick={() => setOrderDialogOpen(true)}
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

      {/* Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Passer la commande</DialogTitle>
            <DialogDescription>
              Remplissez vos informations pour finaliser la commande de{' '}
              <span className="font-semibold text-emerald-700">{formatPrice(totalPrice + deliveryFee)}</span>
              {deliveryFee > 0 && (
                <span className="text-gray-500"> (dont {formatPrice(deliveryFee)} de livraison)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onOrderSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="order-name">Nom complet <span className="text-red-500">*</span></Label>
              <Input
                id="order-name"
                placeholder="Votre nom"
                value={orderForm.customerName}
                onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                required
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
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{totalItems} article(s)</span> — Sous-total:{' '}
                <span className="font-semibold text-emerald-700">{formatPrice(totalPrice)}</span>
              </p>
              {deliveryFee > 0 && (
                <p className="text-sm text-gray-500">
                  Livraison ({zone.label}) : {formatPrice(deliveryFee)}
                </p>
              )}
              <p className="text-sm text-gray-900 font-bold">
                Total : {formatPrice(totalPrice + deliveryFee)}
              </p>
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
                {orderLoading ? '...' : 'Confirmer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
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
            <div className="h-40 rounded-xl bg-gray-100 overflow-hidden">
              {selectedProduct?.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${selectedProduct ? getCategoryColor(selectedProduct.category?.slug || '') : ''} flex items-center justify-center`}>
                  <span className="text-6xl font-bold text-white/30">{selectedProduct ? getCategoryInitial(selectedProduct.category?.slug || '') : ''}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 leading-relaxed">{selectedProduct?.longDescription || selectedProduct?.description || ''}</p>
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

            {/* Reviews list */}
            {reviews.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-3">
                  Avis clients ({totalReviews})
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
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
              </div>
            )}

            {/* Review toggle button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <Star className="w-4 h-4 mr-2" />
              {showReviewForm ? 'Fermer le formulaire' : 'Laisser un avis'}
            </Button>

            {/* Review form */}
            {showReviewForm && (
              <form onSubmit={onReviewSubmit} className="space-y-3 border border-gray-200 rounded-lg p-4">
                <div className="space-y-2">
                  <Label htmlFor="review-name">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="review-name"
                    placeholder="Votre nom"
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                    required
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
              </form>
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