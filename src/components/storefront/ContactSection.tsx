'use client'

import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FadeInSection } from './AnimatedComponents'

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
  const schedule = [
    { day: 'Lun', label: 'Lundi', hours: '8h - 18h', open: true, width: '83.3%' },
    { day: 'Mar', label: 'Mardi', hours: '8h - 18h', open: true, width: '83.3%' },
    { day: 'Mer', label: 'Mercredi', hours: '8h - 18h', open: true, width: '83.3%' },
    { day: 'Jeu', label: 'Jeudi', hours: '8h - 18h', open: true, width: '83.3%' },
    { day: 'Ven', label: 'Vendredi', hours: '8h - 18h', open: true, width: '83.3%' },
    { day: 'Sam', label: 'Samedi', hours: '8h - 14h', open: true, width: '50%' },
    { day: 'Dim', label: 'Dimanche', hours: 'Fermé', open: false, width: '0%' },
  ]

  const contactInfo = [
    { icon: Phone, label: 'Téléphone', value: '+242 06 123 4567', color: 'bg-emerald-100 text-emerald-600' },
    { icon: Mail, label: 'Email', value: 'contact@congoclean.cg', color: 'bg-teal-100 text-teal-600' },
    { icon: MapPin, label: 'Adresse', value: 'Zone Industrielle, Pointe-Noire', color: 'bg-amber-100 text-amber-600' },
  ]

  return (
    <section id="contact" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 mb-4 px-4 py-1 text-sm font-medium">
              Nous sommes là pour vous
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contactez-Nous</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Une question ? N&rsquo;hésitez pas à nous contacter. Notre équipe est à votre disposition.
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* WhatsApp CTA Card */}
              <a
                href="https://wa.me/242061234567"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Commandez via WhatsApp</p>
                    <p className="text-emerald-100 text-sm">Réponse rapide · Facile et pratique</p>
                  </div>
                </div>
              </a>

              {/* Info Cards */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-5">Informations</h3>
                <div className="space-y-4">
                  {contactInfo.map((info, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-4 p-3 rounded-xl border-l-4 ${info.color.includes('emerald') ? 'border-l-emerald-400' : info.color.includes('teal') ? 'border-l-teal-400' : 'border-l-amber-400'} hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${info.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                        <info.icon className={`w-5 h-5 ${info.color.split(' ')[1]}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">{info.label}</p>
                        <p className="font-medium text-gray-900 truncate">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini-map placeholder */}
              <div className="relative rounded-2xl overflow-hidden h-40 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 border border-gray-100 shadow-sm">
                <div className="absolute inset-0 opacity-[0.06]" style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M30 0v60M0 30h60&quot; stroke=&quot;%23000&quot; fill=&quot;none&quot; stroke-width=&quot;0.5&quot;/%3E%3C/svg%3E")',
                }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/90 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-900">CongoClean</p>
                    <p className="text-[10px] text-gray-500">Zone Industrielle, Pointe-Noire</p>
                  </div>
                </div>
              </div>

              {/* Working Hours as Visual Timeline */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-lg mb-5">Horaires d&rsquo;ouverture</h3>
                <div className="space-y-2.5">
                  {schedule.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-8 text-xs font-semibold shrink-0 ${s.open ? 'text-gray-700' : 'text-gray-400'}`}>{s.day}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: s.width }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                          className={`h-full rounded-full ${s.open ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-200'}`}
                        />
                        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium ${s.open ? 'text-white' : 'text-gray-400'}`}>
                          {s.hours}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <form
                onSubmit={onSubmit}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-gray-700 font-medium">Nom <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact-name"
                      placeholder="Votre nom"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-gray-700 font-medium">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="text-gray-700 font-medium">Téléphone</Label>
                    <Input
                      id="contact-phone"
                      placeholder="+242 06 XXX XXXX"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-subject" className="text-gray-700 font-medium">Sujet</Label>
                    <Input
                      id="contact-subject"
                      placeholder="Sujet de votre message"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message" className="text-gray-700 font-medium">Message <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Votre message..."
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    className="border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={contactLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all duration-300"
                >
                  {contactLoading ? 'Envoi en cours...' : 'Envoyer le message'}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}