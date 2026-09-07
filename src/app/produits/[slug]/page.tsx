'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Star, Home, ChevronRight, Truck, Heart, Minus, Plus, ShieldCheck,
  Package, Check, Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { formatPrice } from '@/components/storefront/helpers'
import type { ProductType, CategoryType, ReviewType } from '@/components/storefront/types'

// ===== Star Rating =====
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const diff = rating - i
        if (diff >= 1) {
          return <Star key={i} className={`${iconClass} text-amber-400 fill-amber-400`} />
        } else if (diff >= 0.5) {
          return (
            <span key={i} className="relative inline-block">
              <Star className={`${iconClass} text-gray-200`} />
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className={`${iconClass} text-amber-400 fill-amber-400`} />
              </span>
            </span>
          )
        } else {
          return <Star key={i} className={`${iconClass} text-gray-200`} />
        }
      })}
    </div>
  )
}

// ===== Product Card (for similar / bought together) =====
function MiniProductCard({ product, onAddToCart }: { product: ProductType; onAddToCart: (p: ProductType) => void }) {
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
      <Link href={`/produits/${product.slug}`} className="block relative h-44 bg-[#f5f5f5] overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/produits/${product.slug}`}>
          <h4 className="font-medium text-[#1a1a1a] text-sm line-clamp-2 hover:text-amber-600 transition-colors leading-snug mb-1">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center gap-1.5 mb-1.5">
          <StarRating rating={product.averageRating || 0} size="sm" />
          {product.reviewCount && product.reviewCount > 0 && (
            <span className="text-xs text-[#888888]">({product.reviewCount})</span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-base font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>
        <div className="flex-1" />
        <Button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className="w-full h-9 text-xs font-semibold bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 rounded-md"
        >
          Ajouter au panier
        </Button>
      </div>
    </div>
  )
}

// ===== Review Card =====
function ReviewCard({ review }: { review: ReviewType }) {
  return (
    <div className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <StarRating rating={review.rating} size="sm" />
      </div>
      <p className="text-sm font-medium text-[#1a1a1a] mb-1">{review.customerName}</p>
      {review.comment && (
        <p className="text-sm text-[#555555] leading-relaxed">{review.comment}</p>
      )}
      <p className="text-xs text-[#888888] mt-2">
        {new Date(review.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}

// ===== Main Page =====
export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const cart = useCartStore()
  const wishlist = useWishlistStore()

  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Fetch product by slug
  const { data: product, isLoading: productLoading, error: productError } = useQuery<ProductType>({
    queryKey: ['product-slug', slug],
    queryFn: async () => {
      const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error('Product not found')
      const data = await res.json()
      return data.data || data
    },
    enabled: !!slug,
  })

  // Fetch all products for similar/bought together
  const { data: allProducts } = useQuery<ProductType[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      return data.data || data.products || data
    },
  })

  // Fetch categories
  const { data: categories } = useQuery<CategoryType[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      return data.data || data.categories || data
    },
  })

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: async () => {
      if (!product) return null
      const res = await fetch(`/api/products/${product.id}/reviews`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      return data.data || data
    },
    enabled: !!product?.id,
  })

  const reviews: ReviewType[] = reviewsData?.reviews || []
  const avgRating: number = reviewsData?.averageRating || product?.averageRating || 0
  const totalReviews: number = reviewsData?.totalReviews || product?.reviewCount || 0

  // Parse images
  const productImages = useMemo(() => {
    if (!product) return []
    let imgs: string[] = []
    if (product.images) {
      try {
        imgs = JSON.parse(product.images)
      } catch {
        // ignore
      }
    }
    if (product.image && !imgs.includes(product.image)) {
      imgs = [product.image, ...imgs]
    }
    return imgs.filter(Boolean)
  }, [product])

  // Similar products (same category)
  const similarProducts = useMemo(() => {
    if (!product || !allProducts) return []
    return allProducts
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4)
  }, [product, allProducts])

  // Bought together (different category)
  const boughtTogether = useMemo(() => {
    if (!product || !allProducts) return []
    return allProducts
      .filter((p) => p.categoryId !== product.categoryId && p.id !== product.id)
      .slice(0, 4)
  }, [product, allProducts])

  // Add to cart
  const handleAddToCart = useCallback(() => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      cart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        volume: product.volume,
      })
    }
    toast.success(`${product.name}${quantity > 1 ? ` ×${quantity}` : ''} ajouté au panier`)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }, [product, quantity, cart])

  // Wishlist toggle
  const handleWishlistToggle = useCallback(() => {
    if (!product) return
    const wasInWishlist = wishlist.isInWishlist(product.id)
    wishlist.toggleItem(product.id)
    if (wasInWishlist) {
      toast.success('Retiré des favoris')
    } else {
      toast.success('Ajouté aux favoris')
    }
  }, [product, wishlist])

  // Review submit
  const handleReviewSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !reviewForm.customerName) {
      toast.error('Veuillez entrer votre nom')
      return
    }
    setReviewSubmitting(true)
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: reviewForm.customerName,
          rating: reviewForm.rating,
          comment: reviewForm.comment || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Avis ajouté avec succès !')
        setReviewForm({ customerName: '', rating: 5, comment: '' })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de l\'ajout de l\'avis')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setReviewSubmitting(false)
    }
  }, [product, reviewForm])

  // Quick add for similar products
  const handleQuickAdd = useCallback((p: ProductType) => {
    cart.addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      volume: p.volume,
    })
    toast.success(`${p.name} ajouté au panier`)
  }, [cart])

  const discount = product?.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  // Loading state
  if (productLoading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <Skeleton className="w-full h-[400px] rounded-lg mb-4" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-md" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4 rounded" />
              <Skeleton className="h-5 w-1/3 rounded" />
              <Skeleton className="h-10 w-1/2 rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    )
  }

  // Error / not found
  if (productError || !product) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Produit introuvable</h1>
          <p className="text-[#555555] mb-6">Ce produit n&apos;existe pas ou a été retiré.</p>
          <Link href="/produits">
            <Button className="bg-[#1a1a1a] hover:bg-[#333] text-white">
              Retour aux produits
            </Button>
          </Link>
        </div>
      </StorefrontLayout>
    )
  }

  const categoryName = product.category?.name || ''
  const categorySlug = product.category?.slug || ''

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-[#888888] flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1a1a1a] flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/produits" className="hover:text-[#1a1a1a] transition-colors">Produits</Link>
            {categoryName && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/produits`} className="hover:text-[#1a1a1a] transition-colors">{categoryName}</Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1a1a1a] font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-8 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* LEFT COLUMN - Images + Tabs (60%) */}
            <div className="lg:col-span-3">
              {/* Main Image */}
              <div className="relative bg-[#f5f5f5] rounded-lg overflow-hidden mb-4 aspect-square max-h-[500px]">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[activeImageIndex] || product.image || ''}
                    alt={product.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                ) : product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-300" />
                  </div>
                )}

                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-semibold px-3 py-1 rounded z-10">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        idx === activeImageIndex ? 'border-[#1a1a1a]' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Tabs */}
              <Tabs defaultValue="description" className="mt-6">
                <TabsList className="bg-gray-100 border border-gray-200 w-full justify-start rounded-lg p-1 h-auto">
                  <TabsTrigger value="description" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm rounded-md px-4 py-2">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="specs" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm rounded-md px-4 py-2">
                    Caractéristiques
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm rounded-md px-4 py-2">
                    Avis ({totalReviews})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-4">
                  <div className="prose prose-sm max-w-none text-[#555555]">
                    {product.description ? (
                      <p className="leading-relaxed">{product.description}</p>
                    ) : (
                      <p className="text-[#888888] italic">Aucune description disponible.</p>
                    )}
                    {product.longDescription && (
                      <div className="mt-4 leading-relaxed whitespace-pre-line">{product.longDescription}</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="specs" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                      <span className="text-sm text-[#888888] w-36 shrink-0">Catégorie</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">{categoryName}</span>
                    </div>
                    {product.volume && (
                      <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                        <span className="text-sm text-[#888888] w-36 shrink-0">Volume</span>
                        <span className="text-sm font-medium text-[#1a1a1a]">{product.volume}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                      <span className="text-sm text-[#888888] w-36 shrink-0">Prix</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">{formatPrice(product.price)}</span>
                    </div>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                        <span className="text-sm text-[#888888] w-36 shrink-0">Prix habituel</span>
                        <span className="text-sm text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                      <span className="text-sm text-[#888888] w-36 shrink-0">Disponibilité</span>
                      <span className={`text-sm font-medium ${product.inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                        {product.inStock ? 'En stock' : 'Rupture de stock'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 py-2 border-b border-gray-100">
                      <span className="text-sm text-[#888888] w-36 shrink-0">Référence</span>
                      <span className="text-sm font-medium text-[#1a1a1a]">{product.slug}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-4">
                  {/* Review summary */}
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a1a1a]">{avgRating.toFixed(1)}</p>
                      <StarRating rating={avgRating} size="sm" />
                      <p className="text-xs text-[#888888] mt-1">{totalReviews} avis</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length
                        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-[#888888] w-3">{star}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-[#888888] w-6 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Review list */}
                  {reviews.length > 0 ? (
                    <div className="mb-6">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#888888] mb-6">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
                  )}

                  {/* Review form */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-[#1a1a1a] text-sm mb-3">Laisser un avis</h4>
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Votre nom"
                        value={reviewForm.customerName}
                        onChange={(e) => setReviewForm((f) => ({ ...f, customerName: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#555555]">Note :</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                              className="p-0.5"
                            >
                              <Star className={`w-5 h-5 transition-colors ${star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 hover:text-amber-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        placeholder="Votre commentaire (optionnel)"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] bg-white resize-none"
                      />
                      <Button
                        type="submit"
                        disabled={reviewSubmitting}
                        className="bg-[#1a1a1a] hover:bg-[#333] text-white text-sm h-9"
                      >
                        {reviewSubmitting ? 'Envoi...' : 'Publier l\'avis'}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* RIGHT COLUMN - Product Info (40%) */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-4">
                {/* Product Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <StarRating rating={avgRating} size="md" />
                  <span className="text-sm text-[#555555]">
                    {avgRating.toFixed(1)} ({totalReviews} avis)
                  </span>
                </div>

                <Separator />

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-lg text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-sm text-red-600 font-medium">Économie de {formatPrice(product.comparePrice! - product.price)} ({discount}%)</p>
                )}

                {/* Volume */}
                {product.volume && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-[#555555] border-0 font-medium">
                      {product.volume}
                    </Badge>
                  </div>
                )}

                <Separator />

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  {product.inStock ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-emerald-600">En stock</span>
                      {product.stockQty > 0 && product.stockQty <= (product.minStockAlert || 10) && (
                        <span className="text-xs text-amber-600 font-medium ml-2">Plus que {product.stockQty} en stock</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-sm font-medium text-red-500">Rupture de stock</span>
                    </>
                  )}
                </div>

                {/* Delivery Info */}
                <div className="bg-emerald-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Livraison 24-48h à Pointe-Noire</span>
                  </div>
                  <p className="text-xs text-emerald-600 pl-7">
                    Livraison GRATUITE dès 25 000 FCFA
                  </p>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="text-sm font-medium text-[#1a1a1a] mb-2 block">Quantité</label>
                  <div className="flex items-center gap-0 w-fit border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-[#555555] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 1 && val <= 99) setQuantity(val)
                      }}
                      className="w-14 h-10 text-center text-sm font-medium border-x border-gray-200 focus:outline-none bg-white"
                      min={1}
                      max={99}
                    />
                    <button
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      disabled={quantity >= 99}
                      className="w-10 h-10 flex items-center justify-center text-[#555555] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full h-12 text-base font-semibold bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Ajouté au panier !
                    </>
                  ) : (
                    'Ajouter au panier'
                  )}
                </Button>

                {/* Buy Now Button */}
                <Button
                  variant="outline"
                  disabled={!product.inStock}
                  onClick={() => {
                    handleAddToCart()
                    cart.setCartOpen(true)
                  }}
                  className="w-full h-11 text-sm font-medium border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-50 disabled:opacity-40 rounded-lg"
                >
                  Acheter maintenant
                </Button>

                {/* Wishlist + Share */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleWishlistToggle}
                    className="flex-1 h-9 text-sm border-gray-200 text-[#555555] hover:text-red-500 hover:border-red-200 rounded-md"
                  >
                    <Heart className={`w-4 h-4 mr-1.5 ${wishlist.isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    {wishlist.isInWishlist(product.id) ? 'Dans les favoris' : 'Ajouter aux favoris'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Lien copié !')
                    }}
                    className="h-9 w-9 p-0 border-gray-200 text-[#555555] hover:text-[#1a1a1a] rounded-md"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                <Separator />

                {/* Selling Points */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-[#555555]">Qualité garantie — fabriqué à Pointe-Noire</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-[#555555]">Livraison rapide dans tout Pointe-Noire</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Package className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-[#555555]">Retrait gratuit en boutique possible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="py-10 bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">Produits similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similarProducts.map((p) => (
                <MiniProductCard key={p.id} product={p} onAddToCart={handleQuickAdd} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bought Together */}
      {boughtTogether.length > 0 && (
        <section className="py-10 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">Clients ayant acheté cet article ont aussi acheté</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {boughtTogether.map((p) => (
                <MiniProductCard key={p.id} product={p} onAddToCart={handleQuickAdd} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1a1a1a] truncate">{product.name}</p>
            <p className="text-lg font-bold text-[#1a1a1a]">{formatPrice(product.price)}</p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="h-11 px-6 font-semibold bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 rounded-lg shrink-0"
          >
            {addedToCart ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Ajouté
              </>
            ) : (
              'Ajouter'
            )}
          </Button>
        </div>
      </div>

      {/* Bottom padding for mobile sticky bar */}
      <div className="lg:hidden h-20" />
    </StorefrontLayout>
  )
}
