'use client'

import { motion } from 'framer-motion'
import { Truck, MapPin, Clock, Package, CheckCircle, Zap, CircleDot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FadeInSection } from './AnimatedComponents'

const deliveryZones = [
  {
    name: 'Centre-Ville',
    price: 'GRATUIT',
    priceRaw: 0,
    delay: '24h',
    description: 'Zone industrielle, centre-ville, Avenue Amilcar Cabral',
    free: true,
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    name: 'Périphérie Proche',
    price: '1 000 FCFA',
    priceRaw: 1000,
    delay: '24-48h',
    description: 'Mboukou, Tchimbamba, Loandjili',
    free: false,
    color: 'from-teal-500 to-cyan-500',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
  {
    name: 'Périphérie Éloignée',
    price: '1 500 FCFA',
    priceRaw: 1500,
    delay: '48h',
    description: 'Hinda, Sibiti, Dolisie (sur demande)',
    free: false,
    color: 'from-amber-500 to-orange-400',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
]

export function DeliveryPricingSection() {
  return (
    <FadeInSection>
      <section className="py-16 sm:py-20 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Livraison & Tarifs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Livraison rapide et fiable à Pointe-Noire et environs
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>

          {/* Map-like decorative visual with pin icons */}
          <div className="relative mb-12 rounded-2xl overflow-hidden">
            <div
              className="h-48 sm:h-64 relative"
              style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 25%, #ccfbf1 50%, #f0fdfa 75%, #f5f5f4 100%)',
              }}
            >
              {/* Grid lines like a map */}
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              {/* Dashed delivery radius circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-56 sm:h-56 rounded-full border-2 border-dashed border-emerald-300/40">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-36 sm:h-36 rounded-full border-2 border-dashed border-emerald-400/30" />
              </div>

              {/* Pin markers for zones */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">CongoClean</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="absolute top-[25%] left-[30%]"
              >
                <CircleDot className="w-5 h-5 text-emerald-500" />
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="absolute top-[60%] left-[65%]"
              >
                <CircleDot className="w-5 h-5 text-teal-500" />
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="absolute top-[35%] left-[75%]"
              >
                <CircleDot className="w-4 h-4 text-amber-500" />
              </motion.div>

              {/* Animated truck */}
              <motion.div
                className="absolute bottom-6"
                animate={{ x: ['5%', '90%', '5%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-emerald-900/10">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-700">En livraison</span>
                </div>
              </motion.div>

              {/* Zone labels */}
              <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-medium text-gray-500 border border-gray-200">
                Carte des zones de livraison
              </div>
            </div>
          </div>

          {/* Zone Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {deliveryZones.map((zone, i) => (
              <motion.div
                key={zone.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className={`relative group rounded-2xl border-2 ${zone.borderColor} ${zone.bgLight} p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden`}
              >
                {zone.free && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    <Zap className="w-3 h-3 inline mr-1" />
                    GRATUIT
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${zone.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{zone.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{zone.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    {zone.free ? (
                      <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Livraison GRATUITE</span>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">{zone.price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{zone.delay}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Livraison & Tarifs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
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