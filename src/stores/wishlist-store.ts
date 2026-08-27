'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  items: string[]
  addItem: (id: string) => void
  removeItem: (id: string) => void
  toggleItem: (id: string) => void
  isInWishlist: (id: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (id) => {
        const items = get().items
        if (!items.includes(id)) {
          set({ items: [...items, id] })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((itemId) => itemId !== id) })
      },

      toggleItem: (id) => {
        const items = get().items
        if (items.includes(id)) {
          set({ items: items.filter((itemId) => itemId !== id) })
        } else {
          set({ items: [...items, id] })
        }
      },

      isInWishlist: (id) => {
        return get().items.includes(id)
      },
    }),
    {
      name: 'congoclean_wishlist',
    }
  )
)
