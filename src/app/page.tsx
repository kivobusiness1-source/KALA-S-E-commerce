'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
  Menu,
  X,
  Package,
  Truck,
  Shield,
  Award,
  Users,
  ArrowRight,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Droplets,
  Eye,
  Quote,
  CheckCircle,
  Clock,
  ClipboardList,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useCartStore } from '@/stores/cart-store'

// ==================== TYPES ====================

interface ProductType {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  categoryId: string
  image: string | null
  volume: string | null
  isFeatured: boolean
  inStock: boolean
  stockQty: number
  longDescription?: string | null
  category?: { id: string; name: string; slug: string }
  createdAt?: string | null
}

interface CategoryType {
  id: string
  name: string
  slug: string
  description: string | null
  _count?: { products: number }
}

interface ChatMessageType {
  id: string
  content: string
  senderType: 'customer' | 'admin'
  createdAt: string
}

interface ReviewType {
  id: string
  customerName: string
  rating: number
  comment: string | null
  createdAt: string
}

interface TrackedOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[]
}

// ==================== HELPERS ====================

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

function getCategoryColor(slug: string): string {
  switch (slug) {
    case 'savon-liquide':
      return 'from-emerald-400 to-teal-500'
    case 'detergent':
      return 'from-amber-400 to-orange-500'
    case 'eau-de-javel':
      return 'from-cyan-400 to-sky-500'
    default:
      return 'from-emerald-400 to-emerald-600'
  }
}

function getCategoryInitial(slug: string): string {
  switch (slug) {
    case 'savon-liquide':
      return 'SL'
    case 'detergent':
      return 'DT'
    case 'eau-de-javel':
      return 'EJ'
    default:
      return 'CC'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'processing': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'shipped': return 'bg-cyan-100 text-cyan-700 border-cyan-200'
    case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'En attente'
    case 'confirmed': return 'Confirmée'
    case 'processing': return 'En traitement'
    case 'shipped': return 'Expédiée'
    case 'delivered': return 'Livrée'
    case 'cancelled': return 'Annulée'
    default: return status
  }
}

