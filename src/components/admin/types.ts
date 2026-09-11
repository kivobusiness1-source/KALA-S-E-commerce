export type Section = 'dashboard' | 'products' | 'orders' | 'partners' | 'messages' | 'contact' | 'emails' | 'settings' | 'stock-history' | 'reviews' | 'team' | 'livreurs' | 'catchphrases' | 'wholesale'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  price: number
  comparePrice: number | null
  wholesalePrice: number | null
  packSize: number | null
  packPrice: number | null
  commissionPerUnit: number | null
  commissionMonth1PerUnit: number | null
  commissionMonth2PlusPerUnit: number | null
  categoryId: string
  image: string | null
  images: string
  volume: string | null
  unit: string
  isActive: boolean
  isFeatured: boolean
  inStock: boolean
  stockQty: number
  minStockAlert: number
  createdAt: string
  category: { id: string; name: string; slug: string }
  variants?: ProductVariantType[]
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
  assignedToId: string | null
  createdAt: string
  items: OrderItem[]
  orderNotes?: OrderNote[]
  assignedBy?: { id: string; name: string; email: string; role: string }
  deliverer?: { id: string; name: string; phone: string; zone: string | null }
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
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
}

export interface Deliverer {
  id: string
  name: string
  phone: string
  email: string | null
  zone: string | null
  vehicle: string | null
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}

export interface Catchphrase {
  id: string
  text: string
  position: string
  isActive: boolean
  sortOrder: number
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

// ── Affiliate / Partner types ────────────────────────────

export interface Affiliate {
  id: string
  code: string
  name: string
  email: string
  phone: string | null
  company: string | null
  commissionRate: number
  bankInfo: string | null
  isActive: boolean
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  totalOrders: number
  createdAt: string
  _count?: { commissions: number }
}

export interface ProductVariantType {
  id: string
  name: string
  slug: string
  price: number
  wholesalePrice: number | null
  packPrice: number | null
  commissionPerUnit: number | null
  commissionMonth1PerUnit: number | null
  commissionMonth2PlusPerUnit: number | null
  image: string | null
  inStock: boolean
  stockQty: number
  isActive: boolean
}

export interface Commission {
  id: string
  affiliateId: string
  orderId: string
  affiliateCode: string
  productName: string
  variantName: string | null
  quantity: number
  unitPrice: number
  totalSaleAmount: number
  commissionPerUnit: number
  commissionTotal: number
  commissionMonth: number | null
  status: string
  validatedAt: string | null
  paidAt: string | null
  notes: string | null
  createdAt: string
  affiliate?: { id: string; name: string; code: string; email: string }
  order?: { id: string; orderNumber: string; status: string }
  product?: { id: string; name: string; image: string | null }
  variant?: { id: string; name: string } | null
}

export interface AffiliatePayout {
  id: string
  affiliateId: string
  amount: number
  method: string
  reference: string | null
  status: string
  notes: string | null
  createdAt: string
}

export interface AffiliateProductTrack {
  id: string
  affiliateId: string
  productId: string
  firstCommissionAt: string
  currentMonth?: number
  product?: {
    id: string
    name: string
    image: string | null
    commissionMonth1PerUnit: number | null
    commissionMonth2PlusPerUnit: number | null
    commissionPerUnit: number | null
    variants?: {
      id: string
      name: string
      commissionMonth1PerUnit: number | null
      commissionMonth2PlusPerUnit: number | null
      commissionPerUnit: number | null
    }[]
  }
}

export type CommissionStatus = 'pending' | 'validated' | 'paid' | 'cancelled'
