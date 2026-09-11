'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
  User,
  LogOut,
  Package,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Truck,
  Loader2,
  Receipt,
  MapPin,
  MessageCircle,
  Send,
  ArrowLeft,
  Gift,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCustomerAuthStore } from '@/stores/customer-auth-store'
import { formatPrice, getStatusLabel } from './helpers'

// --- Types ---
interface OrderItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  image?: string | null
}

interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  totalAmount: number
  items: OrderItem[]
  deliveryAddress?: string
  deliveryCity?: string
  deliveryQuartier?: string
}

// --- Status badge colors ---
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-700 border-orange-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: Package,
  processing: Package,
  shipped: Truck,
  delivered: ShoppingBag,
  cancelled: Receipt,
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  const Icon = STATUS_ICONS[status] || Clock
  return (
    <Badge variant="outline" className={`${style} gap-1 text-xs font-medium`}>
      <Icon className="w-3 h-3" />
      {getStatusLabel(status)}
    </Badge>
  )
}

// --- Chat Message Type ---
interface ChatMessage {
  id: string
  content: string
  senderType: string
  createdAt: string
}

// --- Main component ---
interface CustomerDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogout?: () => void
}

export function CustomerDashboard({ open, onOpenChange, onLogout }: CustomerDashboardProps) {
  const { customer, logout, isAuthenticated } = useCustomerAuthStore()

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const ordersPerPage = 5

  // Loyalty points state
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSending, setChatSending] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Active orders count
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing' || o.status === 'shipped'
  ).length

  // Fetch orders
  const fetchOrders = useCallback(async (p: number) => {
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'orders', page: p, limit: ordersPerPage }),
      })
      if (res.ok) {
        const data = await res.json()
        const ordersData: Order[] = data.orders || data.data || []
        setOrders(ordersData)
        setTotalPages(data.totalPages || Math.ceil((data.total || ordersData.length) / ordersPerPage) || 1)
        setTotalOrders(data.total || ordersData.length)
      } else {
        setOrders([])
      }
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(page)
    }
  }, [isAuthenticated, page, fetchOrders])

  // Fetch loyalty points
  useEffect(() => {
    if (!isAuthenticated || !customer?.email) return
    const fetchLoyaltyPoints = async () => {
      try {
        const res = await fetch(`/api/loyalty?email=${encodeURIComponent(customer.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && typeof data.points === 'number') {
            setLoyaltyPoints(data.points)
          }
        }
      } catch {
        // silently ignore
      }
    }
    fetchLoyaltyPoints()
  }, [isAuthenticated, customer?.email])

  // --- Chat logic ---
  const chatSessionId = customer ? `customer-${customer.id}` : ''

  const fetchChatMessages = useCallback(async () => {
    if (!chatSessionId) return
    try {
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(chatSessionId)}`)
      if (res.ok) {
        const data = await res.json()
        const msgs: ChatMessage[] = data?.data?.messages || []
        setChatMessages(msgs)
      }
    } catch {
      // silently ignore polling errors
    }
  }, [chatSessionId])

  const loadChat = useCallback(async () => {
    if (!chatSessionId) return
    setChatLoading(true)
    try {
      const res = await fetch(`/api/chat?sessionId=${encodeURIComponent(chatSessionId)}`)
      if (res.ok) {
        const data = await res.json()
        const msgs: ChatMessage[] = data?.data?.messages || []
        setChatMessages(msgs)
      } else {
        setChatMessages([])
      }
    } catch {
      setChatMessages([])
    } finally {
      setChatLoading(false)
    }
  }, [chatSessionId])

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim()
    if (!trimmed || chatSending || !chatSessionId) return
    setChatSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: chatSessionId, content: trimmed, customerName: customer?.name, customerEmail: customer?.email }),
      })
      if (res.ok) {
        setChatInput('')
        // Re-fetch to get the full list including the new message
        await fetchChatMessages()
      } else {
        toast.error('Erreur lors de l\'envoi du message')
      }
    } catch {
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setChatSending(false)
    }
  }

  // Load chat on open & poll for new messages
  useEffect(() => {
    if (showChat && chatSessionId) {
      loadChat()
      const interval = setInterval(() => {
        fetchChatMessages()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [showChat, chatSessionId, loadChat, fetchChatMessages])

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChat && chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [showChat, chatMessages])

  const formatChatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const lastAdminMessage = chatMessages.filter((m) => m.senderType === 'admin').slice(-1)[0]

  // Logout handler
  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    onLogout?.()
  }

  // Toggle order details
  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId))
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  if (!customer) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0 sr-only">
          <DialogTitle>Mon Compte</DialogTitle>
        </DialogHeader>
    <div className="w-full max-w-4xl mx-auto space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Mon Compte</h2>
            <p className="text-sm text-[#888888]">{customer.name}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-fit border-gray-200 text-[#1a1a1a] hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total commandes */}
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wider">Total commandes</p>
                <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{customer.ordersCount || totalOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-[#1a1a1a]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total dépensé */}
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wider">Total dépensé</p>
                <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{formatPrice(customer.totalSpent || 0)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#1a1a1a]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commandes en cours */}
        <Card className="border-gray-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#888888] uppercase tracking-wider">En cours</p>
                <p className="text-2xl font-bold text-[#1a1a1a] mt-1">{activeOrdersCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#1a1a1a]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Points Card */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Points de fidélité</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">
                {loyaltyPoints !== null ? loyaltyPoints.toLocaleString('fr-FR') : '—'}
              </p>
              <p className="text-xs text-amber-600/70 mt-1">
                100 points = 1 000 FCFA de réduction
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Info Card */}
      <Card className="border-gray-200 shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#1a1a1a] flex items-center gap-2">
            <User className="w-4 h-4 text-[#888888]" />
            Mes informations
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#888888]">Email :</span>
              <span className="text-[#1a1a1a] font-medium">{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#888888]">Tél :</span>
              <span className="text-[#1a1a1a] font-medium">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#888888] shrink-0" />
              <span className="text-[#1a1a1a] font-medium">
                {customer.address}, {customer.quartier}, {customer.city}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat with store button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="w-full flex items-center gap-4 p-5 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
        >
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-[#1a1a1a]">Discuter avec la boutique</p>
            <p className="text-xs text-[#888888] mt-0.5">Posez vos questions, suivez vos commandes en direct</p>
          </div>
          <MessageCircle className="w-4 h-4 text-[#888888] shrink-0" />
        </button>
      )}

      {/* Chat view */}
      {showChat && (
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChat(false)}
                className="w-7 h-7 flex items-center justify-center text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Retour au tableau de bord"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-white text-sm font-medium leading-tight">KALA'S</p>
                <p className="text-white/60 text-xs">Discuter avec la boutique</p>
              </div>
            </div>
            {/* Admin online indicator */}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white/60 text-xs">
                {lastAdminMessage
                  ? `Rép. à ${formatChatTime(lastAdminMessage.createdAt)}`
                  : 'En ligne'}
              </span>
            </div>
          </div>

          {/* Messages area */}
          <div className="h-[320px] overflow-y-auto px-4 py-3 space-y-3">
            {chatLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[#888888] animate-spin" />
                <span className="ml-2 text-sm text-[#888888]">Chargement...</span>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <MessageCircle className="w-10 h-10 text-[#888888] mb-3 opacity-30" />
                <p className="text-sm text-[#888888] text-center">Aucun message pour le moment</p>
                <p className="text-xs text-[#888888] mt-1 text-center">Envoyez un message pour commencer la conversation</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={msg.senderType === 'customer' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={
                      msg.senderType === 'customer'
                        ? 'bg-[#1a1a1a] text-white px-3.5 py-2.5 rounded-2xl rounded-br-md max-w-[80%] text-sm leading-relaxed'
                        : 'bg-gray-100 text-[#1a1a1a] px-3.5 py-2.5 rounded-2xl rounded-bl-md max-w-[80%] text-sm leading-relaxed'
                    }
                  >
                    <p>{msg.content}</p>
                    <p
                      className={
                        msg.senderType === 'customer'
                          ? 'text-white/50 text-[10px] mt-1 text-right'
                          : 'text-[#888888] text-[10px] mt-1'
                      }
                    >
                      {formatChatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {chatSending && (
              <div className="flex justify-end">
                <div className="bg-[#1a1a1a] text-white px-3.5 py-3 rounded-2xl rounded-br-md">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-gray-200 px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage()
                  }
                }}
                placeholder="Écrivez votre message..."
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] bg-white min-h-[38px] max-h-[80px] leading-snug"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatSending}
                className="w-[38px] h-[38px] flex items-center justify-center bg-[#1a1a1a] text-white rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Orders Section */}
      <div>
        <h3 className="text-lg font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#888888]" />
          Mes commandes
        </h3>

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#888888] animate-spin" />
            <span className="ml-3 text-sm text-[#888888]">Chargement de vos commandes...</span>
          </div>
        ) : orders.length === 0 ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-[#888888] mx-auto mb-3 opacity-40" />
              <p className="text-[#1a1a1a] font-medium">Aucune commande pour le moment</p>
              <p className="text-[#888888] text-sm mt-1">Vos commandes apparaîtront ici une fois passées.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id
              return (
                <Card
                  key={order.id}
                  className="border-gray-200 shadow-sm rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Order Header Row */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full text-left"
                    aria-expanded={isExpanded}
                    aria-label={`Commande ${order.orderNumber}`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left: order info */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Package className="w-5 h-5 text-[#1a1a1a]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1a1a1a] truncate">
                              #{order.orderNumber}
                            </p>
                            <p className="text-xs text-[#888888] mt-0.5">
                              {formatDate(order.createdAt)} &middot; {order.items.length} article{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Right: status, amount, chevron */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          <StatusBadge status={order.status} />
                          <span className="text-sm font-bold text-[#1a1a1a] whitespace-nowrap">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <div className="text-[#888888]">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="px-4 sm:px-5 py-4 space-y-3">
                        {/* Delivery info */}
                        {(order.deliveryAddress || order.deliveryCity) && (
                          <div className="flex items-start gap-2 text-xs text-[#888888]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              Livraison : {order.deliveryAddress || customer.address}
                              {order.deliveryQuartier && `, ${order.deliveryQuartier}`}
                              {order.deliveryCity && `, ${order.deliveryCity}`}
                            </span>
                          </div>
                        )}

                        {/* Items list */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-wider">
                            Articles commandés
                          </p>
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-8 h-8 rounded object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                                    <Package className="w-4 h-4 text-[#888888]" />
                                  </div>
                                )}
                                <span className="text-sm text-[#1a1a1a] font-medium truncate">
                                  {item.productName}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className="text-xs text-[#888888]">×{item.quantity}</span>
                                <span className="text-sm font-semibold text-[#1a1a1a]">
                                  {formatPrice(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order total */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm font-medium text-[#888888]">Total</span>
                          <span className="text-base font-bold text-[#1a1a1a]">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-gray-200 text-[#1a1a1a] hover:bg-gray-50 rounded-lg"
            >
              <ChevronUp className="w-4 h-4 mr-1 rotate-[-90deg]" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className={
                    p === page
                      ? 'bg-[#1a1a1a] text-white hover:bg-[#333] rounded-lg min-w-[32px]'
                      : 'border-gray-200 text-[#1a1a1a] hover:bg-gray-50 rounded-lg min-w-[32px]'
                  }
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-gray-200 text-[#1a1a1a] hover:bg-gray-50 rounded-lg"
            >
              Suivant
              <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
            </Button>
          </div>
        )}
      </div>
    </div>
      </DialogContent>
    </Dialog>
  )
}
