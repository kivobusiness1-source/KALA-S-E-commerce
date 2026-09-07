'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { AmazonProductsSection } from '@/components/storefront/AmazonProductsSection'
import type { ProductType, CategoryType } from '@/components/storefront/types'

import dynamic from 'next/dynamic'
const DeliveryPricingSection = dynamic(() => import('@/components/storefront/DeliveryPricingSection').then(m => ({ default: m.DeliveryPricingSection })), { ssr: false })
const FAQSection = dynamic(() => import('@/components/storefront/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false })

export default function ProduitsPage() {
  const cart = useCartStore()
  const wishlist = useWishlistStore()

  // Quick add feedback
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null)

  // Comparison state
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  const toggleComparison = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) return prev.filter((pid) => pid !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

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

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<ProductType[]>({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      return data.data || data.products || data
    },
  })

  // Add to cart handler
  const handleAddToCart = useCallback((product: ProductType, quantity?: number) => {
    const qty = quantity || 1
    for (let i = 0; i < qty; i++) {
      cart.addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        volume: product.volume,
      })
    }
    toast.success(`${product.name}${qty > 1 ? ` ×${qty}` : ''} ajouté au panier`)
  }, [cart])

  // Quick add handler
  const handleQuickAdd = useCallback((product: ProductType) => {
    handleAddToCart(product)
    setQuickAddedId(product.id)
    setTimeout(() => setQuickAddedId(null), 800)
  }, [handleAddToCart])

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-[#888888]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1a1a1a] flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1a1a1a] font-medium">Produits</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <section className="py-8 sm:py-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Nos Produits</h1>
          <p className="text-[#555555] mt-2 max-w-2xl">
            Découvrez notre gamme complète de produits d&apos;hygiène fabriqués à Pointe-Noire. Savon liquide, détergent, eau de Javel — qualité industrielle à prix accessible.
          </p>
        </div>
      </section>

      {/* Amazon-style Product Catalog */}
      <AmazonProductsSection
        products={products}
        productsLoading={productsLoading}
        categories={categories}
        quickAddedId={quickAddedId}
        onQuickAdd={handleQuickAdd}
        onAddToCart={handleAddToCart}
        comparisonIds={comparisonIds}
        onToggleComparison={toggleComparison}
        wishlistToggle={wishlist.toggleItem}
        isWishlisted={wishlist.isInWishlist}
      />

      <DeliveryPricingSection />
      <FAQSection />
    </StorefrontLayout>
  )
}
