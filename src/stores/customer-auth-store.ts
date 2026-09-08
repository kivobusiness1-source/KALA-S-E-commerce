import { create } from 'zustand'

export interface Customer {
  id: string
  email: string
  name: string
  phone: string
  address: string
  city: string
  quartier: string
  ordersCount: number
  totalSpent: number
}

interface CustomerAuthStore {
  customer: Customer | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: {
    name: string
    email: string
    phone: string
    password: string
    address: string
    city: string
    quartier: string
    referralCode?: string
  }) => Promise<boolean>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useCustomerAuthStore = create<CustomerAuthStore>((set) => ({
  customer: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        const customer: Customer = data.customer || data.data
        set({ customer, isAuthenticated: true, isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  register: async (data): Promise<boolean> => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...data }),
      })
      if (res.ok) {
        const result = await res.json()
        const customer: Customer = result.customer || result.data
        set({ customer, isAuthenticated: true, isLoading: false })
        return true
      }
      set({ isLoading: false })
      return false
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch {
      // Continue even if API call fails
    }
    set({ customer: null, isAuthenticated: false, isLoading: false })
  },

  fetchMe: async (): Promise<void> => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/customer-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'me' }),
      })
      if (res.ok) {
        const data = await res.json()
        const customer: Customer = data.customer || data.data
        if (customer && customer.id) {
          set({ customer, isAuthenticated: true, isLoading: false })
        } else {
          set({ customer: null, isAuthenticated: false, isLoading: false })
        }
      } else {
        set({ customer: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      set({ customer: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
