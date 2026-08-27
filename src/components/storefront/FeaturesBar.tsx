'use client'

import { Shield, MapPin, Truck, Phone, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeInSection, AnimatedCounter } from './AnimatedComponents'

export function FeaturesBar() {
  const features = [
    { icon: Shield, title: 'Qualité Garantie', desc: 'Normes industrielles strictes', target: 500, suffix: '+' },
    { icon: MapPin, title: 'Fabrication Locale', desc: '100% fabriqué à Pointe-Noire', target: 3, suffix: '+' },
    { icon: Truck, title: 'Livraison Rapide', desc: 'Sur toute la ville', target: 48, suffix: 'h' },
    { icon: Phone, title: 'Support 24/7', desc: 'Toujours à votre écoute', target: 7, suffix: 'j/7', isNew: true },
  ]

  return (
    <section className="bg-white py-10 border-b border-gray-100 shadow-sm relative overflow-hidden">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <FadeInSection key={i}>
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left p-4 sm:p-5 rounded-xl hover:bg-emerald-50/30 transition-all duration-300 group">
                {/* Colored bottom border that slides in on hover */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full group-hover:w-3/4 transition-all duration-500 ease-out" />

                {/* Vertical divider on desktop (not last) */}
                {i < features.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'repeating-linear-gradient(180deg, #d1d5db 0, #d1d5db 3px, transparent 3px, transparent 8px)',
                    }} />
                  </div>
                )}

                {/* Icon - larger on mobile */}
                <div className="w-12 h-12 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-emerald-100/50 transition-all duration-300">
                  <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h3 className="font-semibold text-sm sm:text-base bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                      {f.title}
                    </h3>
                    {f.isNew && (
                      <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 border-0 leading-4">Nouveau</Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5 tabular-nums">
                    <AnimatedCounter target={f.target} suffix={f.suffix} />
                    <Sparkles className="w-3.5 h-3.5 inline-block ml-1 text-amber-400" />
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
    </section>
  )
}