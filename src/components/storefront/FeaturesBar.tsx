'use client'

import { Shield, MapPin, Truck, Phone } from 'lucide-react'

export function FeaturesBar() {
  const features = [
    { icon: Shield, title: 'Qualité Garantie', desc: 'Normes industrielles strictes', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { icon: MapPin, title: 'Fabrication Locale', desc: '100% fabriqué à Pointe-Noire', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    { icon: Truck, title: 'Livraison Rapide', desc: 'Sur toute la ville en 24-48h', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { icon: Phone, title: 'Support 24/7', desc: 'Toujours à votre écoute', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
  ]

  return (
    <section className="bg-white py-12 border-y border-[#e5e5e5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 ${f.bg}`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#1a1a1a]">{f.title}</h3>
                <p className="text-xs text-[#555555] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
