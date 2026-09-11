'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { AboutSection } from '@/components/storefront/AboutSection'

import { TestimonialsSection } from '@/components/storefront/TestimonialsSection'
import { FAQSection } from '@/components/storefront/FAQSection'
import { NewsletterSection } from '@/components/storefront/NewsletterSection'

export default function AProposPage() {
  // Testimonial state
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Testimonial auto-rotation on mobile
  useEffect(() => {
    if (!isMobile) return
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [isMobile])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return
    setNewsletterLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      if (res.ok) {
        setNewsletterSuccess(true)
        setNewsletterEmail('')
        setTimeout(() => setNewsletterSuccess(false), 3000)
      }
    } catch {
      // silent
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-[#888888]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1a1a1a] flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1a1a1a] font-medium">À Propos</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <section className="py-8 sm:py-12 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">À Propos de KALA&apos;S</h1>
          <p className="text-[#555555] mt-2 max-w-2xl">
            Une entreprise congolaise fière de fabriquer des produits d&apos;hygiène de qualité industrielle à Pointe-Noire.
          </p>
        </div>
      </section>

      <AboutSection />
      <TestimonialsSection
        activeTestimonial={activeTestimonial}
        setActiveTestimonial={setActiveTestimonial}
        isMobile={isMobile}
      />
      <FAQSection />
      <NewsletterSection
        newsletterEmail={newsletterEmail}
        setNewsletterEmail={setNewsletterEmail}
        newsletterLoading={newsletterLoading}
        newsletterSuccess={newsletterSuccess}
        onSubmit={handleNewsletterSubmit}
      />
    </StorefrontLayout>
  )
}
