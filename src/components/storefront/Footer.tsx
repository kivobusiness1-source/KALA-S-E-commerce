'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Phone, Mail, MapPin, ChevronUp, Cookie, MessageCircle } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { formatPrice, getCategoryColor, getCategoryInitial } from './helpers'
import { TermsModal, PrivacyModal } from './LegalModals'
import type { ProductType } from './types'

interface FooterProps {
  scrollToSection: (id: string) => void
  recentlyViewed: ProductType[]
  setSelectedProduct: (product: ProductType) => void
  showBackToTop: boolean
  scrollProgress: number
  cookieConsentVisible: boolean
  setCookieConsentVisible: (visible: boolean) => void
}

export function Footer({
  scrollToSection,
  recentlyViewed,
  setSelectedProduct,
  showBackToTop,
  scrollProgress,
  cookieConsentVisible,
  setCookieConsentVisible,
}: FooterProps) {
  const [termsOpen, setTermsOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const navLinks = [
    { label: 'Accueil', id: 'hero' },
    { label: 'Produits', id: 'products' },
    { label: 'À Propos', id: 'about' },
    { label: 'Contact', id: 'contact' },
  ]

  const recentlyViewedSection = recentlyViewed.length > 0 ? (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Récemment consultés</h3>
        <div className="flex gap-4 overflow-x-auto flex-nowrap pb-2">
          {recentlyViewed.map((product) => {
            const catSlug = product.category?.slug || ''
            const gradient = getCategoryColor(catSlug)
            const initial = getCategoryInitial(catSlug)
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="shrink-0 w-40 group"
              >
                <div className="h-24 rounded-xl overflow-hidden bg-gray-100 mb-2">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <span className="text-3xl font-bold text-white/30 select-none">{initial}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1 text-left group-hover:text-emerald-400 transition-colors duration-300">{product.name}</p>
                <p className="text-sm text-emerald-700 font-semibold text-left">{formatPrice(product.price)}</p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  ) : null

  return (
    <>
      {recentlyViewedSection}

      <footer className="mt-auto bg-gray-900 text-gray-300">
        {/* Gradient line at top of footer */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CongoClean</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Fabricant de produits d&rsquo;hygiène de qualité industrielle basé à Pointe-Noire, Congo-Brazzaville.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-emerald-600/25">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 hover:text-white transition-colors duration-300"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gradient-to-br hover:from-amber-500 hover:to-orange-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-amber-500/25">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 hover:text-white transition-colors duration-300"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-gray-500/25">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-400 hover:text-white transition-colors duration-300"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Liens Rapides</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => scrollToSection(link.id)}
                      className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 text-sm hover:pl-1"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm">+242 06 123 4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm">contact@congoclean.cg</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm">Zone Industrielle, Pointe-Noire</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6 bg-gray-700" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="hover:text-emerald-400 transition-colors duration-300 inline-flex items-center gap-1"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                Retour en haut
              </button>
              <Separator orientation="vertical" className="h-3 bg-gray-700 hidden sm:block" />
              <button
                onClick={() => setTermsOpen(true)}
                className="hover:text-emerald-400 transition-colors duration-300"
              >
                Conditions Générales
              </button>
              <Separator orientation="vertical" className="h-3 bg-gray-700 hidden sm:block" />
              <button
                onClick={() => setPrivacyOpen(true)}
                className="hover:text-emerald-400 transition-colors duration-300"
              >
                Politique de Confidentialité
              </button>
            </div>
            <p>© 2025 CongoClean. Tous droits réservés. Fabriqué avec ❤️ à Pointe-Noire, Congo-Brazzaville</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/242061234567"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-6 right-[5.5rem] z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
        <MessageCircle className="w-6 h-6 relative z-10" />
      </a>

      {/* Back to Top Button with Scroll Progress */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40"
          >
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-12 h-12 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              aria-label="Retour en haut"
            >
              <svg className="absolute inset-0 w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-200"
                />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-emerald-500"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress)}`}
                  strokeLinecap="round"
                />
              </svg>
              <ChevronUp className="w-5 h-5 relative z-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {cookieConsentVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cookie className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="text-sm text-gray-700">Nous utilisons des cookies pour améliorer votre expérience.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    localStorage.setItem('congoclean_cookie_consent', 'rejected')
                    setCookieConsentVisible(false)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors"
                >
                  Refuser
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('congoclean_cookie_consent', 'accepted')
                    setCookieConsentVisible(false)
                  }}
                  className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
                >
                  Accepter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}