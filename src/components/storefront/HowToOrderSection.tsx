'use client'

import { ShoppingCart, ClipboardList, Truck } from 'lucide-react'
import { FadeInSection } from './AnimatedComponents'

export function HowToOrderSection() {
  const steps = [
    { step: '01', icon: ShoppingCart, title: 'Choisissez vos produits', desc: 'Parcourez notre catalogue et ajoutez les produits souhaites a votre panier.' },
    { step: '02', icon: ClipboardList, title: 'Passez votre commande', desc: 'Remplissez vos informations de livraison et confirmez votre commande.' },
    { step: '03', icon: Truck, title: 'Recevez votre livraison', desc: 'Notre equipe vous livre rapidement a Pointe-Noire et environs.' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-[#888888] tracking-wide uppercase mb-4">
              Commande Facile
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">Comment Commander</h2>
            <p className="text-[#555555] max-w-2xl mx-auto">
              En 3 etapes simples, recevez vos produits chez vous
            </p>
            <div className="w-16 h-1 bg-[#1a1a1a] rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="absolute top-[88px] left-[calc(16.67%+48px)] right-[calc(16.67%+48px)] h-px bg-[#e5e5e5] z-0" />
          {steps.map((s, i) => (
            <FadeInSection key={i}>
              <div className="relative text-center group cursor-default">
                <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-6 pt-4 hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                  {/* Large faded step watermark */}
                  <span className="absolute -top-4 -right-2 text-[120px] font-black text-gray-50 select-none leading-none pointer-events-none">
                    {s.step}
                  </span>
                  {/* Step circle */}
                  <div className="relative z-10 flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center">
                      <s.icon className="w-7 h-7" />
                    </div>
                  </div>
                  <p className="text-xs text-[#888888] font-semibold tracking-wider uppercase mb-2 relative z-10">
                    Etape {s.step}
                  </p>
                  <h3 className="text-lg font-bold text-[#1a1a1a] mb-2 relative z-10">{s.title}</h3>
                  <p className="text-[#555555] text-sm leading-relaxed max-w-xs mx-auto relative z-10">{s.desc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Mobile Layout - vertical */}
        <div className="md:hidden relative">
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-[72px] bottom-[72px] w-px bg-[#e5e5e5] z-0" />
          <div className="flex flex-col gap-8">
            {steps.map((s, i) => (
              <FadeInSection key={i}>
                <div className="relative flex gap-5 group">
                  {/* Step circle - mobile */}
                  <div className="relative z-10 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center z-10">
                      <s.icon className="w-6 h-6" />
                    </div>
                  </div>
                  {/* Step card - mobile */}
                  <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-sm p-5 flex-1 hover:shadow-md hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                    <span className="absolute -top-3 -right-1 text-[80px] font-black text-gray-50 select-none leading-none pointer-events-none">
                      {s.step}
                    </span>
                    <div className="relative z-10">
                      <p className="text-xs text-[#888888] font-semibold tracking-wider uppercase mb-1">Etape {s.step}</p>
                      <h3 className="text-base font-bold text-[#1a1a1a] mb-1">{s.title}</h3>
                      <p className="text-[#555555] text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}