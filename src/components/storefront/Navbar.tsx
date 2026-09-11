'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Search, Home, Package, Info, Phone, Menu, X, Building2, User, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useCustomerAuthStore } from '@/stores/customer-auth-store'
import { useAffiliateAuthStore } from '@/stores/affiliate-auth-store'

interface NavbarProps {
  scrolled: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  cartTotalItems: number
  onCartOpen: () => void
  onCustomerAuth: () => void
  onAffiliateAuth: () => void
  onCustomerDashboard: () => void
  onAffiliateDashboard: () => void
}

const navLinks = [
  { label: 'Accueil', href: '/', icon: Home },
  { label: 'Produits', href: '/produits', icon: Package },
  { label: 'Entreprises', href: '/entreprises', icon: Building2 },
  { label: 'A Propos', href: '/a-propos', icon: Info },
  { label: 'Contact', href: '/contact', icon: Phone },
]

export function Navbar({ scrolled, mobileMenuOpen, setMobileMenuOpen, cartTotalItems, onCartOpen, onCustomerAuth, onAffiliateAuth, onCustomerDashboard, onAffiliateDashboard }: NavbarProps) {
  const pathname = usePathname()
  const customer = useCustomerAuthStore((s) => s.customer)
  const affiliate = useAffiliateAuthStore((s) => s.affiliate)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleSearchClick = () => {
    if (pathname !== '/produits') {
      window.location.href = '/produits'
    } else {
      const input = document.getElementById('product-search-input') as HTMLInputElement | null
      if (input) input.focus()
    }
  }

  return (
    <header className={`sticky top-0 z-50 bg-white border-b border-[#e5e5e5] transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity duration-150">
            <img src="/logo.jpeg" alt="KALA'S" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-xl font-bold text-[#1a1a1a] tracking-tight">KALA&apos;S</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                suppressHydrationWarning
                className={`relative text-sm font-medium transition-colors duration-150 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:transition-all after:duration-150 ${
                  isActive(link.href)
                    ? 'text-[#1a1a1a] after:w-full after:bg-[#1a1a1a]'
                    : 'text-[#888888] hover:text-[#1a1a1a] after:w-0 hover:after:w-full after:bg-[#1a1a1a]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart + Search + Account + Partner + Mobile Menu */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 text-[#888888] hover:text-[#1a1a1a]"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Partner/Affiliate Button */}
            <button
              onClick={affiliate ? onAffiliateDashboard : onAffiliateAuth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 text-[#888888] hover:text-emerald-600"
              aria-label="Partenariat"
              title={affiliate ? `Partenaire: ${affiliate.name}` : 'Devenir partenaire'}
            >
              <Handshake className="w-5 h-5" />
            </button>

            {/* Customer Account Button */}
            <button
              onClick={customer ? onCustomerDashboard : onCustomerAuth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 text-[#888888] hover:text-[#1a1a1a]"
              aria-label="Mon compte"
              title={customer ? `Connecté: ${customer.name}` : 'Mon compte'}
            >
              {customer ? (
                <span className="w-5 h-5 bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {/* Cart */}
            <button
              onClick={onCartOpen}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-[#888888]" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#1a1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-[#888888]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 flex flex-col p-0 border-0 bg-white"
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2.5 text-[#1a1a1a]">
                <img src="/logo.jpeg" alt="KALA'S" className="w-8 h-8 rounded-lg object-cover" />
                <span className="text-lg font-bold tracking-tight">KALA&apos;S</span>
              </SheetTitle>
              <SheetDescription className="sr-only">Navigation</SheetDescription>
            </SheetHeader>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4 text-[#888888]" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 px-3 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  suppressHydrationWarning
                  className={`text-left px-4 py-3 rounded-lg transition-colors duration-150 font-medium flex items-center gap-3 ${
                    active
                      ? 'bg-gray-100 text-[#1a1a1a]'
                      : 'text-[#1a1a1a] hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#1a1a1a]' : 'text-[#888888]'}`} />
                  <span>{link.label}</span>
                </Link>
              )
            })}

            <div className="my-2 border-t border-gray-100" />

            {/* Mobile: Customer Account */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                customer ? onCustomerDashboard() : onCustomerAuth()
              }}
              className="text-left px-4 py-3 rounded-lg transition-colors duration-150 font-medium flex items-center gap-3 text-[#1a1a1a] hover:bg-gray-50"
            >
              <User className="w-4 h-4 text-[#888888]" />
              <span>{customer ? customer.name : 'Mon Compte'}</span>
            </button>

            {/* Mobile: Affiliate/Partner */}
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                affiliate ? onAffiliateDashboard() : onAffiliateAuth()
              }}
              className="text-left px-4 py-3 rounded-lg transition-colors duration-150 font-medium flex items-center gap-3 text-emerald-600 hover:bg-emerald-50"
            >
              <Handshake className="w-4 h-4" />
              <span>{affiliate ? affiliate.name : 'Partenariat'}</span>
            </button>
          </div>

          {/* Contact button at bottom */}
          <div className="px-5 pt-4 pb-6 border-t border-[#e5e5e5]">
            <Button
              asChild
              className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-medium"
            >
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Phone className="w-4 h-4 mr-2" />
                Contacter
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
