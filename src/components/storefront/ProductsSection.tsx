'use client'

import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Star, Eye, Package, Search, GitCompareArrows, SlidersHorizontal, Heart, ShoppingBag, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { FadeInSection } from './AnimatedComponents'
import { formatPrice, getCategoryColor, getCategoryInitial, isNewProduct } from './helpers'
import type { ProductType, CategoryType } from './types'

const MAX_COMPARISON = 4

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
  // Comparison
  comparisonIds: string[]
  onToggleComparison: (id: string) => void
  // Wishlist
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

function ProductsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-white">
          <div className="relative h-48 bg-gray-100">
            <Skeleton className="w-full h-full rounded-none" style={{ animationDelay: `${i * 120}ms` }} />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-1/3 rounded-full" style={{ animationDelay: `${i * 120 + 80}ms` }} />
            <Skeleton className="h-6 w-3/4 rounded-full" style={{ animationDelay: `${i * 120 + 160}ms` }} />
            <Skeleton className="h-4 w-1/4 rounded-full" style={{ animationDelay: `${i * 120 + 240}ms` }} />
            <Skeleton className="h-10 w-full rounded-full" style={{ animationDelay: `${i * 120 + 320}ms` }} />
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
      toast.success('Retiré des favoris')
    } else {
      toast.success('Ajouté aux favoris')
    }
  }

  const handleCompareToggle = (id: string) => {
    if (comparisonIds.includes(id)) {
      onToggleComparison(id)
      return
    }
    if (comparisonIds.length >= MAX_COMPARISON) {
      toast.warning(`Vous pouvez comparer au maximum ${MAX_COMPARISON} produits à la fois`)
      return
    }
    onToggleComparison(id)
  }

  const categoryTabs = [
    { label: 'Tous', value: 'all' },
    ...(categories || []).map((c) => ({ label: c.name, value: c.id })),
  ]

  // Client-side sorting with useMemo
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
      case 'newest':
      default:
        // API default order - no client sort needed
        break
    }
    return sorted
  }, [products, sortBy])

  const isFiltered = activeCategory !== 'all' || searchQuery !== ''
  const productCount = sortedProducts?.length || 0

  return (
    <section id="products" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Nos Produits</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Découvrez notre gamme de produits d&rsquo;hygiène de qualité industrielle, fabriqués avec soin au Congo-Brazzaville.
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
              <TabsList className="bg-white border border-gray-200 shadow-sm w-full sm:w-auto flex flex-wrap">
                {categoryTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search + Sort controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors duration-300" />
                <Input
                  ref={searchInputRef}
                  id="product-search-input"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300 w-full"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all duration-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récents</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Meilleures notes</SelectItem>
                  <SelectItem value="name-az">Nom A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count + Voir tout link */}
          {!productsLoading && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{productCount}</span>{' '}
                {productCount === 1 ? 'produit trouvé' : 'produits trouvés'}
              </p>
              {isFiltered && (
                <button
                  onClick={() => {
                    setActiveCategory('all')
                    setSearchQuery('')
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Voir tout
                </button>
              )}
            </div>
          )}
        </FadeInSection>

        {/* Products Grid */}
        {productsLoading ? (
          <ProductsLoadingSkeleton />
        ) : sortedProducts && sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product, index) => {
              const discount = product.comparePrice && product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0
              const catSlug = product.category?.slug || ''
              const gradient = getCategoryColor(catSlug)
              const initial = getCategoryInitial(catSlug)
              const isNew = isNewProduct(product.createdAt)

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group"
                >
                  {/* Gradient border wrapper on hover */}
                  <div className="p-[2px] rounded-xl bg-transparent group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-teal-400 transition-all duration-500">
                    <Card
                      className={`overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col cursor-pointer bg-white rounded-[10px] ${quickAddedId === product.id ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                      onClick={() => onQuickAdd(product)}
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden group/img">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                            <span className="text-5xl font-bold text-white/30 select-none">{initial}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 transition-colors" />
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewProduct(product) }}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-label="Voir les détails"
                        >
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                            <Eye className="w-5 h-5 text-emerald-700" />
                          </div>
                        </button>
                        {/* Heart + Compare row */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => handleWishlistToggle(e, product.id)}
                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                            aria-label="Favori"
                          >
                            <Heart className={`w-4 h-4 transition-colors duration-200 ${isWishlisted(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                          </motion.button>
                          <label
                            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-2.5 py-1 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={comparisonIds.includes(product.id)}
                              onCheckedChange={() => handleCompareToggle(product.id)}
                              className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <span className="text-[11px] text-gray-600 font-medium whitespace-nowrap">Comparer</span>
                          </label>
                        </div>
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.isFeatured && (
                            <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">
                              <Star className="w-3 h-3 mr-1" />
                              Vedette
                            </Badge>
                          )}
                          {discount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                              -{discount}%
                            </Badge>
                          )}
                          {isNew && (
                            <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 animate-[pulse_2s_ease-in-out_infinite]">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        {product.volume && (
                          <div className="absolute bottom-3 right-3">
                            <Badge variant="secondary" className="bg-white/90 text-gray-800 text-xs">
                              {product.volume}
                            </Badge>
                          </div>
                        )}
                        {comparisonIds.includes(product.id) && (
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-emerald-600 text-white text-xs animate-[pulse_2s_ease-in-out_infinite]">
                              <GitCompareArrows className="w-3 h-3 mr-1" />
                              Comparé
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col flex-1">
                        {product.category && (
                          <Badge variant="outline" className="w-fit text-xs mb-2 text-emerald-700 border-emerald-200 bg-emerald-50">
                            {product.category.name}
                          </Badge>
                        )}
                        <h3
                          onClick={(e) => { e.stopPropagation(); onViewProduct(product) }}
                          className="font-semibold text-gray-900 text-base mb-1 line-clamp-2 cursor-pointer hover:text-emerald-700 transition-colors"
                        >
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-500 text-sm mb-2 line-clamp-2 flex-1">{product.description}</p>
                        )}
                        {/* Star rating display */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <StarRating rating={product.averageRating || 0} size="sm" />
                          <span className="text-xs text-gray-400">{product.averageRating && product.averageRating > 0 ? `(${product.averageRating})` : ''}{product.reviewCount && product.reviewCount > 0 ? ` · ${product.reviewCount} avis` : ''}</span>
                        </div>
                        {product.inStock
                          ? (product.stockQty > 10
                            ? <span className="text-xs text-emerald-600 mb-1">En stock</span>
                            : <span className="text-xs text-amber-600 mb-1">Plus que {product.stockQty} en stock</span>
                          )
                          : <span className="text-xs text-red-500 mb-1">Rupture de stock</span>
                        }
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-lg font-bold text-emerald-700">{formatPrice(product.price)}</span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={(e) => { e.stopPropagation(); onViewProduct(product) }}
                            variant="outline"
                            size="icon"
                            className="shrink-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            aria-label="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter au panier
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            {/* CSS Shopping Bag Illustration */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-dashed border-emerald-200 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-emerald-300" strokeWidth={1.5} />
              </div>
              {/* Small decorative circles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-100 border border-amber-200" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-teal-100 border border-teal-200" />
            </div>
            <p className="text-gray-500 text-lg mb-2">Aucun produit trouvé</p>
            <p className="text-gray-400 text-sm mb-6">Essayez de modifier vos critères de recherche</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
                className="font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
              <Button
                onClick={() => {
                  setActiveCategory('all')
                  setSearchQuery('')
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <Package className="w-4 h-4 mr-2" />
                Parcourir tous les produits
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}