function isNewProduct(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return created >= thirtyDaysAgo
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ==================== ANIMATED COUNTER ====================

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ==================== ANIMATED SECTION WRAPPER ====================

function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ==================== MAIN PAGE ====================

export default function Home() {
  // Promo bar state
  const [promoText, setPromoText] = useState('🎉 Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567 🎉')
  const [promoBarVisible, setPromoBarVisible] = useState(true)

  // FAQ state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Navigation scroll state
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)

  // Products state
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', address: '' })
  const [orderLoading, setOrderLoading] = useState(false)

  // Order tracking state
  const [trackEmail, setTrackEmail] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Reviews state
  const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviews, setReviews] = useState<ReviewType[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Cart store
  const cart = useCartStore()

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Fetch reviews when product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchReviews(selectedProduct.id)
      setShowReviewForm(false)
      setReviewForm({ customerName: '', rating: 5, comment: '' })
    }
  }, [selectedProduct])

  // Add to cart handler
  const handleAddToCart = (product: ProductType) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      volume: product.volume,
    })
    toast.success(`${product.name} ajouté au panier`)
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
        toast.success('Inscription réussie !')
        setNewsletterEmail('')
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
        toast.success('Commande passée avec succès !')
        cart.clearCart()
        cart.setCartOpen(false)
        setOrderDialogOpen(false)
        setOrderForm({ customerName: '', customerEmail: '', customerPhone: '', address: '' })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur lors de la commande')
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
    setExpandedOrder(null)
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

  // Fetch reviews for a product
  const fetchReviews = async (productId: string) => {
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

  // ==================== NAV BAR ====================

  const NavBar = (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-700 tracking-tight">CongoClean</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Accueil', id: 'hero' },
              { label: 'Produits', id: 'products' },
              { label: 'À Propos', id: 'about' },
              { label: 'Contact', id: 'contact' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Cart + Mobile Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => cart.setCartOpen(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cart.totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cart.totalItems()}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-emerald-700">
              <Droplets className="w-5 h-5" />
              CongoClean
            </SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 mt-4">
            {[
              { label: 'Accueil', id: 'hero' },
              { label: 'Produits', id: 'products' },
              { label: 'À Propos', id: 'about' },
              { label: 'Contact', id: 'contact' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )

  // ==================== HERO SECTION ====================

  const HeroSection = (
    <section id="hero" className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-banner.png" alt="CongoClean" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-emerald-700/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" />
      </div>
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-40 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 left-1/3 w-24 h-24 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <Badge className="mb-6 bg-emerald-500/25 backdrop-blur-sm text-emerald-200 border-emerald-400/30 px-4 py-1.5 text-sm font-medium">
            <Star className="w-3.5 h-3.5 mr-1.5" />
            Qualité Industrielle depuis Pointe-Noire
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Produits d&rsquo;Hygiène Fabriqués au{' '}
            <span className="text-emerald-300">Congo-Brazzaville</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100/90 mb-8 leading-relaxed max-w-xl">
            Savon liquide, détergent et eau de Javel de qualité industrielle. Fabriqué avec fierté à Pointe-Noire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollToSection('products')}
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-lg"
            >
              Voir nos Produits
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('contact')}
              className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
            >
              Nous Contacter
              <Phone className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
      {/* Animated gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
    </section>
  )

  // ==================== FEATURES BAR ====================

  const features = [
    { icon: Shield, title: 'Qualité Garantie', desc: 'Normes industrielles strictes' },
    { icon: MapPin, title: 'Fabrication Locale', desc: '100% fabriqué à Pointe-Noire' },
    { icon: Truck, title: 'Livraison Rapide', desc: 'Sur toute la ville' },
    { icon: Phone, title: 'Support 24/7', desc: 'Toujours à votre écoute' },
  ]

  const FeaturesBar = (
    <section className="bg-white py-10 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <FadeInSection key={i}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left p-4 rounded-xl hover:bg-emerald-50/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <f.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{f.desc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
    </section>
  )

  // ==================== HOW TO ORDER SECTION ====================

  const steps = [
    { step: '01', icon: ShoppingCart, title: 'Choisissez vos produits', desc: 'Parcourez notre catalogue et ajoutez les produits souhaités à votre panier.' },
    { step: '02', icon: ClipboardList, title: 'Passez votre commande', desc: 'Remplissez vos informations de livraison et confirmez votre commande.' },
    { step: '03', icon: Truck, title: 'Recevez votre livraison', desc: 'Notre équipe vous livre rapidement à Pointe-Noire et environs.' },
  ]

  const HowToOrderSection = (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comment Commander</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              En 3 étapes simples, recevez vos produits chez vous
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
          {steps.map((s, i) => (
            <FadeInSection key={i}>
              <div className="relative text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 relative z-10">
                  <s.icon className="w-7 h-7" />
                </div>
                <p className="text-xs text-emerald-600 font-medium mb-2">Étape {s.step}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )

  // ==================== PRODUCTS SECTION ====================

  const categoryTabs = [
    { label: 'Tous', value: 'all' },
    ...(categories || []).map((c) => ({ label: c.name, value: c.id })),
  ]

  const ProductsSection = (
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
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
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

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200"
              />
            </div>
          </div>
        </FadeInSection>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <Skeleton className="w-full h-48" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => {
              const discount = product.comparePrice && product.comparePrice > product.price
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                : 0
              const catSlug = product.category?.slug || ''
              const gradient = getCategoryColor(catSlug)
              const initial = getCategoryInitial(catSlug)

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col cursor-pointer border-t-4 border-t-transparent hover:border-t-emerald-500">
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
                        onClick={() => setSelectedProduct(product)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label="Voir les détails"
                      >
                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">
                          <Eye className="w-5 h-5 text-emerald-700" />
                        </div>
                      </button>
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
                        {isNewProduct(product.createdAt) && (
                          <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5">
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
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      {product.category && (
                        <Badge variant="outline" className="w-fit text-xs mb-2 text-emerald-700 border-emerald-200 bg-emerald-50">
                          {product.category.name}
                        </Badge>
                      )}
                      <h3
                        onClick={() => setSelectedProduct(product)}
                        className="font-semibold text-gray-900 text-base mb-1 line-clamp-2 cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>
                      )}
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
                          onClick={() => setSelectedProduct(product)}
                          variant="outline"
                          size="icon"
                          className="shrink-0 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                          aria-label="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter au panier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
            <Button
              variant="outline"
              onClick={() => {
                setActiveCategory('all')
                setSearchQuery('')
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </section>
  )

  // ==================== ABOUT SECTION ====================

  const stats = [
    { icon: Users, value: 500, suffix: '+', label: 'Clients Satisfaits' },
    { icon: Package, value: 3, suffix: '+', label: 'Catégories' },
    { icon: Award, value: 0, suffix: '', textValue: 'Qualité', label: 'Industrielle' },
    { icon: MapPin, value: 100, suffix: '%', label: 'Congolaise' },
  ]

  const AboutSection = (
    <section id="about" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              À Propos de <span className="text-emerald-600">CongoClean</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Notre engagement pour la qualité et le développement local
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img src="/about-factory.png" alt="Usine CongoClean à Pointe-Noire" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400 rounded-2xl -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200 rounded-2xl -z-10" />
            </div>

            {/* Text side */}
            <div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                CongoClean est une entreprise de fabrication de produits d&rsquo;hygiène basée à Pointe-Noire, au cœur du Congo-Brazzaville. Depuis notre création, nous nous engageons à fournir des produits de qualité industrielle pour les ménages et les entreprises.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Notre gamme comprend du savon liquide, du détergent et de l&rsquo;eau de Javel, tous formulés pour répondre aux normes les plus strictes. Nous sommes fiers de contribuer au développement économique local en créant des emplois et en utilisant des ressources disponibles au Congo.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {stat.value > 0 ? <AnimatedCounter target={stat.value} suffix={stat.suffix || ''} /> : stat.textValue}
                      </p>
                      <p className="text-gray-500 text-xs">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )

  // ==================== TESTIMONIALS SECTION ====================

  const testimonials = [
    { name: 'Marie Nzaba', role: 'Ménagère, Pointe-Noire', text: 'Le CongoClean 5L est devenu indispensable chez nous. Parfait pour toute la famille, il nettoie bien et ne sèche pas les mains.', rating: 5 },
    { name: 'Jean-Pierre Massamba', role: 'Gérant Hôtel Le Phare', text: 'Nous utilisons les produits CongoClean depuis 2 ans. Qualité constante et prix compétitifs. Je recommande vivement.', rating: 5 },
    { name: 'Aline Mouanda', role: 'Propriétaire Restaurant', text: 'Le détergent ProWash est excellent pour la vaisselle de mon restaurant. Format 5L très économique. Livraison rapide.', rating: 4 },
  ]

  const TestimonialsSection = (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              La satisfaction de nos clients est notre plus grande fierté
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeInSection key={i}>
              <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border-l-4 border-emerald-400">
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-emerald-200" />
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-4 h-4 ${si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-1 mb-4">{t.text}</p>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-semibold text-sm">{getInitials(t.name)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )

  // ==================== DELIVERY & PRICING SECTION ====================

  const DeliveryPricingSection = (
    <FadeInSection>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Livraison & Tarifs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Livraison rapide et fiable à Pointe-Noire et environs
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Livraison & Tarifs */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Livraison & Tarifs</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Livraison gratuite à partir de 25 000 FCFA</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Zone de livraison : Pointe-Noire et périphérie (rayon de 15 km)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Délai de livraison : 24-48h après confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Frais de livraison : 1 500 FCFA (sous 25 000 FCFA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Commandes en gros : Contactez-nous pour des tarifs préférentiels</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Pourquoi CongoClean ? */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pourquoi CongoClean ?</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Fabrication 100% congolaise avec des matières premières locales</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Contrôle qualité rigoureux à chaque étape de production</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Prix compétitifs adaptés au marché local</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Service client réactif et disponible 7j/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Produits biodégradables et respectueux de l'environnement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )

  // ==================== ORDER TRACKING SECTION ====================

  const OrderTrackingSection = (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Suivi de Commande</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Entrez votre email pour retrouver et suivre l&rsquo;état de vos commandes
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="max-w-lg mx-auto">
            <form onSubmit={handleTrackOrder} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Votre email de commande"
                  value={trackEmail}
                  onChange={(e) => setTrackEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              <Button
                type="submit"
                disabled={trackLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6"
              >
                {trackLoading ? '...' : 'Rechercher'}
                <Search className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Tracked Orders Results */}
            {trackedOrders.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-gray-900 text-lg">Résultats ({trackedOrders.length})</h3>
                {trackedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</span>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-700">{formatPrice(order.totalAmount)}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Articles</p>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-700">{item.productName}</span>
                                    <span className="text-gray-400">x{item.quantity}</span>
                                  </div>
                                  <span className="text-gray-900 font-medium">{formatPrice(item.totalPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </FadeInSection>
      </div>
    </section>
  )

  // ==================== FAQ SECTION ====================

  const faqs = [
    {
      question: 'Quelle est votre zone de livraison ?',
      answer: 'Nous livrons à Pointe-Noire et dans sa périphérie dans un rayon de 15 km. La livraison est gratuite pour les commandes de plus de 25 000 FCFA. Pour les zones éloignées, veuillez nous contacter pour vérifier la disponibilité.'
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons le paiement à la livraison (espèces), les virements mobiles (M-Pesa, Orange Money), et les virements bancaires. Le paiement en ligne par carte sera bientôt disponible.'
    },
    {
      question: 'Quel est le délai de livraison ?',
      answer: 'Le délai de livraison standard est de 24 à 48 heures après confirmation de votre commande. Pour les commandes en gros, le délai peut être de 2 à 5 jours ouvrables selon la disponibilité des produits.'
    },
    {
      question: 'Quelle est votre politique de retours et échanges ?',
      answer: 'En cas de produit défectueux ou non conforme, vous disposez de 7 jours après réception pour demander un échange ou un remboursement. Contactez-nous par email à contact@congoclean.cg ou par téléphone au +242 06 123 4567.'
    },
    {
      question: 'Proposez-vous des commandes en gros ?',
      answer: 'Oui, nous proposons des tarifs préférentiels pour les commandes en gros (hôtels, restaurants, entreprises, etc.). Contactez-nous directement par téléphone ou via le formulaire de contact pour obtenir un devis personnalisé.'
    },
    {
      question: 'Quelle est la qualité de vos produits ?',
      answer: 'Nos produits sont fabriqués selon des normes industrielles strictes avec des matières premières de qualité. Chaque lot est contrôlé avant la mise sur le marché. Nos produits sont biodégradables et respectueux de l\'environnement.'
    },
  ]

  const FAQSection = (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Foire Aux Questions</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Trouvez rapidement les réponses à vos questions les plus fréquentes
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden border border-gray-200">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={expandedFaq === i}
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform duration-200 ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  )

  // ==================== NEWSLETTER SECTION ====================

  const NewsletterSection = (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
      {/* Wave SVG divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H0Z" fill="white"/>
        </svg>
      </div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Restez Informé</h2>
            <p className="text-emerald-100 mb-8">
              Inscrivez-vous pour recevoir nos offres spéciales et nouveautés
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-white/80 to-white/40 rounded-full mx-auto mt-4" />
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:border-white focus:ring-white/20"
              />
              <Button
                type="submit"
                disabled={newsletterLoading}
                className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8"
              >
                {newsletterLoading ? '...' : 'S\'abonner'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </FadeInSection>
      </div>
    </section>
  )

  // ==================== CONTACT SECTION ====================

  const ContactSection = (
    <section id="contact" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contactez-Nous</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Une question ? N&rsquo;hésitez pas à nous contacter. Notre équipe est à votre disposition.
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-6">Informations</h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-900">+242 06 123 4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">contact@congoclean.cg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Adresse</p>
                      <p className="font-medium text-gray-900">Zone Industrielle, Pointe-Noire</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Working Hours Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-6">Horaires d'ouverture</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lun-Ven</p>
                      <p className="font-medium text-gray-900">8h - 18h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Samedi</p>
                      <p className="font-medium text-gray-900">8h - 14h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dimanche</p>
                      <p className="font-medium text-gray-400">Fermé</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleContactSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nom <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact-name"
                      placeholder="Votre nom"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Téléphone</Label>
                    <Input
                      id="contact-phone"
                      placeholder="+242 06 XXX XXXX"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject">Sujet</Label>
                    <Input
                      id="contact-subject"
                      placeholder="Sujet de votre message"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Votre message..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {contactLoading ? 'Envoi en cours...' : 'Envoyer le message'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )

  // ==================== CHAT WIDGET ====================

  const ChatWidget = (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        style={{ animation: 'breathing 2s ease-in-out infinite' }}
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Sheet */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="bg-emerald-600 text-white px-4 py-3 rounded-none border-0">
            <SheetTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat avec CongoClean
            </SheetTitle>
            <SheetDescription className="text-emerald-100">Nous répondons rapidement</SheetDescription>
          </SheetHeader>

          {!chatRegistered ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Bienvenue !</h3>
                  <p className="text-gray-500 text-sm mt-1">Entrez vos informations pour commencer</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-name">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="chat-name"
                    placeholder="Votre nom"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-email">Email (optionnel)</Label>
                  <Input
                    id="chat-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={chatEmail}
                    onChange={(e) => setChatEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleChatRegister}
                  disabled={chatLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {chatLoading ? '...' : 'Commencer le chat'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      <p>Début de la conversation</p>
                      <p className="text-xs mt-1">Envoyez-nous un message !</p>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.senderType === 'customer'
                            ? 'bg-emerald-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-3 border-t bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleChatSend()
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Votre message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )

  // ==================== CART SHEET ====================

  const CartSheet = (
    <>
      <Sheet open={cart.isOpen} onOpenChange={cart.setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              Panier
              {cart.totalItems() > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 ml-1">{cart.totalItems()} article(s)</Badge>
              )}
            </SheetTitle>
            <SheetDescription>Vos produits sélectionnés</SheetDescription>
          </SheetHeader>

          {cart.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Votre panier est vide</p>
                <p className="text-gray-400 text-sm mt-1">Ajoutez des produits pour commencer</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    cart.setCartOpen(false)
                    scrollToSection('products')
                  }}
                >
                  Voir les produits
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <div className="space-y-3 py-2">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-xl"
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
                            onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => cart.removeItem(item.id)}
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
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Total</span>
                    <span className="text-xl font-bold text-emerald-700">{formatPrice(cart.totalPrice())}</span>
                  </div>
                  <Button
                    onClick={() => setOrderDialogOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
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
              <span className="font-semibold text-emerald-700">{formatPrice(cart.totalPrice())}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-4">
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
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{cart.totalItems()} article(s)</span> — Total:{' '}
                <span className="font-bold text-emerald-700">{formatPrice(cart.totalPrice())}</span>
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
              <form onSubmit={handleReviewSubmit} className="space-y-3 border border-gray-200 rounded-lg p-4">
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
              <Button onClick={() => { if (selectedProduct) { handleAddToCart(selectedProduct); setSelectedProduct(null) } }} className="w-full bg-emerald-600 hover:bg-emerald-700">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  // ==================== FOOTER =====================

  const Footer = (
    <footer className="mt-auto bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CongoClean</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Fabricant de produits d&rsquo;hygiène de qualité industrielle basé à Pointe-Noire, Congo-Brazzaville.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Liens Rapides</h4>
            <ul className="space-y-2">
              {[
                { label: 'Accueil', id: 'hero' },
                { label: 'Produits', id: 'products' },
                { label: 'À Propos', id: 'about' },
                { label: 'Contact', id: 'contact' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollToSection(link.id)}
                    className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm">+242 06 123 4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm">contact@congoclean.cg</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm">Zone Industrielle, Pointe-Noire</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-gray-700" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Retour en haut
            </button>
            <Separator orientation="vertical" className="h-3 bg-gray-700 hidden sm:block" />
            <button className="hover:text-emerald-400 transition-colors">Conditions Générales</button>
            <Separator orientation="vertical" className="h-3 bg-gray-700 hidden sm:block" />
            <button className="hover:text-emerald-400 transition-colors">Politique de Confidentialité</button>
          </div>
          <p>© 2025 CongoClean. Tous droits réservés. Fabriqué avec ❤️ à Pointe-Noire, Congo-Brazzaville</p>
        </div>
      </div>
    </footer>
  )

  // ==================== RENDER ====================

  return (
    <>
      {NavBar}

      {/* Promotional Banner Bar */}
      {promoBarVisible && (
        <div className="relative w-full bg-gradient-to-r from-emerald-600 to-emerald-700 h-10 flex items-center overflow-hidden">
          <div className="overflow-hidden whitespace-nowrap flex-1">
            <div className="animate-[scroll_20s_linear_infinite] inline-block">
              <span className="mx-8 text-white text-xs sm:text-sm">{promoText}</span>
              <span className="mx-8 text-white text-xs sm:text-sm">{promoText}</span>
              <span className="mx-8 text-white text-xs sm:text-sm">{promoText}</span>
              <span className="mx-8 text-white text-xs sm:text-sm">{promoText}</span>
            </div>
          </div>
          <button
            onClick={() => setPromoBarVisible(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-emerald-800 rounded-full transition-colors"
            aria-label="Fermer la bannière"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } @keyframes breathing { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
        </div>
      )}

      <main>
        {HeroSection}
        {FeaturesBar}
        {HowToOrderSection}
        {ProductsSection}
        {AboutSection}
        {TestimonialsSection}
        {DeliveryPricingSection}
        {OrderTrackingSection}
        {FAQSection}
        {NewsletterSection}
        {ContactSection}
      </main>
      {Footer}
      {CartSheet}

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/242061234567"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-[5.5rem] z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </a>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              aria-label="Retour en haut"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {ChatWidget}
    </>
  )
}
