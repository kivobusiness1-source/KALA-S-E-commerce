'use client'

import { Truck, MapPin, Clock, Package, CheckCircle } from 'lucide-react'
import { FadeInSection } from './AnimatedComponents'

export function DeliveryPricingSection() {
  return (
    <FadeInSection>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Livraison & Tarifs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Livraison rapide et fiable à Pointe-Noire et environs
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Livraison & Tarifs */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Livraison & Tarifs</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Livraison gratuite à partir de 25 000 FCFA</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Zone de livraison : Pointe-Noire et périphérie (rayon de 15 km)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Délai de livraison : 24-48h après confirmation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Frais de livraison : 1 500 FCFA (sous 25 000 FCFA)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Commandes en gros : Contactez-nous pour des tarifs préférentiels</span>
                </li>
              </ul>
            </div>

            {/* Right Column - Pourquoi CongoClean ? */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pourquoi CongoClean ?</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Fabrication 100% congolaise avec des matières premières locales</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Contrôle qualité rigoureux à chaque étape de production</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Prix compétitifs adaptés au marché local</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Service client réactif et disponible 7j/7</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">Produits biodégradables et respectueux de l&rsquo;environnement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </FadeInSection>
  )
}