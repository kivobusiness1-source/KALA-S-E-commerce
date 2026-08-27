'use client'

import { motion } from 'framer-motion'
import { Star, ArrowRight, Phone, ChevronDown, Droplets, FlaskConical, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypingEffect } from './AnimatedComponents'

interface HeroSectionProps {
  scrollToSection: (id: string) => void
}

const floatingProducts = [
  { name: 'Savon Liquide', icon: Droplets, x: '65%', y: '20%', delay: '0s' },
  { name: 'Détergent', icon: FlaskConical, x: '75%', y: '55%', delay: '1.5s' },
  { name: 'Eau de Javel', icon: Beaker, x: '55%', y: '75%', delay: '3s' },
]

export function HeroSection({ scrollToSection }: HeroSectionProps) {
  return (
    <section id="hero" className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/hero-banner.png" alt="CongoClean" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/70 to-emerald-700/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" />
        {/* Diagonal gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-teal-900/30" style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }} />

        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Floating decorative elements with CSS animations */}
      <div className="absolute top-24 right-16 sm:right-24 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-400/20 animate-[heroFloat_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-32 right-1/3 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-teal-400/25 to-cyan-400/15 animate-[heroFloat_8s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-[10%] w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-300/20 to-emerald-500/10 animate-[heroFloat_7s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />

      {/* Original blurred decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-40 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 left-1/3 w-24 h-24 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating product cards - desktop only */}
      <div className="hidden lg:block">
        {floatingProducts.map((product, i) => {
          const Icon = product.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.3, duration: 0.6 }}
              className="absolute"
              style={{ left: product.x, top: product.y }}
            >
              <div
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg animate-[heroFloat_8s_ease-in-out_infinite]"
                style={{ animationDelay: product.delay }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-white/80 text-xs font-medium whitespace-nowrap">{product.name}</span>
              </div>
            </motion.div>
          )
        })}
      </div>

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
          <p className="text-lg sm:text-xl text-emerald-100/90 mb-3 leading-relaxed max-w-xl">
            Savon liquide, détergent et eau de Javel de qualité industrielle. Fabriqué avec fierté à Pointe-Noire.
          </p>

          {/* Satisfaction micro-badge */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-white/90 text-sm font-medium">4.8/5</span>
              <span className="text-white/60 text-sm">satisfaction client</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollToSection('products')}
              className="group relative bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 py-6 shadow-lg shadow-emerald-900/20 overflow-hidden transition-all duration-300 hover:shadow-emerald-400/30 hover:shadow-xl"
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
              className="border-white/40 text-white hover:bg-white/10 hover:border-white/60 font-semibold text-base px-8 py-6 transition-all duration-300 hover:shadow-lg hover:shadow-white/5"
            >
              Nous Contacter
              <Phone className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Animated gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" style={{ backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />

      {/* Animated scroll-down chevron */}
      <motion.button
        onClick={() => scrollToSection('features')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 group cursor-pointer"
        aria-label="Défiler vers le bas"
      >
        <span className="text-white/50 text-xs font-medium group-hover:text-white/70 transition-colors">Découvrir</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-white/60 group-hover:text-white/90 transition-colors" />
        </motion.div>
      </motion.button>

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
