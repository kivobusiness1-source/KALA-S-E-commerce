'use client'

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Megaphone } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import { useCustomerAuthStore } from '@/stores/customer-auth-store'
import { useAffiliateAuthStore } from '@/stores/affiliate-auth-store'
import { useImageErrorFallback } from '@/hooks/useImageErrorFallback'

import { Navbar } from '@/components/storefront/Navbar'
import { MarqueeText } from '@/components/storefront/AnimatedComponents'
import type { ProductType, CategoryType, ReviewType, TrackedOrder } from '@/components/storefront/types'

import { CartSheet } from '@/components/storefront/CartSheet'
import { Footer } from '@/components/storefront/Footer'
import WhatsAppWidget from '@/components/storefront/WhatsAppWidget'
import { SocialProofToast } from '@/components/storefront/SocialProofToast'
import { ProductComparison } from '@/components/storefront/ProductComparison'
import { CustomerAuthDialog } from '@/components/storefront/CustomerAuthDialog'
import { CustomerDashboard } from '@/components/storefront/CustomerDashboard'
import { AffiliateAuthDialog } from '@/components/storefront/AffiliateAuthDialog'
import { AffiliateDashboard } from '@/components/storefront/AffiliateDashboard'

import type { DeliveryZoneId } from '@/components/storefront/CartSheet'

interface StorefrontLayoutProps {
  children: ReactNode
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  // Gestion d'erreur globale : remplace toute image cassée par un placeholder de marque
  useImageErrorFallback()

  // Promo bar state
  const [promoText, setPromoText] = useState('Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567')
  const [promoBarVisible, setPromoBarVisible] = useState(true)

