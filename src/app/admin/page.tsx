'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminStore } from '@/stores/admin-store'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare, Mail, Settings, LogOut, Menu, RefreshCw, History, Star, Inbox, Users, Bike, Megaphone, Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Section } from '@/components/admin/types'
import NavBadge from '@/components/admin/NavBadge'
import SidebarQuickStats from '@/components/admin/SidebarQuickStats'
import DashboardSection from '@/components/admin/DashboardSection'
import ProductsSection from '@/components/admin/ProductsSection'
import OrdersSection from '@/components/admin/OrdersSection'
import MessagesSection from '@/components/admin/MessagesSection'
import ContactSection from '@/components/admin/ContactSection'
import EmailsSection from '@/components/admin/EmailsSection'
import SettingsSection from '@/components/admin/SettingsSection'
import StockHistorySection from '@/components/admin/StockHistorySection'
import ReviewsSection from '@/components/admin/ReviewsSection'
import TeamSection from '@/components/admin/TeamSection'
import LivreursSection from '@/components/admin/LivreursSection'
import CatchphraseSection from '@/components/admin/CatchphraseSection'
import WholesaleSection from '@/components/admin/WholesaleSection'

const ALL_NAV_ITEMS: { key: Section; label: string; icon: React.ReactNode; roles: string[] }[] = [
  { key: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff', 'livreur'] },
  { key: 'products', label: 'Produits', icon: <Package className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'orders', label: 'Commandes', icon: <ShoppingCart className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff', 'livreur'] },
  { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'contact', label: 'Contact', icon: <Inbox className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'emails', label: 'Emails', icon: <Mail className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
  { key: 'settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
  { key: 'stock-history', label: 'Historique Stock', icon: <History className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'reviews', label: 'Avis Clients', icon: <Star className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'team', label: 'Équipe', icon: <Users className="h-5 w-5" />, roles: ['super_admin', 'admin', 'staff'] },
  { key: 'livreurs', label: 'Livreurs', icon: <Bike className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
  { key: 'catchphrases', label: 'Publicité', icon: <Megaphone className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
  { key: 'wholesale', label: 'Vente en Gros', icon: <Warehouse className="h-5 w-5" />, roles: ['super_admin', 'admin'] },
]

export default function AdminPage() {
  const { admin, isAuthenticated, isLoading, setAdmin, logout } = useAdminStore()
  const queryClient = useQueryClient()
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAdmin(data.data)
        } else {
          setAdmin(null)
        }
      })
      .catch(() => setAdmin(null))
  }, [setAdmin])

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setAdmin(data.data)
        toast.success('Connexion réussie !')
      } else {
        toast.error(data.error || 'Erreur de connexion')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    logout()
    setSection('dashboard')
    toast.success('Déconnecté')
  }

  // Filter nav items by role
  const navItems = useMemo(() => {
    const role = admin?.role || ''
    return ALL_NAV_ITEMS.filter(item => item.roles.includes(role))
  }, [admin?.role])

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#1a1a1a] mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Login screen — clean dark/white, NO gradient, NO bubbles, NO animations
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel — solid dark bg, white text */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="relative z-10 text-center max-w-md">
            {/* Logo */}
            <img src="/logo.jpeg" alt="KALA'S" className="mx-auto w-20 h-20 rounded-2xl object-cover mb-8" />
            <h1 className="text-4xl font-bold text-white mb-4">KALA'S</h1>
            <p className="text-gray-300 text-lg mb-2">Produits d&apos;hygiène de qualité</p>
            <p className="text-gray-500 text-sm">Administration · Gestion · Suivi</p>
          </div>
        </div>
        {/* Right panel — white bg with clean form */}
        <div className="flex items-center justify-center bg-white p-4 lg:p-0">
          <Card className="w-full max-w-md shadow-xl border border-gray-200/80">
            <CardHeader className="text-center pb-2">
              {/* Mobile: logo image */}
              <img src="/logo.jpeg" alt="KALA'S" className="lg:hidden mx-auto w-16 h-16 rounded-2xl object-cover mb-4" />
              <CardTitle className="text-2xl font-bold text-gray-900">KALA'S</CardTitle>
              <CardDescription>Administration</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@kalas.cg"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    disabled={loginLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    disabled={loginLoading}
                  />
                </div>
                <Button type="submit" className="w-full text-white" style={{ backgroundColor: '#1a1a1a' }} disabled={loginLoading}>
                  {loginLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Se connecter
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          [data-printable], [data-printable] * { visibility: visible !important; }
          [data-printable] { position: absolute; left: 0; top: 0; width: 100%; }
        }
      ` }} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — white bg, #1a1a1a text, clean borders, #1a1a1a active state */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
            <img src="/logo.jpeg" alt="KALA'S" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">KALA'S</h1>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium border-l-4 transition-all duration-200 ${
                  section === item.key
                    ? 'border-l-[#1a1a1a] bg-gray-100 text-[#1a1a1a] [&>svg]:text-[#1a1a1a]'
                    : 'border-l-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <NavBadge itemKey={item.key} activeSection={section} />
              </button>
            ))}
          </nav>

          {/* Quick stats */}
          <SidebarQuickStats />

          {/* Bottom section */}
          <div className="border-t border-gray-100 px-3 py-4 space-y-1">
            <div className="px-3 py-2 text-sm text-muted-foreground truncate">
              {admin?.name}
              <span className="ml-2 text-xs text-gray-400">({admin?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find(n => n.key === section)?.label}
          </h2>
          <div className="flex-1" />
          {admin && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs" style={{ backgroundColor: '#1a1a1a' }}>
                {admin.name?.charAt(0).toUpperCase()}
              </div>
              <span>{admin.name}</span>
            </div>
          )}
        </header>

        {/* Section content */}
        <div className="p-4 sm:p-6">
          {section === 'dashboard' && <DashboardSection />}
          {section === 'products' && <ProductsSection />}
          {section === 'orders' && <OrdersSection />}
          {section === 'messages' && <MessagesSection />}
          {section === 'contact' && <ContactSection />}
          {section === 'emails' && <EmailsSection />}
          {section === 'settings' && <SettingsSection />}
          {section === 'stock-history' && <StockHistorySection />}
          {section === 'reviews' && <ReviewsSection />}
          {section === 'team' && <TeamSection />}
          {section === 'livreurs' && <LivreursSection />}
          {section === 'catchphrases' && <CatchphraseSection />}
          {section === 'wholesale' && <WholesaleSection />}
        </div>
      </main>
    </div>
  )
}