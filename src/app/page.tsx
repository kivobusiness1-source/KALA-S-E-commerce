'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowRight, Star, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'

import { HeroSection } from '@/components/storefront/HeroSection'
import { FeaturesBar } from '@/components/storefront/FeaturesBar'
import { formatPrice } from '@/components/storefront/helpers'
import type { ProductType, CategoryType } from '@/components/storefront/types'

import { HowToOrderSection } from '@/components/storefront/HowToOrderSection'
import { TestimonialsSection } from '@/components/storefront/TestimonialsSection'
import { NewsletterSection } from '@/components/storefront/NewsletterSection'
import { ErrorBoundary } from '@/components/error-boundary'

export default function Home() {
  const cart = useCartStore()
  const wishlist = useWishlistStore()

  // Testimonial state
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Testimonial auto-rotation on mobile
  useEffect(() => {
    if (!isMobile) return
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [isMobile])

  // Fetch products for featured section
  const { data: products } = useQuery<ProductType[]>({
    queryKey: ['products', 'all', ''],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      return data.data || data.products || data
    },
  })

  // Add to cart handler
  const handleAddToCart = useCallback((product: ProductType) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      volume: product.volume,
    })
    toast.success(`${product.name} ajouté au panier`)
  }, [cart])

  // Newsletter submit
  const handleNewsletterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) {
      toast.error('Veuillez entrer votre email')
      return
    }
    setNewsletterLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      if (res.ok) {
        setNewsletterSuccess(true)
        setNewsletterEmail('')
        setTimeout(() => setNewsletterSuccess(false), 3000)
      } else {
        toast.error('Erreur lors de l\'inscription')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setNewsletterLoading(false)
    }
  }, [newsletterEmail])

  // Get featured products (first 6)
  const featuredProducts = (products || []).slice(0, 6)

  return (
    <StorefrontLayout>
      <ErrorBoundary title="Bannière indisponible" compact>
        <HeroSection />
      </ErrorBoundary>
      <FeaturesBar />

      {/* Featured Products Section */}
      <ErrorBoundary title="Produits indisponibles" description="Impossible de charger les produits pour le moment.">
        <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Produits Populaires</h2>
              <p className="text-[#555555] mt-2">Découvrez nos produits les plus demandés</p>
            </div>
            <Link
              href="/produits"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1a1a] hover:underline"
            >
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-[#e5e5e5] hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-200">{product.name.charAt(0)}</span>
                    </div>
                  )}
                  {/* Wishlist button */}
                  <button
                    onClick={() => wishlist.toggleItem(product.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Favoris"
                  >
                    <Star className={`w-4 h-4 ${wishlist.isInWishlist(product.id) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-gray-400'}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  <p className="text-xs text-[#888888] mb-1">{product.brand || 'KALA\'S'}</p>
                  <h3 className="text-sm font-semibold text-[#1a1a1a] line-clamp-2 mb-1">{product.name}</h3>
                  {product.volume && (
                    <p className="text-xs text-[#888888] mb-2">{product.volume}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-[#1a1a1a]">{formatPrice(product.price)}</span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-xs text-[#888888] line-through ml-1.5">{formatPrice(product.comparePrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
                      aria-label="Ajouter au panier"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile "see all" link */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/produits"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a1a1a] hover:underline"
            >
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      </ErrorBoundary>

      <ErrorBoundary compact>
        <HowToOrderSection />
      </ErrorBoundary>
      <ErrorBoundary compact>
        <TestimonialsSection
          activeTestimonial={activeTestimonial}
          setActiveTestimonial={setActiveTestimonial}
          isMobile={isMobile}
        />
      </ErrorBoundary>
      <ErrorBoundary compact>
        <NewsletterSection
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          newsletterLoading={newsletterLoading}
          newsletterSuccess={newsletterSuccess}
          onSubmit={handleNewsletterSubmit}
        />
      </ErrorBoundary>
    </StorefrontLayout>
  )
}
