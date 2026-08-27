'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeInSection } from './AnimatedComponents'

interface NewsletterSectionProps {
  newsletterEmail: string
  setNewsletterEmail: (val: string) => void
  newsletterLoading: boolean
  newsletterSuccess: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function NewsletterSection({
  newsletterEmail,
  setNewsletterEmail,
  newsletterLoading,
  newsletterSuccess,
  onSubmit,
}: NewsletterSectionProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
      {/* Wave SVG divider */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H0Z" fill="white"/>
        </svg>
      </div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInSection>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Restez Informé</h2>
            <p className="text-emerald-100 mb-8">
              Inscrivez-vous pour recevoir nos offres spéciales et nouveautés
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-white/80 to-white/40 rounded-full mx-auto mt-4" />
            <AnimatePresence mode="wait">
              {newsletterSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="flex flex-col items-center gap-4 mt-8"
                >
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-white font-semibold text-lg">Merci pour votre inscription !</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={onSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8"
                >
                  <Input
                    type="email"
                    placeholder="Votre adresse email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-emerald-200 focus:border-white focus:ring-white/20"
                  />
                  <Button
                    type="submit"
                    disabled={newsletterLoading}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8"
                  >
                    {newsletterLoading ? '...' : 'S\'abonner'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}