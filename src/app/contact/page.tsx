'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { toast } from 'sonner'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import type { TrackedOrder } from '@/components/storefront/types'

import { ContactSection } from '@/components/storefront/ContactSection'
import { DeliveryPricingSection } from '@/components/storefront/DeliveryPricingSection'
import { OrderTrackingSection } from '@/components/storefront/OrderTrackingSection'

export default function ContactPage() {
  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [contactLoading, setContactLoading] = useState(false)

  // Order tracking state
  const [trackEmail, setTrackEmail] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([])

  // Contact form submit
  const handleContactSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setContactLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      if (res.ok) {
        toast.success('Message envoyé avec succès !')
        setContactForm({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        toast.error('Erreur lors de l\'envoi du message')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setContactLoading(false)
    }
  }, [contactForm])

  // Order tracking submit
  const handleTrackOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackEmail) {
      toast.error('Veuillez entrer votre email')
      return
    }
    setTrackLoading(true)
    setTrackedOrders([])
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trackEmail }),
      })
      if (res.ok) {
        const data = await res.json()
        const orders = data.data || data.orders || []
        setTrackedOrders(orders)
        if (orders.length === 0) {
          toast.info('Aucune commande trouvée pour cet email')
        }
      } else {
        toast.error('Erreur lors de la recherche')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setTrackLoading(false)
    }
  }, [trackEmail])

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
            <span className="text-[#1a1a1a] font-medium">Contact</span>
          </nav>
        </div>
      </div>

      {/* Page Header */}
      <section className="py-8 sm:py-12 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Contactez-nous</h1>
          <p className="text-[#555555] mt-2 max-w-2xl">
            Une question, une suggestion ou besoin d&apos;aide ? Notre équipe est disponible pour vous accompagner.
          </p>
        </div>
      </section>

      <ContactSection
        contactForm={contactForm}
        setContactForm={setContactForm}
        contactLoading={contactLoading}
        onSubmit={handleContactSubmit}
      />
      <DeliveryPricingSection />
      <OrderTrackingSection
        trackedOrders={trackedOrders}
        trackLoading={trackLoading}
        onTrackOrder={handleTrackOrder}
        trackEmail={trackEmail}
        setTrackEmail={setTrackEmail}
      />
    </StorefrontLayout>
  )
}
