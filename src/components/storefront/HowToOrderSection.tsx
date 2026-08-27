'use client'

import { ShoppingCart, ClipboardList, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeInSection } from './AnimatedComponents'

export function HowToOrderSection() {
  const steps = [
    { step: '01', icon: ShoppingCart, title: 'Choisissez vos produits', desc: 'Parcourez notre catalogue et ajoutez les produits souhaités à votre panier.', badge: '\uD83D\uDED2' },
    { step: '02', icon: ClipboardList, title: 'Passez votre commande', desc: 'Remplissez vos informations de livraison et confirmez votre commande.', badge: '\uD83D\uDCCB' },
    { step: '03', icon: Truck, title: 'Recevez votre livraison', desc: 'Notre équipe vous livre rapidement à Pointe-Noire et environs.', badge: '\uD83D\uDE9A' },
  ]

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 mb-4 px-4 py-1 text-sm font-medium">
              Commande Facile
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Comment Commander</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              En 3 étapes simples, recevez vos produits chez vous
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 relative">
          {/* Animated dashed connecting line */}
          <div className="absolute top-[88px] left-[calc(16.67%+48px)] right-[calc(16.67%+48px)] h-0 z-0">
            <div className="w-full h-full relative overflow-hidden">
              <div className="absolute inset-0 animate-[dashFlow_2s_linear_infinite]" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #6ee7b7 0, #6ee7b7 8px, transparent 8px, transparent 20px)',
                backgroundSize: '200% 100%',
              }} />
            </div>
          </div>
          {steps.map((s, i) => (
            <FadeInSection key={i}>
              <div className="relative text-center group cursor-default">
                {/* Step card with border and shadow */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 pt-4 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                  {/* Large faded step watermark */}
                  <span className="absolute -top-4 -right-2 text-[120px] font-black text-gray-50 select-none leading-none pointer-events-none">
                    {s.step}
                  </span>
                  {/* Step circle with gradient ring and glow */}
                  <div className="relative z-10 flex justify-center mb-6">
                    <div className="absolute w-[88px] h-[88px] rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 animate-[pulseGlow_3s_ease-in-out_infinite]" />
                    <div className="absolute w-[76px] h-[76px] rounded-full bg-gradient-to-br from-emerald-200 to-teal-200" />
                    <div className="relative w-[64px] h-[64px] rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-200/60 z-10">
                      <s.icon className="w-7 h-7" />
                      {/* Pulsing green dot */}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold tracking-wider uppercase mb-2 relative z-10">
                    Étape {s.step}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto relative z-10">{s.desc}</p>
                  {/* Emoji badge below title */}
                  <div className="mt-4 relative z-10">
                    <span className="text-2xl">{s.badge}</span>
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Mobile Layout - vertical */}
        <div className="md:hidden relative">
          {/* Vertical dashed connecting line */}
          <div className="absolute left-8 top-[72px] bottom-[72px] w-0 z-0">
            <div className="w-full h-full relative overflow-hidden">
              <div className="absolute inset-0 animate-[dashFlowV_2s_linear_infinite]" style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #6ee7b7 0, #6ee7b7 8px, transparent 8px, transparent 20px)',
                backgroundSize: '100% 200%',
              }} />
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {steps.map((s, i) => (
              <FadeInSection key={i}>
                <div className="relative flex gap-5 group">
                  {/* Step circle - mobile */}
                  <div className="relative z-10 shrink-0">
                    <div className="absolute w-[68px] h-[68px] rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 animate-[pulseGlow_3s_ease-in-out_infinite]" style={{ top: '-8px', left: '-8px' }} />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-200/60 z-10">
                      <s.icon className="w-6 h-6" />
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white">
                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      </span>
                    </div>
                  </div>
                  {/* Step card - mobile */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <span className="absolute -top-3 -right-1 text-[80px] font-black text-gray-50 select-none leading-none pointer-events-none">
                      {s.step}
                    </span>
                    <div className="relative z-10">
                      <p className="text-xs text-emerald-600 font-semibold tracking-wider uppercase mb-1">Étape {s.step}</p>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{s.title} <span className="text-lg ml-1">{s.badge}</span></h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes dashFlow {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
          }
          @keyframes dashFlowV {
            0% { background-position: 0% 0%; }
            100% { background-position: 0% 200%; }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.08); }
          }
        `}</style>
      </div>
    </section>
  )
}