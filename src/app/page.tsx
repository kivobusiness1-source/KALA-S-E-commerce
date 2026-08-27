'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Megaphone } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'

import { Navbar } from '@/components/storefront/Navbar'
import { HeroSection } from '@/components/storefront/HeroSection'
import { FeaturesBar } from '@/components/storefront/FeaturesBar'
import { ProductsSection } from '@/components/storefront/ProductsSection'
import { MarqueeText } from '@/components/storefront/AnimatedComponents'
import type { ProductType, CategoryType, ChatMessageType, ReviewType, TrackedOrder } from '@/components/storefront/types'

// Lazy-loaded below-the-fold and heavy components to reduce Turbopack compilation memory
const HowToOrderSection = dynamic(() => import('@/components/storefront/HowToOrderSection').then(m => ({ default: m.HowToOrderSection })), { ssr: false })
const AboutSection = dynamic(() => import('@/components/storefront/AboutSection').then(m => ({ default: m.AboutSection })), { ssr: false })
const TestimonialsSection = dynamic(() => import('@/components/storefront/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })), { ssr: false })
const DeliveryPricingSection = dynamic(() => import('@/components/storefront/DeliveryPricingSection').then(m => ({ default: m.DeliveryPricingSection })), { ssr: false })
const OrderTrackingSection = dynamic(() => import('@/components/storefront/OrderTrackingSection').then(m => ({ default: m.OrderTrackingSection })), { ssr: false })
const FAQSection = dynamic(() => import('@/components/storefront/FAQSection').then(m => ({ default: m.FAQSection })), { ssr: false })
const NewsletterSection = dynamic(() => import('@/components/storefront/NewsletterSection').then(m => ({ default: m.NewsletterSection })), { ssr: false })
const ContactSection = dynamic(() => import('@/components/storefront/ContactSection').then(m => ({ default: m.ContactSection })), { ssr: false })
const FlashSaleSection = dynamic(() => import('@/components/storefront/FlashSaleSection').then(m => ({ default: m.FlashSaleSection })), { ssr: false })
const CartSheet = dynamic(() => import('@/components/storefront/CartSheet').then(m => ({ default: m.CartSheet })), { ssr: false })
const ChatWidget = dynamic(() => import('@/components/storefront/ChatWidget').then(m => ({ default: m.ChatWidget })), { ssr: false })
const Footer = dynamic(() => import('@/components/storefront/Footer').then(m => ({ default: m.Footer })), { ssr: false })
const SocialProofToast = dynamic(() => import('@/components/storefront/SocialProofToast').then(m => ({ default: m.SocialProofToast })), { ssr: false })
const ProductComparison = dynamic(() => import('@/components/storefront/ProductComparison').then(m => ({ default: m.ProductComparison })), { ssr: false })
import type { DeliveryZoneId } from '@/components/storefront/CartSheet'

export default function Home() {
  // Promo bar state
  const [promoText, setPromoText] = useState('🎉 Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567 🎉')
  const [promoBarVisible, setPromoBarVisible] = useState(true)

  // Navigation scroll state
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)

  // Quick add feedback
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null)

  // Testimonial auto-rotation
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Newsletter success
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0)

  // Recently viewed
  const [recentlyViewed, setRecentlyViewed] = useState<ProductType[]>([])

  // Cookie consent
  const [cookieConsentVisible, setCookieConsentVisible] = useState(false)

  // Products state
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [contactLoading, setContactLoading] = useState(false)

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessageType[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatName, setChatName] = useState('')
  const [chatEmail, setChatEmail] = useState('')
  const [chatRegistered, setChatRegistered] = useState(false)
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('congoclean_session_id')
      if (stored) return stored
      const newId = crypto.randomUUID()
      localStorage.setItem('congoclean_session_id', newId)
      return newId
    }
    return ''
  })

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
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setScrollProgress(Math.min(window.scrollY / docHeight, 1))
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Mobile detection for testimonials
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
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

  // Cookie consent check
  useEffect(() => {
    const consent = localStorage.getItem('congoclean_cookie_consent')
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

  // Smooth scroll helper
  const scrollToSection = useCallback((id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
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

  // Fetch chat messages
  const loadChatMessages = useCallback(async () => {
    if (!sessionId) return
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        const msgs = data.data?.messages || data.messages
        if (msgs && msgs.length > 0) {
          setChatMessages(msgs)
          setChatRegistered(true)
        }
      }
    } catch {
      // silently fail
    }
  }, [sessionId])

  useEffect(() => {
    if (chatOpen && !chatRegistered) {
      loadChatMessages()
    }
  }, [chatOpen, chatRegistered, loadChatMessages])

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
  const handleAddToCart = (product: ProductType, quantity?: number) => {
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
  }

  // Quick add handler
  const handleQuickAdd = (product: ProductType) => {
    handleAddToCart(product)
    setQuickAddedId(product.id)
    setTimeout(() => setQuickAddedId(null), 800)
  }

  // Contact form submit
  const handleContactSubmit = async (e: React.FormEvent) => {
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
  }

  // Newsletter submit
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
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
  }

  // Chat register
  const handleChatRegister = async () => {
    if (!chatName) {
      toast.error('Veuillez entrer votre nom')
      return
    }
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, customerName: chatName, customerEmail: chatEmail || undefined, content: 'Bonjour !' }),
      })
      if (res.ok) {
        setChatRegistered(true)
        await loadChatMessages()
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setChatLoading(false)
    }
  }

  // Chat send message
  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const content = chatInput.trim()
    setChatInput('')
    setChatMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, content, senderType: 'customer', createdAt: new Date().toISOString() },
    ])
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content }),
      })
      if (res.ok) {
        await loadChatMessages()
      }
    } catch {
      toast.error('Erreur d\'envoi')
    } finally {
      setChatLoading(false)
    }
  }

  // Order submit
  const handleOrderSubmit = async (e: React.FormEvent) => {
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
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
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
        // Store email for loyalty lookup in footer
        if (orderForm.customerEmail) {
          localStorage.setItem('congoclean_loyalty_email', orderForm.customerEmail)
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
  }

  // Order tracking submit
  const handleTrackOrder = async (e: React.FormEvent) => {
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
  }

  // Submit review
  const handleReviewSubmit = async (e: React.FormEvent) => {
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
  }

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
        scrollToSection={scrollToSection}
      />

      {/* Promotional Banner Bar */}
      {promoBarVisible && (
        <div className="relative w-full bg-gradient-to-r from-emerald-600 to-emerald-700 h-10 flex items-center overflow-hidden border-l-2 border-emerald-300">
          <div className="flex items-center pl-3 pr-2 shrink-0">
            <Megaphone className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1 overflow-hidden">
            <MarqueeText speed={25} className="py-2">
              <span className="mx-8 text-white text-xs sm:text-sm bg-gradient-to-r from-white via-amber-100 to-white bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite]">{promoText}</span>
            </MarqueeText>
          </div>
          <button
            onClick={() => setPromoBarVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-emerald-800/60 rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Fermer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } @keyframes breathing { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
        </div>
      )}

      <main>
        <HeroSection scrollToSection={scrollToSection} />
        <FeaturesBar />
        <HowToOrderSection />
        <ProductsSection
          products={products}
          productsLoading={productsLoading}
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          quickAddedId={quickAddedId}
          onQuickAdd={handleQuickAdd}
          onAddToCart={handleAddToCart}
          onViewProduct={setSelectedProduct}
          comparisonIds={comparisonIds}
          onToggleComparison={toggleComparison}
          wishlistToggle={wishlist.toggleItem}
          isWishlisted={wishlist.isInWishlist}
        />
        <FlashSaleSection products={products} onAddToCart={handleAddToCart} onViewProduct={setSelectedProduct} />
        <AboutSection />
        <TestimonialsSection
          activeTestimonial={activeTestimonial}
          setActiveTestimonial={setActiveTestimonial}
          isMobile={isMobile}
        />
        <DeliveryPricingSection />
        <OrderTrackingSection
          trackedOrders={trackedOrders}
          trackLoading={trackLoading}
          onTrackOrder={handleTrackOrder}
          trackEmail={trackEmail}
          setTrackEmail={setTrackEmail}
        />
        <FAQSection />
        <NewsletterSection
          newsletterEmail={newsletterEmail}
          setNewsletterEmail={setNewsletterEmail}
          newsletterLoading={newsletterLoading}
          newsletterSuccess={newsletterSuccess}
          onSubmit={handleNewsletterSubmit}
        />
        <ContactSection
          contactForm={contactForm}
          setContactForm={setContactForm}
          contactLoading={contactLoading}
          onSubmit={handleContactSubmit}
        />
      </main>

      <ProductComparison
        comparisonIds={comparisonIds}
        products={products}
        onToggleComparison={toggleComparison}
        onClearComparison={clearComparison}
      />

      <Footer
        scrollToSection={scrollToSection}
        recentlyViewed={recentlyViewed}
        setSelectedProduct={setSelectedProduct}
        showBackToTop={showBackToTop}
        scrollProgress={scrollProgress}
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
        scrollToSection={scrollToSection}
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
      />

      <ChatWidget
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        chatName={chatName}
        setChatName={setChatName}
        chatEmail={chatEmail}
        setChatEmail={setChatEmail}
        chatRegistered={chatRegistered}
        onRegister={handleChatRegister}
        onSend={handleChatSend}
      />

      <SocialProofToast products={products} />
    </div>
  )
}
