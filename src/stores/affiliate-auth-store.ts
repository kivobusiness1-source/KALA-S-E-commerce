import { create } from 'zustand'

interface Affiliate {
  id: string
  code: string
  name: string
  email: string
  phone: string
  company: string | null
  commissionRate: number
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  totalOrders: number
}

interface AffiliateAuthStore {
  affiliate: Affiliate | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: {
    name: string
    email: string
    phone: string
    password: string
    company?: string
    bankInfo?: string
  }) => Promise<boolean>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAffiliateAuthStore = create<AffiliateAuthStore>((set) => ({
  affiliate: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true })
      const res = await fetch('/api/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        set({ isLoading: false })
        return false
      }

      set({
        affiliate: data.affiliate,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  register: async (registerData) => {
    try {
      set({ isLoading: true })
      const res = await fetch('/api/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerData }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        set({ isLoading: false })
        return false
      }

      set({
        affiliate: result.affiliate,
        isAuthenticated: true,
        isLoading: false,
      })
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  logout: async () => {
    try {
      await fetch('/api/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {
      // Continue even if API fails
    }
    set({ affiliate: null, isAuthenticated: false, isLoading: false })
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true })
      const res = await fetch('/api/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me' }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        set({ affiliate: null, isAuthenticated: false, isLoading: false })
        return
      }

      set({
        affiliate: data.affiliate,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      set({ affiliate: null, isAuthenticated: false, isLoading: false })
    }
  },
}))

export type { Affiliate, AffiliateAuthStore }
