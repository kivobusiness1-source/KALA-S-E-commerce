'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistStore {
  items: string[]
  _hydrated: boolean
  addItem: (id: string) => void
  removeItem: (id: string) => void
  toggleItem: (id: string) => void
  isInWishlist: (id: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      _hydrated: false, // Prevents hydration mismatch — SSR always renders empty

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
        if (!get()._hydrated) return false // Avoid hydration mismatch — SSR returns false
        return get().items.includes(id)
      },
    }),
    {
      name: 'kalas_wishlist',
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after localStorage rehydration
        if (state) state._hydrated = true
      },
    }
  )
)

/**
 * Hook to check if wishlist store has been hydrated from localStorage.
 * Use this to prevent hydration mismatch in components that render
 * wishlist-dependent UI (like heart icons).
 */
export function useWishlistHydrated() {
  return useWishlistStore((s) => s._hydrated)
}
