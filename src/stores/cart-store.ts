import { create } from 'zustand'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string | null
  volume: string | null
  quantity: number
  variantId?: string | null
  variantName?: string | null
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  affiliateCode: string | null
  affiliateName: string | null
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
  setAffiliateCode: (code: string | null, name?: string | null) => void
  clearAffiliateCode: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  affiliateCode: null,
  affiliateName: null,
  
  addItem: (item) => {
    const items = get().items
    // Use composite key: id + variantId for uniqueness
    const itemKey = item.variantId ? `${item.id}_${item.variantId}` : item.id
    const existing = items.find((i) => {
      const existingKey = i.variantId ? `${i.id}_${i.variantId}` : i.id
      return existingKey === itemKey
    })
    
    if (existing) {
      set({
        items: items.map((i) => {
          const iKey = i.variantId ? `${i.id}_${i.variantId}` : i.id
          return iKey === itemKey ? { ...i, quantity: i.quantity + 1 } : i
        }),
      })
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] })
    }
    set({ isOpen: true })
  },
  
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) })
  },
  
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set({
      items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    })
  },
  
  clearCart: () => set({ items: [] }),
  
  toggleCart: () => set({ isOpen: !get().isOpen }),
  setCartOpen: (open) => set({ isOpen: open }),
  
  setAffiliateCode: (code, name) => set({ affiliateCode: code, affiliateName: name ?? null }),
  clearAffiliateCode: () => set({ affiliateCode: null, affiliateName: null }),
  
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  
  totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}))
