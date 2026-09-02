'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ShoppingCart, Package, Plus, Minus, Trash2, ChevronRight, ChevronLeft, Truck, Star, Heart } from 'lucide-react'
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
    <div className="inline-flex items-center rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
      <button
        onClick={onDecrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#888888]"
        aria-label="Diminuer"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-medium tabular-nums select-none text-[#1a1a1a]">{quantity}</span>
      <button
        onClick={onIncrease}
        className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#888888]"
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
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

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

  // Product image gallery helpers
  const productImages = useMemo(() => {
    if (!selectedProduct) return []
    try {
      const parsed: string[] = JSON.parse(selectedProduct.images || '[]')
      // Include main image if not already in the array
      const mainImg = selectedProduct.image
      if (mainImg && !parsed.includes(mainImg)) {
        return [mainImg, ...parsed]
      }
      return parsed.length > 0 ? parsed : (mainImg ? [mainImg] : [])
    } catch {
      return selectedProduct.image ? [selectedProduct.image] : []
    }
  }, [selectedProduct])

  const handleImageNav = useCallback((dir: -1 | 1) => {
    setSelectedImageIdx((prev) => {
      const next = prev + dir
      if (next < 0) return productImages.length - 1
      if (next >= productImages.length) return 0
      return next
    })
  }, [productImages.length])

  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  const currentImageUrl = productImages[selectedImageIdx] || null

  return (
    <>
      <Sheet open={cartIsOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-white">
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-[#e5e5e5]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-[#1a1a1a]">
                <ShoppingCart className="w-5 h-5" />
                Panier
                {totalItems > 0 && (
                  <span className="text-sm font-normal text-[#888888]">({totalItems})</span>
                )}
              </SheetTitle>
              <SheetDescription className="text-[#888888]">Vos produits selectionnes</SheetDescription>
            </SheetHeader>
          </div>

          {/* Delivery zone selector */}
          {items.length > 0 && (
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-[#888888]" />
                <span className="text-xs font-medium text-[#1a1a1a]">Zone de livraison</span>
              </div>
              <Select value={deliveryZone} onValueChange={(v) => setDeliveryZone(v as DeliveryZoneId)}>
                <SelectTrigger className="w-full h-8 text-xs bg-white border-[#e5e5e5]">
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
            <div className="px-4 py-2.5 border-b border-[#e5e5e5] bg-[#fafafa]">
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#1a1a1a] rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-[#888888] mt-1.5">
                {totalPrice >= freeThreshold ? (
                  <span className="text-[#16a34a] font-medium">Livraison gratuite !</span>
                ) : (
                  <>Plus que <span className="font-semibold text-[#1a1a1a]">{(freeThreshold - totalPrice).toLocaleString('fr-FR')} FCFA</span> pour la livraison gratuite</>
                )}
              </p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#1a1a1a] font-semibold">Votre panier est vide</p>
                <p className="text-[#888888] text-sm mt-1 max-w-[200px] mx-auto">Ajoutez des produits pour commencer vos achats</p>
                <Button
                  className="mt-5 bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white font-medium"
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
                      className="flex gap-3 py-3 border-b border-[#e5e5e5] last:border-0"
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
                        <h4 className="font-medium text-[#1a1a1a] text-sm truncate">{item.name}</h4>
                        {item.volume && (
                          <p className="text-xs text-[#888888]">{item.volume}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-[#888888]">{formatPrice(item.price)} x {item.quantity}</span>
                          <span className="text-xs text-gray-300">=</span>
                          <span className="text-sm font-bold text-[#1a1a1a]">{formatPrice(item.price * item.quantity)}</span>
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

              <SheetFooter className="border-t border-[#e5e5e5] bg-white p-4 gap-3">
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#888888]">Sous-total</span>
                    <span className="text-[#1a1a1a] font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#888888]">Livraison ({zone.label})</span>
                    <span className={deliveryFee === 0 ? 'text-[#16a34a] font-medium' : 'text-[#1a1a1a] font-medium'}>
                      {deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {earnedPoints > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#555555]">Points fidelite gagnes</span>
                      <span className="text-[#555555] font-medium">+{earnedPoints}</span>
                    </div>
                  )}
                  <Separator className="bg-[#e5e5e5]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[#1a1a1a] font-semibold">Total</span>
                    <span className="text-xl font-bold text-[#1a1a1a]">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                  <Button
                    onClick={() => { setOrderDialogOpen(true) }}
                    className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold h-11"
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
              Total : <span className="font-semibold text-[#1a1a1a]">{formatPrice(totalPrice + deliveryFee)}</span>
              {deliveryFee > 0 && (
                <span className="text-[#888888]"> (dont {formatPrice(deliveryFee)} de livraison)</span>
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
                  className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
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
                  className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
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
                  className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
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
                  className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[#e5e5e5] text-[#1a1a1a]"
                  onClick={() => setOrderDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={orderLoading}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white font-semibold"
                >
                  {orderLoading ? 'Envoi en cours...' : 'Confirmer la commande'}
                </Button>
              </div>
            </form>

            {/* Summary sidebar */}
            <div className="md:w-56 shrink-0">
              <div className="bg-[#fafafa] rounded-xl p-4 border border-[#e5e5e5] sticky top-0">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-3">Recapitulatif</h4>
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
                        <p className="text-xs font-medium text-[#1a1a1a] truncate">{item.name}</p>
                        <p className="text-[11px] text-[#888888]">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#1a1a1a]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3 bg-[#e5e5e5]" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#888888]">
                    <span>Sous-total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#888888]">
                    <span>Livraison</span>
                    <span className={deliveryFee === 0 ? 'text-[#16a34a]' : ''}>{deliveryFee === 0 ? 'Gratuite' : formatPrice(deliveryFee)}</span>
                  </div>
                  <Separator className="bg-[#e5e5e5]" />
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-[#1a1a1a]">Total</span>
                    <span className="text-[#1a1a1a]">{formatPrice(totalPrice + deliveryFee)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog key={selectedProduct?.id || 'none'} open={!!selectedProduct} onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setProductQty(1); setIsFavorited(false) } }}>
        <DialogContent className="sm:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          {selectedProduct && (
            <div className="flex flex-col md:flex-row">
              {/* Left: Image gallery (60%) */}
              <div className="md:w-[60%] shrink-0">
                <div className="relative">
                  {/* Main image */}
                  <div
                    ref={imageRef}
                    className="relative aspect-square bg-[#f5f5f5] overflow-hidden"
                    onMouseMove={handleImageMouseMove}
                    onMouseEnter={() => setZoomPos({ x: 50, y: 50 })}
                    onMouseLeave={() => setZoomPos(null)}
                  >
                    {currentImageUrl ? (
                      <img
                        src={currentImageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                      </div>
                    )}

                    {/* Navigation arrows (only if multiple images) */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={() => handleImageNav(-1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#e5e5e5] flex items-center justify-center hover:bg-white transition-colors duration-150"
                          aria-label="Image precedente"
                        >
                          <ChevronLeft className="w-4 h-4 text-[#1a1a1a]" />
                        </button>
                        <button
                          onClick={() => handleImageNav(1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-[#e5e5e5] flex items-center justify-center hover:bg-white transition-colors duration-150"
                          aria-label="Image suivante"
                        >
                          <ChevronRight className="w-4 h-4 text-[#1a1a1a]" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Zoom panel (desktop only) */}
                  {zoomPos && currentImageUrl && (
                    <div className="hidden md:block absolute top-0 right-0 w-[50%] h-full border-l border-[#e5e5e5] pointer-events-none z-10 bg-[#f5f5f5]">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${currentImageUrl})`,
                          backgroundSize: '200% 200%',
                          backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                          backgroundRepeat: 'no-repeat',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`shrink-0 w-[60px] h-[60px] rounded-lg overflow-hidden border-2 transition-colors duration-150 ${idx === selectedImageIdx ? 'border-[#1a1a1a]' : 'border-[#e5e5e5]'}`}
                      >
                        <img src={img} alt={`${selectedProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product details (40%) */}
              <div className="md:w-[40%] p-5 md:p-6 flex flex-col">
                <DialogHeader className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2">
                    {selectedProduct.category && (
                      <span className="text-xs text-[#888888]">{selectedProduct.category.name}</span>
                    )}
                    {selectedProduct.volume && <span className="text-xs text-[#888888]">{selectedProduct.volume}</span>}
                  </div>
                  <DialogTitle className="text-xl leading-tight">{selectedProduct.name}</DialogTitle>
                  <DialogDescription className="sr-only">Details du produit</DialogDescription>
                </DialogHeader>

                {/* Rating summary */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-4 h-4 ${si < Math.round(avgRating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-[#888888]">
                    {avgRating > 0 ? `${avgRating}/5` : 'Pas encore d\'avis'}
                    {totalReviews > 0 && ` (${totalReviews})`}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-2xl font-bold text-[#1a1a1a]">{formatPrice(selectedProduct.price)}</span>
                  {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                    <>
                      <span className="text-base text-[#888888] line-through">{formatPrice(selectedProduct.comparePrice)}</span>
                      <span className="text-xs font-medium text-[#dc2626] bg-red-50 px-1.5 py-0.5 rounded">
                        -{Math.round(((selectedProduct.comparePrice - selectedProduct.price) / selectedProduct.comparePrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Stock status */}
                <div className="flex items-center gap-2 mb-4">
                  {!selectedProduct.inStock ? (
                    <span className="text-sm text-[#dc2626] font-medium">Rupture de stock</span>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                      <span className="text-sm text-[#888888]">En stock</span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-[#888888] leading-relaxed mb-5 line-clamp-4">
                  {selectedProduct.longDescription || selectedProduct.description || 'Aucune description disponible pour ce produit.'}
                </p>

                {/* Quantity selector */}
                {selectedProduct.inStock && (
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-sm font-medium text-[#1a1a1a]">Quantite :</span>
                    <div className="inline-flex items-center rounded-lg border border-[#e5e5e5] bg-white overflow-hidden">
                      <button
                        onClick={() => setProductQty(Math.max(1, productQty - 1))}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#555555]"
                        aria-label="Diminuer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold tabular-nums select-none text-[#1a1a1a]">{productQty}</span>
                      <button
                        onClick={() => setProductQty(Math.min(99, productQty + 1))}
                        className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors duration-150 text-[#555555]"
                        aria-label="Augmenter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedProduct.inStock && (
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() => setIsFavorited(!isFavorited)}
                      variant="outline"
                      className="shrink-0 w-11 h-11 p-0 border-[#e5e5e5] hover:bg-red-50 hover:border-red-200 hover:text-[#dc2626] transition-colors duration-150"
                      aria-label="Favoris"
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-[#dc2626] text-[#dc2626]' : ''}`} />
                    </Button>
                    <Button
                      onClick={() => { onAddToCart(selectedProduct, productQty); setSelectedProduct(null); setProductQty(1) }}
                      className="flex-1 bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white font-semibold h-11"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews section below the main layout */}
          {selectedProduct && (
            <div className="border-t border-[#e5e5e5] px-5 md:px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">Avis clients</h3>
                  {totalReviews > 0 && (
                    <span className="text-xs text-[#888888]">({totalReviews})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-3.5 h-3.5 ${si < Math.round(avgRating) ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-[#888888]">
                    {avgRating > 0 ? `${avgRating}/5` : ''}
                  </span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-[#f5f5f5] rounded-lg p-3.5 border border-[#e5e5e5]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                            <span className="text-[#1a1a1a] font-semibold text-xs">{getInitials(review.customerName)}</span>
                          </div>
                          <span className="text-sm font-medium text-[#1a1a1a]">{review.customerName}</span>
                        </div>
                        <span className="text-xs text-[#888888]">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-1.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} className={`w-3 h-3 ${si < review.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-[#555555] leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#888888] mb-4">
                  <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Aucun avis pour le moment</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-[#e5e5e5] text-[#1a1a1a]"
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
                    className="space-y-3 border border-[#e5e5e5] rounded-lg p-4 mt-3 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="review-name">Nom <span className="text-[#dc2626]">*</span></Label>
                      <Input
                        id="review-name"
                        placeholder="Votre nom"
                        value={reviewForm.customerName}
                        onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                        required
                        className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
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
                            <Star className={`w-6 h-6 ${si < reviewForm.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-300'}`} />
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
                        className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]/30"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={reviewLoading}
                      className="w-full bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white font-semibold"
                    >
                      {reviewLoading ? 'Envoi en cours...' : 'Publier l\'avis'}
                    </Button>
                  </form>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Produits similaires */}
          {selectedProduct && (() => {
            const related = allProducts
              .filter((p) => p.id !== selectedProduct.id && p.categoryId === selectedProduct.categoryId)
              .slice(0, 3)
            if (related.length === 0) return null
            return (
              <div className="border-t border-[#e5e5e5] px-5 md:px-6 py-4">
                <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Produits similaires</p>
                <div className="grid grid-cols-3 gap-2">
                  {related.map((rp) => (
                    <button
                      key={rp.id}
                      onClick={() => { setSelectedProduct(rp); setProductQty(1); setIsFavorited(false) }}
                      className="text-left group"
                    >
                      <div className="h-16 rounded-lg overflow-hidden bg-[#f5f5f5] mb-1.5">
                        {rp.image ? (
                          <img src={rp.image} alt={rp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#1a1a1a] line-clamp-1 group-hover:underline transition-colors duration-150">{rp.name}</p>
                      <p className="text-xs font-bold text-[#1a1a1a]">{formatPrice(rp.price)}</p>
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
