'use client'

import { Truck, MapPin, Clock, Package, CheckCircle, Zap } from 'lucide-react'
import { FadeInSection } from './AnimatedComponents'

const deliveryZones = [
  {
    name: 'Centre-Ville',
    price: 'GRATUIT',
    priceRaw: 0,
    delay: '24h',
    description: 'Zone industrielle, centre-ville, Avenue Amilcar Cabral',
    free: true,
  },
  {
    name: 'Peripherie Proche',
    price: '1 000 FCFA',
    priceRaw: 1000,
    delay: '24-48h',
    description: 'Mboukou, Tchimbamba, Loandjili',
    free: false,
  },
  {
    name: 'Peripherie Eloignee',
    price: '1 500 FCFA',
    priceRaw: 1500,
    delay: '48h',
    description: 'Hinda, Sibiti, Dolisie (sur demande)',
    free: false,
  },
]

export function DeliveryPricingSection() {
  return (
    <FadeInSection>
      <section className="py-16 sm:py-20 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">Livraison & Tarifs</h2>
            <p className="text-[#555555] max-w-2xl mx-auto">
              Livraison rapide et fiable a Pointe-Noire et environs
            </p>
            <div className="w-16 h-1 bg-[#1a1a1a] rounded-full mx-auto mt-4" />
          </div>

          {/* Simple map placeholder */}
          <div className="relative mb-12 rounded-2xl overflow-hidden">
            <div className="h-48 sm:h-64 bg-gray-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Carte des zones de livraison</p>
                <p className="text-xs text-gray-400 mt-1">Pointe-Noire et peripherie (rayon de 15 km)</p>
              </div>
            </div>
          </div>

          {/* Zone Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {deliveryZones.map((zone, i) => (
              <div
                key={zone.name}
                className={`relative group rounded-2xl border border-[#e5e5e5] bg-white p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 overflow-hidden shadow-sm`}
              >
                {zone.free && (
                  <div className="absolute top-0 right-0 bg-[#16a34a] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    <Zap className="w-3 h-3 inline mr-1" />
                    GRATUIT
                  </div>
                )}
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <MapPin className="w-5 h-5 text-[#1a1a1a]" />
                </div>
                <h3 className="font-bold text-[#1a1a1a] text-lg mb-1">{zone.name}</h3>
                <p className="text-[#555555] text-sm mb-4">{zone.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    {zone.free ? (
                      <span className="text-xl font-extrabold text-[#16a34a]">Livraison GRATUITE</span>
                    ) : (
                      <span className="text-xl font-bold text-[#1a1a1a]">{zone.price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#888888] text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{zone.delay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Livraison & Tarifs */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Livraison & Tarifs</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Livraison gratuite a partir de 25 000 FCFA</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Zone de livraison : Pointe-Noire et peripherie (rayon de 15 km)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Delai de livraison : 24-48h apres confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Frais de livraison : 1 500 FCFA (sous 25 000 FCFA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Commandes en gros : Contactez-nous pour des tarifs preferentiels</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Pourquoi CongoClean ? */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">Pourquoi CongoClean ?</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Fabrication 100% congolaise avec des matieres premieres locales</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Controle qualite rigoureux a chaque etape de production</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Prix competitifs adaptes au marche local</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Service client reactif et disponible 7j/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#1a1a1a] mt-0.5 shrink-0" />
                  <span className="text-[#555555]">Produits biodégradables et respectueux de l&rsquo;environnement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}