  // Navigation state
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)

  // Quick add feedback
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null)

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<ProductType[]>([])

  // Cookie consent
  const [cookieConsentVisible, setCookieConsentVisible] = useState(false)

  // Products state (shared for cart, comparison, etc.)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [contactLoading, setContactLoading] = useState(false)

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', address: '' })
  const [orderLoading, setOrderLoading] = useState(false)

  // Order tracking state
  const [trackEmail, setTrackEmail] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([])

  // Loyalty points state
  const [earnedPoints, setEarnedPoints] = useState(0)

  // Comparison state
  const [comparisonIds, setComparisonIds] = useState<string[]>([])

  const toggleComparison = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pid) => pid !== id)
      }
      if (prev.length >= 4) {
        return prev
      }
      return [...prev, id]
    })
  }

  const clearComparison = () => {
    setComparisonIds([])
  }

  // Delivery zone state
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZoneId>('centre-ville')

  // Reviews state
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviews, setReviews] = useState<ReviewType[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Cart store
  const cart = useCartStore()

  // Wishlist store
  const wishlist = useWishlistStore()

  // Customer auth store
  const customerAuth = useCustomerAuthStore()
  const [customerAuthOpen, setCustomerAuthOpen] = useState(false)
  const [customerDashboardOpen, setCustomerDashboardOpen] = useState(false)

  // Affiliate auth store
  const affiliateAuth = useAffiliateAuthStore()
  const [affiliateAuthOpen, setAffiliateAuthOpen] = useState(false)
  const [affiliateDashboardOpen, setAffiliateDashboardOpen] = useState(false)

  // Fetch auth state on mount
  useEffect(() => {
    customerAuth.fetchMe()
    affiliateAuth.fetchMe()
  }, [])

  // Capture ?ref= affiliate URL parameter on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const refCode = params.get('ref')
      if (refCode) {
        // Store in localStorage for persistence
        localStorage.setItem('kalas_affiliate_ref', refCode)
        // Store in cookie (expires in 30 days)
        document.cookie = `kalas_affiliate_ref=${encodeURIComponent(refCode)};path=/;max-age=${30 * 24 * 60 * 60};SameSite=Lax`
        // Apply to cart store (validate async)
        ;(async () => {
          try {
            const res = await fetch(`/api/affiliate-validate?code=${encodeURIComponent(refCode)}`)
            if (res.ok) {
              const data = await res.json()
              if (data.valid && data.affiliate) {
                cart.setAffiliateCode(refCode, data.affiliate.name)
              } else {
                cart.setAffiliateCode(refCode)
              }
            }
          } catch {
            cart.setAffiliateCode(refCode)
          }
        })()
        // Clean up URL without reloading
        const url = new URL(window.location.href)
        url.searchParams.delete('ref')
        window.history.replaceState({}, '', url.pathname + url.hash)
      } else {
        // Check localStorage / cookie for previously stored code
        const storedCode = localStorage.getItem('kalas_affiliate_ref')
        if (storedCode && !cart.affiliateCode) {
          ;(async () => {
            try {
              const res = await fetch(`/api/affiliate-validate?code=${encodeURIComponent(storedCode)}`)
              if (res.ok) {
                const data = await res.json()
                if (data.valid && data.affiliate) {
                  cart.setAffiliateCode(storedCode, data.affiliate.name)
                }
              }
            } catch {
              // silently ignore
            }
          })()
        }
      }
    } catch {
      // SSR or no window
    }
  }, [])

  // Page load animation
  const [pageLoaded, setPageLoaded] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = requestAnimationFrame(() => setPageLoaded(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cookie consent check
  useEffect(() => {
    const consent = localStorage.getItem('kalas_cookie_consent')
    if (!consent) {
      setCookieConsentVisible(true)
    }
  }, [])

  // Fetch site settings for promo banner
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/site-settings')
        if (res.ok) {
          const data = await res.json()
          const settings = data.data || data.settings || data
          if (settings.promo_banner_text) {
            setPromoText(settings.promo_banner_text)
          }
          if (typeof settings.promo_banner_enabled === 'boolean') {
            setPromoBarVisible(settings.promo_banner_enabled)
          }
        }
      } catch {
        // Use default values on error
      }
    }
    fetchSettings()
  }, [])

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
    queryKey: ['products', activeCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeCategory !== 'all' && activeCategory) params.set('categoryId', activeCategory)
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      return data.data || data.products || data
    },
  })

  // Fetch reviews when product is selected
  const fetchReviews = useCallback(async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        const reviewData = data.data || data
        setReviews(reviewData.reviews || [])
        setAvgRating(reviewData.averageRating || 0)
        setTotalReviews(reviewData.totalReviews || 0)
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchReviews(selectedProduct.id)
      setShowReviewForm(false)
      setReviewForm({ customerName: '', rating: 5, comment: '' })
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((p) => p.id !== selectedProduct.id)
        return [selectedProduct, ...filtered].slice(0, 5)
      })
    }
  }, [selectedProduct, fetchReviews])

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

  // Contact form submit
  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setContactLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        toast.success('Message envoyé avec succès !')
        setContactForm({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        toast.error('Erreur lors de l\'envoi du message')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setContactLoading(false)
    }
  }, [contactForm])

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

  // Order submit
  const handleOrderSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderForm.customerName || !orderForm.customerEmail || !orderForm.customerPhone || !orderForm.address) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setOrderLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderForm,
          items: cart.items.map((item) => ({
            productId: item.id,
            variantId: item.variantId || undefined,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          affiliateCode: cart.affiliateCode || undefined,
        }),
      })
      if (res.ok) {
        const result = await res.json()
        const orderData = result.data || result
        const pts = orderData.earnedPoints || Math.floor(cart.totalPrice() / 1000)
        setEarnedPoints(pts)
        toast.success('Commande passée avec succès !')
        cart.clearCart()
        cart.setCartOpen(false)
        setOrderDialogOpen(false)
        setOrderForm({ customerName: '', customerEmail: '', customerPhone: '', address: '' })
        if (orderForm.customerEmail) {
          localStorage.setItem('kalas_loyalty_email', orderForm.customerEmail)
        }
        setTimeout(() => setEarnedPoints(0), 8000)
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Erreur lors de la commande')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setOrderLoading(false)
    }
  }, [orderForm, cart])

  // Order tracking submit
  const handleTrackOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackEmail) {
      toast.error('Veuillez entrer votre email')
      return
    }
    setTrackLoading(true)
    setTrackedOrders([])
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trackEmail }),
      })
      if (res.ok) {
        const data = await res.json()
        const orders = data.data || data.orders || []
        setTrackedOrders(orders)
        if (orders.length === 0) {
          toast.info('Aucune commande trouvée pour cet email')
        }
      } else {
        toast.error('Erreur lors de la recherche')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setTrackLoading(false)
    }
  }, [trackEmail])

  // Submit review
  const handleReviewSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !reviewForm.customerName) {
      toast.error('Veuillez entrer votre nom')
      return
    }
    setReviewLoading(true)
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}/reviews`, {
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
        setShowReviewForm(false)
        await fetchReviews(selectedProduct.id)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de l\'ajout de l\'avis')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setReviewLoading(false)
    }
  }, [selectedProduct, reviewForm, fetchReviews])

  return (
    <div
      ref={pageRef}
      className={`min-h-screen flex flex-col bg-white transition-opacity duration-500 ${pageLoaded ? 'opacity-100' : 'opacity-0'}`}
    >
      <Navbar
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartTotalItems={cart.totalItems()}
        onCartOpen={() => cart.setCartOpen(true)}
        onCustomerAuth={() => setCustomerAuthOpen(true)}
        onAffiliateAuth={() => setAffiliateAuthOpen(true)}
        onCustomerDashboard={() => setCustomerDashboardOpen(true)}
        onAffiliateDashboard={() => setAffiliateDashboardOpen(true)}
      />

      {/* Promotional Banner Bar */}
      {promoBarVisible && (
        <div className="relative w-full bg-[#1a1a1a] h-10 flex items-center overflow-hidden">
          <div className="flex items-center pl-3 pr-2 shrink-0">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 overflow-hidden">
            <MarqueeText speed={25} className="py-2">
              <span className="mx-8 text-white text-xs sm:text-sm">{promoText}</span>
            </MarqueeText>
          </div>
          <button
            onClick={() => setPromoBarVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
            aria-label="Fermer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main>{children}</main>

      <ProductComparison
        comparisonIds={comparisonIds}
        products={products}
        onToggleComparison={toggleComparison}
        onClearComparison={clearComparison}
      />

      <Footer
        recentlyViewed={recentlyViewed}
        setSelectedProduct={setSelectedProduct}
        showBackToTop={showBackToTop}
        cookieConsentVisible={cookieConsentVisible}
        setCookieConsentVisible={setCookieConsentVisible}
      />

      <CartSheet
        items={cart.items}
        cartIsOpen={cart.isOpen}
        setCartOpen={cart.setCartOpen}
        totalItems={cart.totalItems()}
        totalPrice={cart.totalPrice()}
        updateQuantity={cart.updateQuantity}
        removeItem={cart.removeItem}
        clearCart={cart.clearCart}
        scrollToSection={() => {}}
        deliveryZone={deliveryZone}
        setDeliveryZone={setDeliveryZone}
        orderDialogOpen={orderDialogOpen}
        setOrderDialogOpen={setOrderDialogOpen}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        orderLoading={orderLoading}
        onOrderSubmit={handleOrderSubmit}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        onAddToCart={handleAddToCart}
        reviews={reviews}
        avgRating={avgRating}
        totalReviews={totalReviews}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        reviewLoading={reviewLoading}
        showReviewForm={showReviewForm}
        setShowReviewForm={setShowReviewForm}
        onReviewSubmit={handleReviewSubmit}
        earnedPoints={earnedPoints}
        products={products || []}
        affiliateCode={cart.affiliateCode}
        affiliateName={cart.affiliateName}
        setAffiliateCode={cart.setAffiliateCode}
        clearAffiliateCode={cart.clearAffiliateCode}
      />

      <WhatsAppWidget />
      <SocialProofToast products={products} />

      {/* Customer Auth Dialog */}
      <CustomerAuthDialog
        open={customerAuthOpen}
        onOpenChange={setCustomerAuthOpen}
        onSwitchToDashboard={() => { setCustomerAuthOpen(false); setCustomerDashboardOpen(true) }}
      />

      {/* Customer Dashboard */}
      <CustomerDashboard
        open={customerDashboardOpen}
        onOpenChange={setCustomerDashboardOpen}
        onLogout={() => { setCustomerDashboardOpen(false) }}
      />

      {/* Affiliate Auth Dialog */}
      <AffiliateAuthDialog
        open={affiliateAuthOpen}
        onOpenChange={setAffiliateAuthOpen}
        onSwitchToDashboard={() => { setAffiliateAuthOpen(false); setAffiliateDashboardOpen(true) }}
      />

      {/* Affiliate Dashboard */}
      <AffiliateDashboard
        open={affiliateDashboardOpen}
        onOpenChange={setAffiliateDashboardOpen}
        onLogout={() => { setAffiliateDashboardOpen(false) }}
      />
    </div>
  )
}
