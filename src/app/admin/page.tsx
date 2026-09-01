'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminStore } from '@/stores/admin-store'
import { toast } from 'sonner'
import {
  LayoutDashboard, Package, ShoppingCart, MessageSquare, Mail, Settings, LogOut, Menu, Droplets, History, Star, Inbox, Users, Bike, Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'
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

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
      {/* Login page with CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loginGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatBubble1 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.12; }
          50% { transform: translateY(-30px) scale(1.1); opacity: 0.22; }
        }
        @keyframes floatBubble2 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.08; }
          50% { transform: translateY(-20px) translateX(15px) scale(1.15); opacity: 0.18; }
        }
        @keyframes floatBubble3 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.15; }
          50% { transform: translateY(-25px) scale(0.9); opacity: 0.25; }
        }
        @keyframes floatBubble4 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.06; }
          50% { transform: translateY(-35px) translateX(-10px); opacity: 0.16; }
        }
        @keyframes floatBubble5 {
          0%, 100% { transform: translateY(0px); opacity: 0.1; }
          50% { transform: translateY(-15px); opacity: 0.2; }
        }
        @keyframes floatBubble6 {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.07; }
          50% { transform: translateY(-20px) translateX(10px) scale(1.2); opacity: 0.14; }
        }
        @keyframes floatBubble7 {
          0%, 100% { transform: translateY(0px) scale(1.05); opacity: 0.09; }
          50% { transform: translateY(-28px) scale(0.95); opacity: 0.18; }
        }
        .login-gradient-bg {
          background: linear-gradient(-45deg, #059669, #0d9488, #047857, #0f766e, #065f46, #115e59);
          background-size: 400% 400%;
          animation: loginGradientShift 8s ease infinite;
        }
        .login-bubble-1 { animation: floatBubble1 6s ease-in-out infinite; }
        .login-bubble-2 { animation: floatBubble2 8s ease-in-out infinite; }
        .login-bubble-3 { animation: floatBubble3 7s ease-in-out infinite; }
        .login-bubble-4 { animation: floatBubble4 9s ease-in-out infinite; }
        .login-bubble-5 { animation: floatBubble5 5s ease-in-out infinite; }
        .login-bubble-6 { animation: floatBubble6 10s ease-in-out infinite; }
        .login-bubble-7 { animation: floatBubble7 7.5s ease-in-out infinite; }
      ` }} />
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left side - animated emerald gradient (hidden on mobile) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden login-gradient-bg p-12">
          {/* Animated floating bubbles */}
          <div className="absolute top-16 left-12 w-32 h-32 rounded-full bg-white/15 blur-2xl login-bubble-1" />
          <div className="absolute bottom-24 right-16 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl login-bubble-2" />
          <div className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full bg-white/10 blur-xl login-bubble-3" />
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 rounded-full bg-emerald-200/15 blur-2xl login-bubble-4" />
          <div className="absolute top-20 right-20 w-16 h-16 rounded-full bg-teal-200/20 blur-xl login-bubble-5" />
          <div className="absolute bottom-40 left-20 w-36 h-36 rounded-full bg-emerald-400/10 blur-3xl login-bubble-6" />
          <div className="absolute top-1/2 left-1/4 w-14 h-14 rounded-full bg-white/12 blur-lg login-bubble-7" />
          <div className="relative z-10 text-center max-w-md">
            <div className="mx-auto w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-900/30">
              <Droplets className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">CongoClean</h1>
            <p className="text-emerald-100 text-lg mb-2">Produits d&rsquo;hygiène de qualité</p>
            <p className="text-emerald-200/60 text-sm">Administration &middot; Gestion &middot; Suivi</p>
          </div>
        </div>
        {/* Right side - form */}
        <div className="flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md shadow-xl shadow-gray-200/60 border border-gray-100/80">
            <CardHeader className="text-center pb-2">
              <div className="lg:hidden mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/30">
                <Package className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">CongoClean</CardTitle>
              <CardDescription>Administration</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@congosoap.cg"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    disabled={loginLoading}
                    className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
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
                    className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-shadow duration-200" disabled={loginLoading}>
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
      </>
    )
  }

  // Admin panel
  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: 'products', label: 'Produits', icon: <Package className="h-5 w-5" /> },
    { key: 'orders', label: 'Commandes', icon: <ShoppingCart className="h-5 w-5" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { key: 'contact', label: 'Contact', icon: <Inbox className="h-5 w-5" /> },
    { key: 'emails', label: 'Emails', icon: <Mail className="h-5 w-5" /> },
    { key: 'settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> },
    { key: 'stock-history', label: 'Historique Stock', icon: <History className="h-5 w-5" /> },
    { key: 'reviews', label: 'Avis Clients', icon: <Star className="h-5 w-5" /> },
    { key: 'team', label: 'Équipe', icon: <Users className="h-5 w-5" /> },
    { key: 'livreurs', label: 'Livreurs', icon: <Bike className="h-5 w-5" /> },
    { key: 'catchphrases', label: 'Publicité', icon: <Megaphone className="h-5 w-5" /> },
  ]

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

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100/60">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-lg blur-md opacity-40" />
              <div className="relative w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                <Droplets className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">CongoClean</h1>
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium border-l-4 transition-all duration-200 ${section === item.key ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-50/40 text-emerald-700 [&>svg]:text-emerald-600 shadow-sm shadow-emerald-100/50' : 'border-l-transparent text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent hover:text-gray-900'}`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <NavBadge itemKey={item.key} activeSection={section} />
              </button>
            ))}
          </nav>

          {/* Quick stats */}
          <SidebarQuickStats />

          {/* Bottom gradient overlay + CC logo */}
          <div className="relative">
            <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-emerald-50/60 to-transparent pointer-events-none" />
            <div className="bg-gradient-to-t from-emerald-50/60 to-transparent px-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center shadow-sm shadow-emerald-600/30">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <span className="text-xs font-semibold text-emerald-700">CongoClean</span>
              </div>
            </div>
            <div className="border-t border-gray-100 px-3 py-4 space-y-1">
              <div className="px-3 py-2 text-sm text-muted-foreground truncate">
                {admin?.name}
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
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-xs">
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
        </div>
      </main>
    </div>
  )
}