export type Section = 'dashboard' | 'products' | 'orders' | 'messages' | 'contact' | 'emails' | 'settings' | 'stock-history' | 'reviews'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  price: number
  comparePrice: number | null
  categoryId: string
  image: string | null
  images: string
  volume: string | null
  isActive: boolean
  isFeatured: boolean
  inStock: boolean
  stockQty: number
  minStockAlert: number
  createdAt: string
  category: { id: string; name: string; slug: string }
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

export interface OrderNote {
  id: string
  content: string
  senderType: string
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  city: string
  status: string
  totalAmount: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
  orderNotes?: OrderNote[]
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: { name: string; image: string | null; volume: string | null }
}

export interface Conversation {
  id: string
  sessionId: string
  customerName: string | null
  customerEmail: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
  latestMessage: {
    id: string
    content: string
    senderType: string
    createdAt: string
  } | null
  unreadCount: number
}

export interface ConversationDetail {
  id: string
  sessionId: string
  customerName: string | null
  customerEmail: string | null
  isRead: boolean
  messages: {
    id: string
    content: string
    senderType: string
    isAdminRead: boolean
    createdAt: string
  }[]
}

export interface EmailSubscriber {
  id: string
  email: string
  name: string | null
  source: string
  isActive: boolean
  createdAt: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
}

export interface StatsData {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  recentOrders: Order[]
  lowStockProducts: (Product & { category: { id: string; name: string; slug: string } })[]
  unreadMessages: number
  totalEmails: number
  ordersByStatus: Record<string, number>
  recentActivity: {
    id: string
    action: string
    details: string | null
    createdAt: string
  }[]
  unreadContactCount: number
  pendingOrdersCount: number
  monthlyRevenue: number
}

export interface ActivityLogEntry {
  id: string
  action: string
  details: string | null
  createdAt: string
  adminName: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface StockHistoryEntry {
  id: string
  productId: string
  previousQty: number
  newQty: number
  changeReason: string | null
  adminId: string | null
  createdAt: string
  product: { name: string } | null
  admin: { name: string; email: string } | null
}

export interface Review {
  id: string
  productId: string
  customerName: string
  rating: number
  comment: string | null
  isApproved: boolean
  createdAt: string
  product: { name: string }
}

export type ReviewFilter = 'all' | 'pending' | 'approved' | 'rejected'
