'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, ChevronUp, Lock, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from './helpers'
import { TermsModal, PrivacyModal } from './LegalModals'
import type { ProductType } from './types'

interface FooterProps {
  recentlyViewed: ProductType[]
  setSelectedProduct: (product: ProductType) => void
  showBackToTop: boolean
  cookieConsentVisible: boolean
  setCookieConsentVisible: (visible: boolean) => void
}

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Produits', href: '/produits' },
  { label: 'Entreprises', href: '/entreprises' },
  { label: 'A Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export function Footer({
  recentlyViewed,
  setSelectedProduct,
  showBackToTop,
  cookieConsentVisible,
  setCookieConsentVisible,
}: FooterProps) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  useEffect(() => {
    const email = localStorage.getItem('kalas_loyalty_email')
    if (!email) return
    fetch(`/api/loyalty?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { /* loyalty points - handled silently */ })
      .catch(() => {})
  }, [])

  const recentlyViewedSection = recentlyViewed.length > 0 ? (
    <section className="py-8 bg-white border-t border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">Recemment consultes</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentlyViewed.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="shrink-0 w-36 text-left group"
            >
              <div className="h-20 rounded-lg overflow-hidden bg-gray-100 mb-2">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-300">CC</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1 group-hover:underline">{product.name}</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{formatPrice(product.price)}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  ) : null

  return (
    <>
      {recentlyViewedSection}

      <footer className="mt-auto bg-[#1a1a1a] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CC</span>
                </div>
                <span className="text-lg font-bold text-white">KALA&apos;S</span>
              </div>
              <p className="text-sm leading-relaxed">
                Fabricant de produits d&rsquo;hygiene de qualite industrielle base a Pointe-Noire, Congo-Brazzaville.
              </p>
            </div>

            {/* A propos */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">A propos</h4>
              <p className="text-sm leading-relaxed">
                KALA&apos;S est une entreprise congolaise specialisee dans la fabrication de produits de nettoyage. Notre mission est de fournir des solutions d&rsquo;hygiene accessibles et efficaces.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Liens Rapides</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm">+242 06 123 4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm">contact@kalas.cg</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <span className="text-sm">Zone Industrielle, Pointe-Noire</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-white transition-colors duration-150 inline-flex items-center gap-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Retour en haut
              </button>
              <Separator orientation="vertical" className="h-3 bg-white/10 hidden sm:block" />
              <button
                onClick={() => setTermsOpen(true)}
                className="hover:text-white transition-colors duration-150"
              >
                Conditions Generales
              </button>
              <Separator orientation="vertical" className="h-3 bg-white/10 hidden sm:block" />
              <button
                onClick={() => setPrivacyOpen(true)}
                className="hover:text-white transition-colors duration-150"
              >
                Politique de Confidentialite
              </button>
            </div>
            <p className="text-xs">2025 KALA&apos;S. Tous droits reserves.</p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-[#333] border border-[#e5e5e5] text-white rounded-full shadow-sm flex items-center justify-center hover:shadow-md hover:bg-[#1a1a1a] transition-shadow duration-150"
                aria-label="Retour en haut"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-[#1a1a1a] text-white text-xs border-none">
              Retour en haut
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />

      {/* Cookie Consent Banner */}
      {cookieConsentVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white border-t border-[#e5e5e5] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-[#888888]" />
                </div>
                <div>
                  <p className="text-sm text-[#1a1a1a] font-medium">Nous utilisons des cookies pour ameliorer votre experience.</p>
                  <button
                    onClick={() => setPrivacyOpen(true)}
                    className="text-xs text-[#888888] hover:text-[#1a1a1a] hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <Info className="w-3 h-3" />
                    En savoir plus
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    localStorage.setItem('kalas_cookie_consent', 'rejected')
                    setCookieConsentVisible(false)
                  }}
                  className="text-sm text-[#888888] hover:text-[#1a1a1a] px-4 py-2 transition-colors duration-150"
                >
                  Refuser
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('kalas_cookie_consent', 'accepted')
                    setCookieConsentVisible(false)
                  }}
                  className="text-sm bg-[#1a1a1a] hover:bg-[#333] text-white px-5 py-2 rounded-lg font-medium transition-colors duration-150"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
