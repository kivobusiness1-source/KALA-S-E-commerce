'use client'

import { Phone, Mail, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ContactForm {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface ContactSectionProps {
  contactForm: ContactForm
  setContactForm: (form: ContactForm) => void
  contactLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function ContactSection({ contactForm, setContactForm, contactLoading, onSubmit }: ContactSectionProps) {
  const contactInfo = [
    { icon: Phone, label: 'Telephone', value: '+242 06 123 4567' },
    { icon: Mail, label: 'Email', value: 'contact@kalas.cg' },
    { icon: MapPin, label: 'Adresse', value: 'Zone Industrielle, Pointe-Noire' },
  ]

  const hours = [
    { day: 'Lundi - Vendredi', hours: '8h - 18h' },
    { day: 'Samedi', hours: '8h - 14h' },
    { day: 'Dimanche', hours: 'Fermé' },
  ]

  return (
    <section id="contact" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-2">Contactez-Nous</h2>
          <p className="text-[#555555] max-w-xl">
            Une question ? N&rsquo;hesitez pas a nous contacter. Notre equipe est a votre disposition.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Cards */}
            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg border border-[#e5e5e5] flex items-center justify-center shrink-0">
                    <info.icon className="w-4 h-4 text-[#888888]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#888888]">{info.label}</p>
                    <p className="text-sm font-medium text-[#1a1a1a]">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Working Hours */}
            <div>
              <h3 className="font-semibold text-[#1a1a1a] text-sm mb-3">Horaires d&rsquo;ouverture</h3>
              <div className="space-y-2">
                {hours.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[#e5e5e5] last:border-0">
                    <span className="text-[#1a1a1a] font-medium">{h.day}</span>
                    <span className={h.hours === 'Fermé' ? 'text-[#dc2626]' : 'text-[#555555]'}>{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={onSubmit}
              className="bg-gray-50 rounded-xl p-6 border border-[#e5e5e5] space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name" className="text-[#1a1a1a] font-medium text-sm">Nom <span className="text-[#dc2626]">*</span></Label>
                  <Input
                    id="contact-name"
                    placeholder="Votre nom"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-[#1a1a1a] font-medium text-sm">Email <span className="text-[#dc2626]">*</span></Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] bg-white"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-phone" className="text-[#1a1a1a] font-medium text-sm">Telephone</Label>
                  <Input
                    id="contact-phone"
                    placeholder="+242 06 XXX XXXX"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-subject" className="text-[#1a1a1a] font-medium text-sm">Sujet</Label>
                  <Input
                    id="contact-subject"
                    placeholder="Sujet de votre message"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message" className="text-[#1a1a1a] font-medium text-sm">Message <span className="text-[#dc2626]">*</span></Label>
                <Textarea
                  id="contact-message"
                  placeholder="Votre message..."
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  className="border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] bg-white"
                />
              </div>
              <Button
                type="submit"
                disabled={contactLoading}
                className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white font-semibold"
              >
                {contactLoading ? 'Envoi en cours...' : 'Envoyer le message'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}