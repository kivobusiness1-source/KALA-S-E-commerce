'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Star, Package, Search, SlidersHorizontal, RotateCcw, Check, Heart,
  Grid3X3, List, Truck, ChevronDown, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatPrice } from './helpers'
import type { ProductType, CategoryType } from './types'

const MAX_COMPARISON = 4

// ===== Star Rating =====
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
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

// ===== Loading Skeleton =====
function ProductsLoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
            <Skeleton className="w-40 h-40 rounded-md shrink-0" style={{ animationDelay: `${i * 80}ms` }} />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4 rounded" style={{ animationDelay: `${i * 80 + 60}ms` }} />
              <Skeleton className="h-3 w-1/3 rounded" style={{ animationDelay: `${i * 80 + 120}ms` }} />
              <Skeleton className="h-6 w-1/4 rounded" style={{ animationDelay: `${i * 80 + 180}ms` }} />
              <Skeleton className="h-10 w-36 rounded-lg" style={{ animationDelay: `${i * 80 + 240}ms` }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
          <div className="h-60 bg-gray-100">
            <Skeleton className="w-full h-full rounded-none" style={{ animationDelay: `${i * 80}ms` }} />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-1/3 rounded" style={{ animationDelay: `${i * 80 + 60}ms` }} />
            <Skeleton className="h-5 w-3/4 rounded" style={{ animationDelay: `${i * 80 + 90}ms` }} />
            <Skeleton className="h-3 w-1/2 rounded" style={{ animationDelay: `${i * 80 + 120}ms` }} />
            <Skeleton className="h-6 w-1/3 rounded" style={{ animationDelay: `${i * 80 + 180}ms` }} />
            <Skeleton className="h-10 w-full rounded-lg" style={{ animationDelay: `${i * 80 + 240}ms` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ===== Filter Sidebar Content =====
function FilterSidebar({
  categories,
  selectedCategories,
  toggleCategory,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  selectedVolumes,
  toggleVolume,
  inStockOnly,
  setInStockOnly,
  clearAllFilters,
  productCount,
}: {
  categories: CategoryType[]
  selectedCategories: string[]
  toggleCategory: (id: string) => void
  priceMin: string
  priceMax: string
  setPriceMin: (v: string) => void
  setPriceMax: (v: string) => void
  selectedVolumes: string[]
  toggleVolume: (v: string) => void
  inStockOnly: boolean
  setInStockOnly: (v: boolean) => void
  clearAllFilters: () => void
  productCount: number
}) {
  const volumes = ['1L', '5L', '10L', '20L', '500g']
  const hasActiveFilters = selectedCategories.length > 0 || priceMin || priceMax || selectedVolumes.length > 0 || inStockOnly

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1a1a1a] text-base">Filtres</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-[#1a1a1a] hover:underline font-medium flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Tout effacer
          </button>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div>
        <h4 className="font-medium text-sm text-[#1a1a1a] mb-3">Catégories</h4>
        <div className="space-y-2.5">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer group">
              <Checkbox
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
                className="data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:border-[#1a1a1a]"
              />
              <span className="text-sm text-[#555555] group-hover:text-[#1a1a1a] transition-colors">
                {cat.name}
              </span>
              {cat._count && (
                <span className="text-xs text-[#888888] ml-auto">({cat._count.products})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-sm text-[#1a1a1a] mb-3">Prix (FCFA)</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-9 text-sm border-gray-200 focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]"
          />
          <span className="text-[#888888] text-sm">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-9 text-sm border-gray-200 focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a]"
          />
        </div>
      </div>

      <Separator />

      {/* Volume */}
      <div>
        <h4 className="font-medium text-sm text-[#1a1a1a] mb-3">Volume / Conditionnement</h4>
        <div className="flex flex-wrap gap-2">
          {volumes.map((vol) => (
            <button
              key={vol}
              onClick={() => toggleVolume(vol)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-150 ${
                selectedVolumes.includes(vol)
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-[#555555] border-gray-200 hover:border-[#1a1a1a] hover:text-[#1a1a1a]'
              }`}
            >
              {vol}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* In Stock Toggle */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <Checkbox
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
            className="data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:border-[#1a1a1a]"
          />
          <span className="text-sm text-[#555555] group-hover:text-[#1a1a1a] transition-colors">
            En stock uniquement
          </span>
        </label>
      </div>

      <Separator />

      {/* Results count */}
      <p className="text-sm text-[#888888]">
        <span className="font-semibold text-[#1a1a1a]">{productCount}</span> résultat{productCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ===== Product Card - Grid View =====
function ProductCardGrid({
  product,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  isAdded,
  isCompared,
  onToggleComparison,
}: {
  product: ProductType
  isWishlisted: boolean
  onWishlistToggle: (e: React.MouseEvent) => void
  onAddToCart: () => void
  isAdded: boolean
  isCompared: boolean
  onToggleComparison: () => void
}) {
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col relative">
      {/* Image */}
      <Link href={`/produits/${product.slug}`} className="block relative h-56 bg-[#f5f5f5] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded z-10">
            -{discount}%
          </span>
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-2 left-2 bg-white/90 text-[#555555] text-[10px] font-medium px-2 py-0.5 rounded z-10 shadow-sm" style={{ left: discount > 0 ? '3.5rem' : '0.5rem' }}>
            {product.category.name}
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={onWishlistToggle}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-all z-10"
          aria-label="Favori"
        >
          <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-[#555555] hover:text-red-500'}`} />
        </button>

        {/* Compare checkbox */}
        <label
          className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 rounded-full px-2 py-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isCompared}
            onCheckedChange={onToggleComparison}
            className="h-3.5 w-3.5 data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:border-[#1a1a1a]"
          />
          <span className="text-[10px] text-[#555555] font-medium">Comparer</span>
        </label>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Volume badge */}
        {product.volume && (
          <Badge variant="secondary" className="w-fit text-[10px] mb-2 bg-gray-100 text-[#555555] border-0 font-medium">
            {product.volume}
          </Badge>
        )}

        {/* Name */}
        <Link href={`/produits/${product.slug}`} className="block">
          <h3 className="font-medium text-[#1a1a1a] text-sm mb-1.5 line-clamp-2 hover:text-amber-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2">
          <StarRating rating={product.averageRating || 0} size="sm" />
          {product.reviewCount && product.reviewCount > 0 && (
            <span className="text-xs text-[#888888]">({product.reviewCount})</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>

        {/* Stock status */}
        {product.inStock ? (
          <span className="text-xs font-medium text-emerald-600 mb-1">En stock</span>
        ) : (
          <span className="text-xs font-medium text-red-500 mb-1">Rupture</span>
        )}

        {/* Delivery estimate */}
        {product.inStock && (
          <div className="flex items-center gap-1 mb-3">
            <Truck className="w-3.5 h-3.5 text-[#555555]" />
            <span className="text-[11px] text-[#555555]">Livraison 24-48h à Pointe-Noire</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Add to cart */}
        <Button
          onClick={onAddToCart}
          disabled={!product.inStock}
          className="w-full font-semibold h-10 text-sm bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-md"
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-1.5" />
              Ajouté
            </>
          ) : (
            'Ajouter au panier'
          )}
        </Button>
      </div>
    </div>
  )
}

// ===== Product Card - List View =====
function ProductCardList({
  product,
  isWishlisted,
  onWishlistToggle,
  onAddToCart,
  isAdded,
  isCompared,
  onToggleComparison,
}: {
  product: ProductType
  isWishlisted: boolean
  onWishlistToggle: (e: React.MouseEvent) => void
  onAddToCart: () => void
  isAdded: boolean
  isCompared: boolean
  onToggleComparison: () => void
}) {
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex">
      {/* Image */}
      <Link href={`/produits/${product.slug}`} className="block relative w-40 sm:w-48 shrink-0 bg-[#f5f5f5] overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center min-h-[160px]">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded z-10">
            -{discount}%
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Category + Volume */}
            <div className="flex items-center gap-2 mb-1">
              {product.category && (
                <span className="text-xs text-[#888888] font-medium">{product.category.name}</span>
              )}
              {product.volume && (
                <Badge variant="secondary" className="text-[10px] bg-gray-100 text-[#555555] border-0 font-medium h-5">
                  {product.volume}
                </Badge>
              )}
            </div>

            {/* Name */}
            <Link href={`/produits/${product.slug}`}>
              <h3 className="font-medium text-[#1a1a1a] text-base mb-1.5 line-clamp-2 hover:text-amber-600 transition-colors leading-snug">
                {product.name}
              </h3>
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-2">
              <StarRating rating={product.averageRating || 0} size="sm" />
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-[#888888]">({product.reviewCount})</span>
              )}
            </div>
          </div>

          {/* Wishlist + Compare */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onWishlistToggle}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
              aria-label="Favori"
            >
              <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-[#555555]'}`} />
            </button>
            <label className="flex items-center gap-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isCompared}
                onCheckedChange={onToggleComparison}
                className="h-3.5 w-3.5 data-[state=checked]:bg-[#1a1a1a] data-[state=checked]:border-[#1a1a1a]"
              />
              <span className="text-[10px] text-[#555555]">Comparer</span>
            </label>
          </div>
        </div>

        {/* Price + Stock + Delivery + Cart */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-sm text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
            {product.inStock ? (
              <span className="text-xs font-medium text-emerald-600">En stock</span>
            ) : (
              <span className="text-xs font-medium text-red-500">Rupture</span>
            )}
            {product.inStock && (
              <div className="flex items-center gap-1 mt-0.5">
                <Truck className="w-3.5 h-3.5 text-[#555555]" />
                <span className="text-[11px] text-[#555555]">Livraison 24-48h à Pointe-Noire</span>
              </div>
            )}
          </div>
          <Button
            onClick={onAddToCart}
            disabled={!product.inStock}
            className="font-semibold h-10 text-sm bg-[#1a1a1a] hover:bg-[#333] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-6"
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Ajouté
              </>
            ) : (
              'Ajouter au panier'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ===== Main Component =====
interface AmazonProductsSectionProps {
  products: ProductType[] | undefined
  productsLoading: boolean
  categories: CategoryType[] | undefined
  quickAddedId: string | null
  onQuickAdd: (product: ProductType) => void
  onAddToCart: (product: ProductType) => void
  comparisonIds: string[]
  onToggleComparison: (id: string) => void
  wishlistToggle: (id: string) => void
  isWishlisted: (id: string) => boolean
}

export function AmazonProductsSection({
  products,
  productsLoading,
  categories,
  quickAddedId,
  onQuickAdd,
  onAddToCart,
  comparisonIds,
  onToggleComparison,
  wishlistToggle,
  isWishlisted,
}: AmazonProductsSectionProps) {
  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Sort
  const [sortBy, setSortBy] = useState('newest')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [selectedVolumes, setSelectedVolumes] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)

  // Mobile filter sheet
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }, [])

  const toggleVolume = useCallback((vol: string) => {
    setSelectedVolumes((prev) =>
      prev.includes(vol) ? prev.filter((v) => v !== vol) : [...prev, vol]
    )
  }, [])

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([])
    setPriceMin('')
    setPriceMax('')
    setSelectedVolumes([])
    setInStockOnly(false)
    setSearchQuery('')
  }, [])

  const handleWishlistToggle = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    const wasInWishlist = isWishlisted(id)
    wishlistToggle(id)
    if (wasInWishlist) {
      toast.success('Retiré des favoris')
    } else {
      toast.success('Ajouté aux favoris')
    }
  }, [isWishlisted, wishlistToggle])

  const handleCompareToggle = useCallback((id: string) => {
    if (comparisonIds.includes(id)) {
      onToggleComparison(id)
      return
    }
    if (comparisonIds.length >= MAX_COMPARISON) {
      toast.warning(`Vous pouvez comparer au maximum ${MAX_COMPARISON} produits à la fois`)
      return
    }
    onToggleComparison(id)
  }, [comparisonIds, onToggleComparison])

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    if (!products) return products
    let filtered = [...products]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.name.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.categoryId))
    }

    // Price filter
    if (priceMin) {
      const min = parseFloat(priceMin)
      if (!isNaN(min)) filtered = filtered.filter((p) => p.price >= min)
    }
    if (priceMax) {
      const max = parseFloat(priceMax)
      if (!isNaN(max)) filtered = filtered.filter((p) => p.price <= max)
    }

    // Volume filter
    if (selectedVolumes.length > 0) {
      filtered = filtered.filter((p) => p.volume && selectedVolumes.includes(p.volume))
    }

    // In stock filter
    if (inStockOnly) {
      filtered = filtered.filter((p) => p.inStock)
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        break
      case 'best-sellers':
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        break
    }

    return filtered
  }, [products, searchQuery, selectedCategories, priceMin, priceMax, selectedVolumes, inStockOnly, sortBy])

  const productCount = filteredProducts?.length || 0
  const hasActiveFilters = selectedCategories.length > 0 || priceMin || priceMax || selectedVolumes.length > 0 || inStockOnly || searchQuery

  const filterSidebarContent = (
    <FilterSidebar
      categories={categories || []}
      selectedCategories={selectedCategories}
      toggleCategory={toggleCategory}
      priceMin={priceMin}
      priceMax={priceMax}
      setPriceMin={setPriceMin}
      setPriceMax={setPriceMax}
      selectedVolumes={selectedVolumes}
      toggleVolume={toggleVolume}
      inStockOnly={inStockOnly}
      setInStockOnly={setInStockOnly}
      clearAllFilters={clearAllFilters}
      productCount={productCount}
    />
  )

  return (
    <section className="py-8 sm:py-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* LEFT SIDEBAR - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24">
              {filterSidebarContent}
            </div>
          </aside>

          {/* MAIN AREA */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5 bg-white rounded-lg border border-gray-200 px-4 py-3">
              {/* Mobile filter button */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden h-9 text-sm border-gray-200 text-[#555555] hover:text-[#1a1a1a]">
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                    Filtres
                    {hasActiveFilters && (
                      <span className="ml-1.5 w-5 h-5 rounded-full bg-[#1a1a1a] text-white text-[10px] flex items-center justify-center font-semibold">
                        !
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="border-b border-gray-200 p-4">
                    <SheetTitle>Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="p-5 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {filterSidebarContent}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Results count */}
              <span className="text-sm text-[#555555]">
                <span className="font-semibold text-[#1a1a1a]">{productCount}</span> résultat{productCount !== 1 ? 's' : ''}
              </span>

              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-white border-gray-200 focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#1a1a1a]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-9 text-sm bg-white border-gray-200 focus:ring-[#1a1a1a]/10 focus:border-[#1a1a1a]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="best-sellers">Meilleures ventes</SelectItem>
                  <SelectItem value="rating">Note moyenne</SelectItem>
                </SelectContent>
              </Select>

              {/* View toggle */}
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#555555] hover:bg-gray-50'}`}
                  aria-label="Vue grille"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#555555] hover:bg-gray-50'}`}
                  aria-label="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active filters tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {selectedCategories.map((catId) => {
                  const cat = categories?.find((c) => c.id === catId)
                  return cat ? (
                    <span key={catId} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-[#555555]">
                      {cat.name}
                      <button onClick={() => toggleCategory(catId)} className="text-[#888888] hover:text-[#1a1a1a]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null
                })}
                {selectedVolumes.map((vol) => (
                  <span key={vol} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-[#555555]">
                    {vol}
                    <button onClick={() => toggleVolume(vol)} className="text-[#888888] hover:text-[#1a1a1a]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-[#555555]">
                    En stock
                    <button onClick={() => setInStockOnly(false)} className="text-[#888888] hover:text-[#1a1a1a]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-[#555555]">
                    &ldquo;{searchQuery}&rdquo;
                    <button onClick={() => setSearchQuery('')} className="text-[#888888] hover:text-[#1a1a1a]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#1a1a1a] hover:underline font-medium"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Products Grid / List */}
            {productsLoading ? (
              <ProductsLoadingSkeleton viewMode={viewMode} />
            ) : filteredProducts && filteredProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCardGrid
                      key={product.id}
                      product={product}
                      isWishlisted={isWishlisted(product.id)}
                      onWishlistToggle={(e) => handleWishlistToggle(e, product.id)}
                      onAddToCart={() => onAddToCart(product)}
                      isAdded={quickAddedId === product.id}
                      isCompared={comparisonIds.includes(product.id)}
                      onToggleComparison={() => handleCompareToggle(product.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <ProductCardList
                      key={product.id}
                      product={product}
                      isWishlisted={isWishlisted(product.id)}
                      onWishlistToggle={(e) => handleWishlistToggle(e, product.id)}
                      onAddToCart={() => onAddToCart(product)}
                      isAdded={quickAddedId === product.id}
                      isCompared={comparisonIds.includes(product.id)}
                      onToggleComparison={() => handleCompareToggle(product.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-[#1a1a1a] font-semibold text-lg mb-2">Aucun produit trouvé</p>
                <p className="text-[#555555] text-sm mb-6">Essayez de modifier vos critères de recherche</p>
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="font-medium border-gray-200 text-[#1a1a1a] hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
