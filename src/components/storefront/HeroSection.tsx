'use client'

import { ArrowRight, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  scrollToSection: (id: string) => void
}

export function HeroSection({ scrollToSection }: HeroSectionProps) {
  return (
    <section id="hero" className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-center bg-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl" style={{ opacity: 0, animation: 'heroFadeIn 0.6s ease-out forwards' }}>
            <p className="text-[#c8a951] text-sm font-medium tracking-wide uppercase mb-4">
              Qualite industrielle depuis Pointe-Noire
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-tight mb-6">
              Produits d&rsquo;Hygiene Fabriques au Congo-Brazzaville
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-md">
              Savon liquide, detergent et eau de Javel de qualite industrielle. Fabrique avec fierte a Pointe-Noire.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => scrollToSection('products')}
                className="bg-[#c8a951] hover:bg-[#c8a951]/90 text-[#1a1a2e] font-semibold text-base px-8 py-6 h-auto"
              >
                Voir nos Produits
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('contact')}
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/30 font-semibold text-base px-8 py-6 h-auto"
              >
                Nous Contacter
                <Phone className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Product image on the right */}
          <div className="hidden lg:flex justify-center items-center" style={{ opacity: 0, animation: 'heroFadeIn 0.6s ease-out 0.2s forwards' }}>
            <div className="relative w-full max-w-md">
              <img
                src="/hero-banner.png"
                alt="CongoClean Produits"
                className="w-full h-auto rounded-2xl object-cover max-h-[420px]"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
