'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Droplets, ShieldCheck } from 'lucide-react'

interface HeroSectionProps {
  scrollToSection: (id: string) => void
}

export function HeroSection({ scrollToSection }: HeroSectionProps) {
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const res = await fetch('/api/site-settings')
        if (res.ok) {
          const data = await res.json()
          const settings = data.data || data.settings || data
          if (settings.hero_image_url) {
            setHeroImageUrl(settings.hero_image_url)
          }
        }
      } catch { /* use default */ }
    }
    fetchHeroImage()
  }, [])

  return (
    <section id="hero" className="relative w-full min-h-[560px] lg:min-h-[640px] flex items-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-teal-100/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-50/50 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="max-w-xl opacity-0 animate-[heroFadeIn_0.7s_ease-out_forwards]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-6 border border-emerald-200/50">
              <Sparkles className="h-3.5 w-3.5" />
              Qualité industrielle · Brazzaville
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-gray-900 leading-tight mb-5 tracking-tight">
              Produits d&rsquo;Hygiène
              <br />
              <span className="text-emerald-600">Fabriqués au Congo</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 mb-8 leading-relaxed max-w-md">
              Savon liquide, détergent et eau de Javel de qualité industrielle. Fabriqué avec fierté à Pointe-Noire pour les ménages et professionnels.
            </p>

            {/* Trust indicators instead of CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Droplets className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">100% Qualité</p>
                  <p className="text-xs text-gray-400">Normes industrielles</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Livraison 24-48h</p>
                  <p className="text-xs text-gray-400">Brazzaville & environs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right image area */}
          <div className="hidden lg:flex justify-center items-center opacity-0 animate-[heroFadeIn_0.7s_ease-out_0.25s_forwards]">
            <div className="relative w-full max-w-md">
              {/* Decorative frame */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-sm" />
              <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-emerald-900/10 border border-white/60">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="KALA'S Produits d'hygiène"
                    className="w-full h-auto object-cover max-h-[420px]"
                  />
                ) : (
                  <div className="w-full h-[380px] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <div className="text-center">
                      <Droplets className="h-16 w-16 text-emerald-300 mx-auto mb-3" />
                      <p className="text-sm text-emerald-400 font-medium">KALA'S</p>
                      <p className="text-xs text-emerald-300 mt-1">Produits d&apos;hygiène</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-3 -left-3 bg-white rounded-xl px-4 py-2.5 shadow-lg shadow-gray-200/50 border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Depuis</p>
                <p className="text-sm font-bold text-gray-800">Pointe-Noire 🇨🇬</p>
              </div>
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
