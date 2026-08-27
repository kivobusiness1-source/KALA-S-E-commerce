'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
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
  Droplets,
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
  category?: { id: string; name: string; slug: string }
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
  // Navigation scroll state
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  // Cart store
  const cart = useCartStore()

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-200 border-emerald-400/30 px-4 py-1.5 text-sm font-medium">
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
    <section className="bg-white py-10 border-b border-gray-100">
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
    </section>
  )

  // ==================== PRODUCTS SECTION ====================

  const categoryTabs = [
    { label: 'Tous', value: 'all' },
    { label: 'Savon Liquide', value: 'savon-liquide' },
    { label: 'Détergent', value: 'detergent' },
    { label: 'Eau de Javel', value: 'eau-de-javel' },
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
              <Card key={i} className="overflow-hidden">
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
                  <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Product Image Placeholder */}
                    <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                      <span className="text-5xl font-bold text-white/30 select-none">{initial}</span>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
                      <h3 className="font-semibold text-gray-900 text-base mb-1 line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-bold text-emerald-700">{formatPrice(product.price)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-sm text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter au panier
                      </Button>
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
    { icon: Users, value: '+500', label: 'Clients Satisfaits' },
    { icon: Package, value: '+3', label: 'Catégories' },
    { icon: Award, value: 'Qualité', label: 'Industrielle' },
    { icon: MapPin, value: '100%', label: 'Congolaise' },
  ]

  const AboutSection = (
    <section id="about" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden flex items-center justify-center shadow-xl">
                <div className="text-center text-white p-8">
                  <Droplets className="w-20 h-20 mx-auto mb-4 opacity-80" />
                  <p className="text-3xl font-bold">CongoClean</p>
                  <p className="text-emerald-100 mt-2">Depuis Pointe-Noire</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400 rounded-2xl -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200 rounded-2xl -z-10" />
            </div>

            {/* Text side */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                À Propos de <span className="text-emerald-600">CongoClean</span>
              </h2>
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
                      <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
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

  // ==================== NEWSLETTER SECTION ====================

  const NewsletterSection = (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Restez Informé</h2>
            <p className="text-emerald-100 mb-8">
              Inscrivez-vous pour recevoir nos offres spéciales et nouveautés
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
                      {/* Item image placeholder */}
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6 text-white/60" />
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
    </>
  )

  // ==================== FOOTER ====================

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

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© 2024 CongoClean. Tous droits réservés.</p>
          <p>Fabriqué avec ❤️ à Pointe-Noire, Congo-Brazzaville</p>
        </div>
      </div>
    </footer>
  )

  // ==================== RENDER ====================

  return (
    <>
      {NavBar}
      <main>
        {HeroSection}
        {FeaturesBar}
        {ProductsSection}
        {AboutSection}
        {NewsletterSection}
        {ContactSection}
      </main>
      {Footer}
      {CartSheet}
      {ChatWidget}
    </>
  )
}
