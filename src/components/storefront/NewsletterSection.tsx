'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Send, Mail, ShieldCheck, XCircle } from 'lucide-react'
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

function ConfettiDots() {
  const dots = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: -(Math.random() * 120 + 40),
    color: ['#10b981', '#14b8a6', '#fbbf24', '#22d3ee', '#f472b6', '#a78bfa'][i % 6],
    size: Math.random() * 6 + 4,
    delay: Math.random() * 0.3,
    duration: Math.random() * 0.6 + 0.8,
  }))

  return (
    <div className="relative w-full h-0 flex justify-center">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: dot.x,
            y: dot.y,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            ease: 'easeOut',
          }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: dot.color,
            width: dot.size,
            height: dot.size,
          }}
        />
      ))}
    </div>
  )
}

export function NewsletterSection({
  newsletterEmail,
  setNewsletterEmail,
  newsletterLoading,
  newsletterSuccess,
  onSubmit,
}: NewsletterSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e)
  }

  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 relative overflow-hidden">
      {/* Wave SVG divider top */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H0Z" fill="white"/>
        </svg>
      </div>

      {/* Wave SVG divider bottom */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-[99%]">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          <path d="M0 0L48 5C96 10 192 20 288 25C384 30 480 30 576 26.7C672 23.3 768 16.7 864 15C960 13.3 1056 16.7 1152 20C1248 23.3 1344 26.7 1392 28.3L1440 30V0H0Z" fill="url(#bottomGrad)"/>
          <defs>
            <linearGradient id="bottomGrad" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.1"/>
              <stop offset="50%" stopColor="#0d9488" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#059669" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating decorative shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-[10%] w-16 h-16 rounded-full bg-white/5 animate-[float1_6s_ease-in-out_infinite]" />
        <div className="absolute top-20 right-[15%] w-10 h-10 rounded-full bg-white/8 animate-[float2_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-16 left-[20%] w-8 h-8 rounded-full bg-white/6 animate-[float3_7s_ease-in-out_infinite]" />
        <div className="absolute top-12 right-[35%] w-4 h-4 rounded-full bg-white/10 animate-[float1_5s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-10 right-[25%] w-6 h-6 rounded-full bg-white/7 animate-[float2_9s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-1/2 left-[5%] w-3 h-3 rounded-full bg-white/10 animate-[float3_4s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-[8%] w-5 h-5 rounded-full bg-white/5 animate-[float1_7s_ease-in-out_infinite_2s]" />
      </div>

      {/* Dot pattern background */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInSection>
          <div className="text-center max-w-2xl mx-auto">
            {/* Animated mail icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center mb-5"
            >
              <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-7 h-7 text-white" />
              </div>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Restez Informé</h2>
            <p className="text-emerald-100 mb-3">
              Inscrivez-vous pour recevoir nos offres spéciales et nouveautés
            </p>

            {/* Social proof */}
            <p className="text-emerald-200/80 text-sm mb-6">
              <span className="font-semibold">Rejoignez 1 200+ abonnés</span> · Newsletter mensuelle
            </p>

            <div className="w-16 h-1 bg-gradient-to-r from-white/80 to-white/40 rounded-full mx-auto" />

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
                  {newsletterSuccess && <ConfettiDots />}
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
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
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-200 pointer-events-none" />
                    <Input
                      type="email"
                      placeholder="Votre adresse email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-emerald-200/70 focus:border-white/50 focus:ring-white/20 backdrop-blur-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={newsletterLoading}
                    className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8 shadow-lg shadow-emerald-900/20"
                  >
                    {newsletterLoading ? '...' : "S'abonner"}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-200/80 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pas de spam</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-200/80 text-xs">
                <XCircle className="w-3.5 h-3.5" />
                <span>Désabonnement facile</span>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Keyframe animations for floating shapes */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </section>
  )
}