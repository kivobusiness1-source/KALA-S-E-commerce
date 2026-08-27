'use client'

import { ShoppingCart, ClipboardList, Truck } from 'lucide-react'
import { FadeInSection } from './AnimatedComponents'

export function HowToOrderSection() {
  const steps = [
    { step: '01', icon: ShoppingCart, title: 'Choisissez vos produits', desc: 'Parcourez notre catalogue et ajoutez les produits souhaités à votre panier.' },
    { step: '02', icon: ClipboardList, title: 'Passez votre commande', desc: 'Remplissez vos informations de livraison et confirmez votre commande.' },
    { step: '03', icon: Truck, title: 'Recevez votre livraison', desc: 'Notre équipe vous livre rapidement à Pointe-Noire et environs.' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comment Commander</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              En 3 étapes simples, recevez vos produits chez vous
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" />
          {steps.map((s, i) => (
            <FadeInSection key={i}>
              <div className="relative text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 relative z-10">
                  <s.icon className="w-7 h-7" />
                </div>
                <p className="text-xs text-emerald-600 font-medium mb-2">Étape {s.step}</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  )
}
