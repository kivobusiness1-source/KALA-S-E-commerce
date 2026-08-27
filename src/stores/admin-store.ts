import { create } from 'zustand'

interface Admin {
  id: string
  email: string
  name: string
  role: string
}

interface AdminStore {
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  setAdmin: (admin: Admin | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  
  setAdmin: (admin) => set({ 
    admin, 
    isAuthenticated: !!admin,
    isLoading: false 
  }),
  
  logout: () => set({ admin: null, isAuthenticated: false }),
  
  setLoading: (isLoading) => set({ isLoading }),
}))
