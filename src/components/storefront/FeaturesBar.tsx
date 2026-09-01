'use client'

import { Shield, MapPin, Truck, Phone } from 'lucide-react'

export function FeaturesBar() {
  const features = [
    { icon: Shield, title: 'Qualite Garantie', desc: 'Normes industrielles strictes' },
    { icon: MapPin, title: 'Fabrication Locale', desc: '100% fabrique a Pointe-Noire' },
    { icon: Truck, title: 'Livraison Rapide', desc: 'Sur toute la ville' },
    { icon: Phone, title: 'Support 24/7', desc: 'Toujours a votre ecoute' },
  ]

  return (
    <section className="bg-white py-10 border-y border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg border border-[#e2e8f0] flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-[#1a1a2e]" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#1a1a2e]">{f.title}</h3>
                <p className="text-xs text-[#64748b] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
