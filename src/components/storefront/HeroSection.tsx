'use client'

import { motion } from 'framer-motion'
import { Star, ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypingEffect } from './AnimatedComponents'

interface HeroSectionProps {
  scrollToSection: (id: string) => void
}

export function HeroSection({ scrollToSection }: HeroSectionProps) {
  return (
    <section id="hero" className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-banner.png" alt="CongoClean" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-emerald-700/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" />
        {/* Diagonal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-teal-900/30" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }} />
      </div>

      {/* Floating decorative elements with CSS animations */}
      <div className="absolute top-24 right-16 sm:right-24 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-400/20 animate-[heroFloat_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-32 right-1/3 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-400/25 to-cyan-400/15 animate-[heroFloat_8s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-[10%] w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-300/20 to-emerald-500/10 animate-[heroFloat_7s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />

      {/* Original blurred decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-40 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 left-1/3 w-24 h-24 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <Badge className="mb-6 bg-emerald-500/25 backdrop-blur-sm text-emerald-200 border-emerald-400/30 px-4 py-1.5 text-sm font-medium">
            <Star className="w-3.5 h-3.5 mr-1.5" />
            Qualité Industrielle depuis Pointe-Noire
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 [text-shadow:0_2px_20px_rgba(0,0,0,0.3)]">
            Produits d&rsquo;Hygiène Fabriqués au{' '}
            <span className="text-emerald-300">Congo-Brazzaville</span>
          </h1>
          <div className="mb-8 h-8">
            <TypingEffect phrases={['Qualité Industrielle', 'Fabrication Locale', 'Livraison Rapide']} />
          </div>
          <p className="text-lg sm:text-xl text-emerald-100/90 mb-8 leading-relaxed max-w-xl">
            Savon liquide, détergent et eau de Javel de qualité industrielle. Fabriqué avec fierté à Pointe-Noire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollToSection('products')}
              className="group relative bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-lg overflow-hidden transition-all duration-300"
            >
              <span className="relative z-10 flex items-center">
                Voir nos Produits
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('contact')}
              className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
            >
              Nous Contacter
              <Phone className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Animated gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />

      {/* Keyframes for floating animation */}
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </section>
  )
}
