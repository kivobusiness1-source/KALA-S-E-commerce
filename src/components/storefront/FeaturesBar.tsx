'use client'

import { Shield, MapPin, Truck, Phone } from 'lucide-react'
import { FadeInSection, AnimatedCounter } from './AnimatedComponents'

export function FeaturesBar() {
  const features = [
    { icon: Shield, title: 'Qualité Garantie', desc: 'Normes industrielles strictes', target: 500, suffix: '+' },
    { icon: MapPin, title: 'Fabrication Locale', desc: '100% fabriqué à Pointe-Noire', target: 3, suffix: '+' },
    { icon: Truck, title: 'Livraison Rapide', desc: 'Sur toute la ville', target: 48, suffix: 'h' },
    { icon: Phone, title: 'Support 24/7', desc: 'Toujours à votre écoute', target: 7, suffix: 'j/7' },
  ]

  return (
    <section className="bg-white py-10 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <FadeInSection key={i}>
              <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left p-4 rounded-xl hover:bg-emerald-50/50 transition-all duration-300 hover:scale-[1.03] group">
                {/* Vertical divider on desktop (not last) */}
                {i < features.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 h-10 w-px bg-gradient-to-b from-transparent via-emerald-200 to-transparent" />
                )}
                {/* Icon with gradient background circle */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-emerald-100/50 transition-all duration-300">
                  <f.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">
                    <AnimatedCounter target={f.target} suffix={f.suffix} />
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