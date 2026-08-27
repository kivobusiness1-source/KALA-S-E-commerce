'use client'

import { ShoppingCart, Droplets, Phone, Menu, Search, Home, Package, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface NavbarProps {
  scrolled: boolean
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  cartTotalItems: number
  onCartOpen: () => void
  scrollToSection: (id: string) => void
}

export function Navbar({ scrolled, mobileMenuOpen, setMobileMenuOpen, cartTotalItems, onCartOpen, scrollToSection }: NavbarProps) {
  const navLinks = [
    { label: 'Accueil', id: 'hero', icon: Home },
    { label: 'Produits', id: 'products', icon: Package },
    { label: 'À Propos', id: 'about', icon: Info },
    { label: 'Contact', id: 'contact', icon: Phone },
  ]

  const handleSearchClick = () => {
    scrollToSection('products')
    setTimeout(() => {
      const input = document.getElementById('product-search-input') as HTMLInputElement | null
      if (input) input.focus()
    }, 600)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-emerald-900/5' : 'bg-white'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/25 transition-transform duration-300 hover:rotate-12">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-700 tracking-tight">CongoClean</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="relative text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-emerald-500 after:to-teal-400 after:rounded-full after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
                {link.id === 'products' && (
                  <span className="absolute -top-2 -right-10 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-sm shadow-amber-500/40 uppercase tracking-wider">
                    Nouv.
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Cart + Search + Mobile Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg hover:bg-emerald-50 transition-colors text-gray-700 hover:text-emerald-600"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onCartOpen}
              className="relative p-2 rounded-lg hover:bg-emerald-50 transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold rounded-full flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite] shadow-sm shadow-emerald-500/40">
                  {cartTotalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-emerald-50 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Animated shimmer gradient border at bottom */}
      <div
        className="h-[1px] w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #10b981, #14b8a6, #06b6d4, #10b981, transparent)',
          backgroundSize: '200% 100%',
          animation: 'navBorderShimmer 4s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes navBorderShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 flex flex-col p-0 border-0"
          style={{
            background: 'linear-gradient(180deg, #ecfdf5 0%, #ffffff 40%, #ffffff 100%)',
          }}
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <SheetHeader className="p-0">
              <SheetTitle className="flex items-center gap-2 text-emerald-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">CongoClean</span>
              </SheetTitle>
              <SheetDescription className="sr-only">Navigation</SheetDescription>
            </SheetHeader>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-col gap-1 px-3 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-emerald-100/70 hover:text-emerald-700 transition-all duration-200 font-medium flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>{link.label}</span>
                  {link.id === 'products' && (
                    <span className="ml-auto bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-[pulse_2s_ease-in-out_infinite] shadow-sm shadow-amber-500/40 uppercase tracking-wider">
                      Nouv.
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Social media icons */}
          <div className="flex items-center gap-2 px-5 pt-4 border-t border-emerald-100">
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600 hover:text-emerald-700"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600 hover:text-emerald-700"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600 hover:text-emerald-700"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
          {/* Contacter button */}
          <div className="px-5 pt-3 pb-6">
            <Button
              onClick={() => scrollToSection('contact')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contacter
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
