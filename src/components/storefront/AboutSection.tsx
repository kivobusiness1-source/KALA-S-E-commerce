'use client'

import { Users, Package, Award, MapPin } from 'lucide-react'
import { FadeInSection, AnimatedCounter } from './AnimatedComponents'

export function AboutSection() {
  const stats = [
    { icon: Users, value: 500, suffix: '+', label: 'Clients Satisfaits' },
    { icon: Package, value: 3, suffix: '+', label: 'Catégories' },
    { icon: Award, value: 0, suffix: '', textValue: 'Qualité', label: 'Industrielle' },
    { icon: MapPin, value: 100, suffix: '%', label: 'Congolaise' },
  ]

  return (
    <section id="about" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              À Propos de <span className="text-emerald-600">CongoClean</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Notre engagement pour la qualité et le développement local
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                <img src="/about-factory.png" alt="Usine CongoClean à Pointe-Noire" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400 rounded-2xl -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200 rounded-2xl -z-10" />
            </div>

            {/* Text side */}
            <div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                CongoClean est une entreprise de fabrication de produits d&rsquo;hygiène basée à Pointe-Noire, au cœur du Congo-Brazzaville. Depuis notre création, nous nous engageons à fournir des produits de qualité industrielle pour les ménages et les entreprises.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Notre gamme comprend du savon liquide, du détergent et de l&rsquo;eau de Javel, tous formulés pour répondre aux normes les plus strictes. Nous sommes fiers de contribuer au développement économique local en créant des emplois et en utilisant des ressources disponibles au Congo.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {stat.value > 0 ? <AnimatedCounter target={stat.value} suffix={stat.suffix || ''} /> : stat.textValue}
                      </p>
                      <p className="text-gray-500 text-xs">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}