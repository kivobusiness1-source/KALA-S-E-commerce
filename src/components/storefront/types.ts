export interface ProductType {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  categoryId: string
  image: string | null
  images: string
  volume: string | null
  isFeatured: boolean
  isActive: boolean
  inStock: boolean
  stockQty: number
  minStockAlert: number
  longDescription?: string | null
  category?: { id: string; name: string; slug: string }
  createdAt?: string | null
  averageRating?: number
  reviewCount?: number
}

export interface CategoryType {
  id: string
  name: string
  slug: string
  description: string | null
  _count?: { products: number }
}

export interface ChatMessageType {
  id: string
  content: string
  senderType: 'customer' | 'admin'
  createdAt: string
}

export interface ReviewType {
  id: string
  customerName: string
  rating: number
  comment: string | null
  createdAt: string
}

export interface TrackedOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[]
}
