'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import { Star, Package, Search, SlidersHorizontal, RotateCcw, Check, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formatPrice } from './helpers'
import type { ProductType, CategoryType, ProductVariantType } from './types'

const MAX_COMPARISON = 4

// ── Variant Selector Component ──────────────────────────────
function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
  size = 'sm',
}: {
  variants: ProductVariantType[]
  selectedVariantId: string | null
  onSelect: (variant: ProductVariantType) => void
  size?: 'sm' | 'md'
}) {
  if (!variants || variants.length === 0) return null
  const btnBase = size === 'sm'
    ? 'px-2.5 py-1 text-[11px] rounded-md'
    : 'px-3 py-1.5 text-xs rounded-lg'
  return (
    <div className="flex flex-wrap gap-1.5">
      {variants.map((v) => {
        const isSelected = selectedVariantId === v.id
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            className={`${btnBase} border transition-all duration-150 font-medium ${
              isSelected
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white text-[#555555] border-[#e5e5e5] hover:border-[#1a1a1a]/30 hover:bg-[#f5f5f5]'
            } ${!v.inStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={!v.inStock}
          >
            {v.name}
          </button>
        )
      })}
    </div>
  )
}

interface ProductsSectionProps {
  products: ProductType[] | undefined
  productsLoading: boolean
  categories: CategoryType[] | undefined
  activeCategory: string
  setActiveCategory: (val: string) => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  sortBy: string
  setSortBy: (val: string) => void
  quickAddedId: string | null
  onQuickAdd: (product: ProductType) => void
  onAddToCart: (product: ProductType) => void
  onViewProduct: (product: ProductType) => void
  comparisonIds: string[]
  onToggleComparison: (id: string) => void
  wishlistToggle: (id: string) => void
  isWishlisted: (id: string) => boolean
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const diff = rating - i
        if (diff >= 1) {
          return <Star key={i} className={`${iconClass} text-[#f59e0b] fill-[#f59e0b]`} />
        } else if (diff >= 0.5) {
          return (
            <span key={i} className="relative inline-block">
              <Star className={`${iconClass} text-gray-200`} />
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className={`${iconClass} text-[#f59e0b] fill-[#f59e0b]`} />
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

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-[#e5e5e5] bg-white shadow-sm">
          <div className="h-56 bg-gray-100">
            <Skeleton className="w-full h-full rounded-none" style={{ animationDelay: `${i * 80}ms` }} />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4 rounded" style={{ animationDelay: `${i * 80 + 60}ms` }} />
            <Skeleton className="h-3 w-1/3 rounded" style={{ animationDelay: `${i * 80 + 120}ms` }} />
            <Skeleton className="h-6 w-1/4 rounded" style={{ animationDelay: `${i * 80 + 180}ms` }} />
            <Skeleton className="h-10 w-full rounded-lg" style={{ animationDelay: `${i * 80 + 240}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductsSection({
  products,
  productsLoading,
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  quickAddedId,
  onQuickAdd,
  onAddToCart,
  onViewProduct,
  comparisonIds,
  onToggleComparison,
  wishlistToggle,
  isWishlisted,
}: ProductsSectionProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.id = 'product-search-input'
    }
  }, [])

  const handleWishlistToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const wasInWishlist = isWishlisted(id)
    wishlistToggle(id)
    if (wasInWishlist) {
      toast.success('Retire des favoris')
    } else {
      toast.success('Ajoute aux favoris')
    }
  }

  const handleCompareToggle = (id: string) => {
    if (comparisonIds.includes(id)) {
      onToggleComparison(id)
      return
    }
    if (comparisonIds.length >= MAX_COMPARISON) {
      toast.warning(`Vous pouvez comparer au maximum ${MAX_COMPARISON} produits a la fois`)
      return
    }
    onToggleComparison(id)
  }

  const categoryTabs = [
    { label: 'Tous', value: 'all' },
    ...(categories || []).map((c) => ({ label: c.name, value: c.id })),
  ]

  const sortedProducts = useMemo(() => {
    if (!products) return products
    const sorted = [...products]
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        break
      case 'name-az':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        break
      default:
        break
    }
    return sorted
  }, [products, sortBy])

  const isFiltered = activeCategory !== 'all' || searchQuery !== ''
  const productCount = sortedProducts?.length || 0

  return (
    <section id="products" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-2">Nos Produits</h2>
          <p className="text-[#555555] max-w-xl">
            Decouvrez notre gamme de produits d'hygiene de qualite industrielle, fabriques avec soin au Congo-Brazzaville.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
            <TabsList className="bg-white border border-[#e5e5e5] shadow-none w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
              {categoryTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white text-[#555555] text-xs sm:text-sm rounded-full data-[state=active]:shadow-none px-3 py-1.5"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
            <div className="relative flex-1 sm:flex-none sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <Input
                ref={searchInputRef}
                id="product-search-input"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] transition-colors duration-150 w-full"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[170px] bg-white border-[#e5e5e5] focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a] transition-colors duration-150">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#888888]" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus recents</SelectItem>
                <SelectItem value="price-asc">Prix croissant</SelectItem>
                <SelectItem value="price-desc">Prix decroissant</SelectItem>
                <SelectItem value="rating">Meilleures notes</SelectItem>
                <SelectItem value="name-az">Nom A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!productsLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#555555]">
              <span className="font-semibold text-[#1a1a1a]">{productCount}</span>{' '}
              {productCount === 1 ? 'produit trouve' : 'produits trouves'}
            </p>
            {isFiltered && (
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
                className="text-sm text-[#1a1a1a] hover:underline font-medium flex items-center gap-1 transition-colors duration-150"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Voir tout
              </button>
            )}
          </div>
        )}

        {productsLoading ? (
          <ProductsLoadingSkeleton />
        ) : sortedProducts && sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quickAddedId={quickAddedId}
                comparisonIds={comparisonIds}
                isWishlisted={isWishlisted}
                onQuickAdd={onQuickAdd}
                onViewProduct={onViewProduct}
                onAddToCart={onAddToCart}
                onWishlistToggle={handleWishlistToggle}
                onCompareToggle={handleCompareToggle}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[#1a1a1a] font-medium text-lg mb-2">Aucun produit trouve</p>
            <p className="text-[#555555] text-sm mb-6">Essayez de modifier vos criteres de recherche</p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('all')
                setSearchQuery('')
              }}
              className="font-medium border-[#e5e5e5] text-[#1a1a1a] hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

// ── ProductCard with variant state ──────────────────────────
function ProductCard({
  product,
  quickAddedId,
  comparisonIds,
  isWishlisted,
  onQuickAdd,
  onViewProduct,
  onAddToCart,
  onWishlistToggle,
  onCompareToggle,
}: {
  product: ProductType
  quickAddedId: string | null
  comparisonIds: string[]
  isWishlisted: (id: string) => boolean
  onQuickAdd: (product: ProductType) => void
  onViewProduct: (product: ProductType) => void
  onAddToCart: (product: ProductType) => void
  onWishlistToggle: (e: React.MouseEvent, id: string) => void
  onCompareToggle: (id: string) => void
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const variants = product.variants || []
  const selectedVariant = selectedVariantId ? variants.find(v => v.id === selectedVariantId) : null
  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const displayImage = selectedVariant?.image || product.image
  const discount = product.comparePrice && product.comparePrice > displayPrice
    ? Math.round(((product.comparePrice - displayPrice) / product.comparePrice) * 100)
    : 0
  const isAdded = quickAddedId === product.id
  const canAddToCart = selectedVariant ? selectedVariant.inStock : product.inStock

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    // We pass variant info via the cart store addItem through onAddToCart
    // The parent (StorefrontLayout) will need to handle variant-aware adding
    onAddToCart(product)
  }

  return (
    <div
      className={`group bg-white border border-[#e5e5e5] rounded-xl overflow-hidden hover:shadow-sm transition-shadow duration-200 flex flex-col cursor-pointer shadow-sm ${isAdded ? 'ring-1 ring-[#1a1a1a]' : ''}`}
      onClick={() => onQuickAdd(product)}
    >
      <div className="relative h-56 bg-[#f5f5f5] overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onViewProduct(product) }}
          className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Voir les details"
        >
          <span className="bg-white/90 text-[#1a1a1a] text-xs font-medium px-4 py-2 rounded-lg border border-[#e5e5e5]">
            Voir les details
          </span>
        </button>

        <button
          onClick={(e) => onWishlistToggle(e, product.id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-white"
          aria-label="Favori"
        >
          <Heart className={`w-4 h-4 transition-colors duration-150 ${isWishlisted(product.id) ? 'text-[#dc2626] fill-[#dc2626]' : 'text-[#555555]'}`} />
        </button>

        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#dc2626] text-white text-[11px] font-medium px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}

        <label
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={comparisonIds.includes(product.id)}
            onCheckedChange={() => onCompareToggle(product.id)}
          />
          <span className="text-[11px] text-[#555555] font-medium">Comparer</span>
        </label>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs text-[#888888] mb-1">{product.category.name}</span>
        )}
        <h3
          onClick={(e) => { e.stopPropagation(); onViewProduct(product) }}
          className="font-medium text-[#1a1a1a] text-sm mb-1 line-clamp-2 cursor-pointer hover:underline transition-colors duration-150"
        >
          {product.name}
        </h3>
        {product.volume && (
          <p className="text-xs text-[#888888] mb-2">{product.volume}</p>
        )}

        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={product.averageRating || 0} size="sm" />
          {product.reviewCount && product.reviewCount > 0 && (
            <span className="text-xs text-[#888888]">({product.reviewCount})</span>
          )}
        </div>

        {!canAddToCart && (
          <span className="text-xs text-[#dc2626] mb-2 font-medium">Rupture de stock</span>
        )}
        {canAddToCart && product.stockQty > 0 && product.stockQty <= (product.minStockAlert || 10) && !selectedVariant && (
          <span className="text-xs text-[#888888] mb-2">Derniers exemplaires</span>
        )}

        {/* Variant selector */}
        {variants.length > 0 && (
          <div className="mb-2">
            <VariantSelector
              variants={variants}
              selectedVariantId={selectedVariantId}
              onSelect={(v) => setSelectedVariantId(prev => prev === v.id ? null : v.id)}
              size="sm"
            />
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-[#1a1a1a]">{formatPrice(displayPrice)}</span>
          {product.comparePrice && product.comparePrice > displayPrice && (
            <span className="text-sm text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
          )}
          {selectedVariant && (
            <span className="text-[11px] text-[#888888]">({selectedVariant.name})</span>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="w-full font-medium h-10 text-sm bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Ajoute
            </>
          ) : (
            'Ajouter'
          )}
        </Button>
      </div>
    </div>
  )
}
