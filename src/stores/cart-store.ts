import { create } from 'zustand'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string | null
  volume: string | null
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  setCartOpen: (open: boolean) => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  
  addItem: (item) => {
    const items = get().items
    const existing = items.find((i) => i.id === item.id)
    
    if (existing) {
      set({
        items: items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
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
  
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  
  totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}))
