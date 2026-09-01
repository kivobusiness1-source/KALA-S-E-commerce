'use client'

import { ShoppingCart, Search, Home, Package, Info, Phone, Menu, X } from 'lucide-react'
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
    { label: 'A Propos', id: 'about', icon: Info },
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
    <header className="sticky top-0 z-50 bg-white border-b border-[#e2e8f0]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity duration-150">
            <div className="w-9 h-9 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <span className="text-white text-sm font-bold tracking-tight">CC</span>
            </div>
            <span className="text-xl font-bold text-[#1a1a2e] tracking-tight">CongoClean</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="relative text-sm font-medium text-[#1a1a2e] hover:text-[#c8a951] transition-colors duration-150 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-[#c8a951] after:transition-all after:duration-150 hover:after:w-full"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Cart + Search + Mobile Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 text-[#64748b] hover:text-[#1a1a2e]"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onCartOpen}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-[#64748b]" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#1a1a2e] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-[#64748b]" />
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
              <SheetTitle className="flex items-center gap-2.5 text-[#1a1a2e]">
                <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <span className="text-lg font-bold tracking-tight">CongoClean</span>
              </SheetTitle>
              <SheetDescription className="sr-only">Navigation</SheetDescription>
            </SheetHeader>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4 text-[#64748b]" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 px-3 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left px-4 py-3 rounded-lg text-[#1a1a2e] hover:bg-gray-50 transition-colors duration-150 font-medium flex items-center gap-3"
                >
                  <Icon className="w-4 h-4 text-[#64748b]" />
                  <span>{link.label}</span>
                </button>
              )
            })}
          </div>

          {/* Contact button at bottom */}
          <div className="px-5 pt-4 pb-6 border-t border-[#e2e8f0]">
            <Button
              onClick={() => scrollToSection('contact')}
              className="w-full bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white font-medium"
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
