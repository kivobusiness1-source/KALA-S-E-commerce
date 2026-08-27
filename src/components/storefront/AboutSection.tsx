'use client'

import { Users, Package, Award, MapPin, Shield, Leaf, Truck, Sparkles } from 'lucide-react'
import { FadeInSection, CountUp, PulseDot } from './AnimatedComponents'

const timelineItems = [
  { year: '2021', title: 'Création', description: 'Fondation de CongoClean à Pointe-Noire avec une vision claire.' },
  { year: '2022', title: 'Premiers produits', description: 'Lancement de notre gamme initiale de 5 produits d\'hygiène.' },
  { year: '2023', title: 'Expansion', description: 'Élargissement de la gamme et croissance de l\'équipe.' },
  { year: '2024', title: '500+ clients', description: 'Dépassement de la barre des 500 clients satisfaits.' },
  { year: '2025', title: 'Leader du marché', description: 'Positionnement comme leader des produits d\'entretien au Congo.' },
]

const whyChooseItems = [
  { icon: Shield, title: 'Qualité garantie', description: 'Nos produits répondent aux normes internationales les plus strictes.' },
  { icon: Leaf, title: 'Éco-responsable', description: 'Formulations conçues pour minimiser l\'impact environnemental.' },
  { icon: Truck, title: 'Livraison rapide', description: 'Livraison en 24-48h à Pointe-Noire et dans tout le Congo.' },
  { icon: Sparkles, title: 'Innovation locale', description: 'Recherche et développement au cœur du Congo-Brazzaville.' },
  { icon: Users, title: 'Service client', description: 'Une équipe disponible et à l\'écoute de vos besoins.' },
]

export function AboutSection() {
  const stats = [
    { icon: Users, value: 500, suffix: '+', label: 'Clients Satisfaits' },
    { icon: Package, value: 15, suffix: '+', label: 'Produits' },
    { icon: Award, value: 0, suffix: '', textValue: 'Qualité', label: 'Industrielle' },
    { icon: MapPin, value: 100, suffix: '%', label: 'Congolaise' },
  ]

  return (
    <section id="about" className="py-16 sm:py-20 bg-white relative overflow-hidden">
      {/* Decorative dot pattern background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
            {/* Decorative visual area */}
            <div className="relative">
              {/* Main visual with gradient and floating bottles */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600">
                {/* Floating product bottle illustrations using CSS */}
                {/* Bottle 1 */}
                <div className="absolute top-[15%] left-[20%] w-16 h-28 sm:w-20 sm:h-36 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg animate-[breathing_4s_ease-in-out_infinite]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-4 sm:h-5 bg-white/30 rounded-b-lg" />
                  <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/40 rounded-full" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-[8px] sm:text-[10px] font-bold tracking-wide">CLEAN</div>
                </div>
                {/* Bottle 2 */}
                <div className="absolute top-[25%] right-[15%] w-14 h-24 sm:w-18 sm:h-32 bg-amber-400/30 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg animate-[breathing_5s_ease-in-out_infinite_0.5s]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 sm:w-9 h-3 sm:h-4 bg-amber-300/40 rounded-b-lg" />
                  <div className="absolute top-5 sm:top-7 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/30 rounded-full" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-[7px] sm:text-[9px] font-bold tracking-wide">WASH</div>
                </div>
                {/* Bottle 3 - small */}
                <div className="absolute bottom-[15%] left-[35%] w-12 h-20 sm:w-14 sm:h-24 bg-cyan-400/30 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg animate-[breathing_3.5s_ease-in-out_infinite_1s]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-7 h-3 sm:h-3.5 bg-cyan-300/40 rounded-b-lg" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-[6px] sm:text-[8px] font-bold">JAVEL</div>
                </div>
                {/* Decorative circles */}
                <div className="absolute bottom-[10%] right-[20%] w-20 h-20 bg-white/5 rounded-full" />
                <div className="absolute top-[10%] left-[55%] w-12 h-12 bg-white/5 rounded-full" />
                {/* Sparkles */}
                <div className="absolute top-[8%] left-[12%]">
                  <Sparkles className="w-6 h-6 text-white/30" />
                </div>
                <div className="absolute bottom-[20%] right-[10%]">
                  <Sparkles className="w-5 h-5 text-white/20" />
                </div>
                {/* Logo text */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white/80 text-lg sm:text-xl font-bold tracking-wider">CongoClean</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-0.5">Propreté & Qualité depuis 2021</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-400 rounded-2xl -z-10 opacity-60" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-200 rounded-2xl -z-10 opacity-60" />
            </div>

            {/* Text side */}
            <div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                CongoClean est une entreprise de fabrication de produits d&rsquo;hygiène basée à Pointe-Noire, au cœur du Congo-Brazzaville. Depuis notre création, nous nous engageons à fournir des produits de qualité industrielle pour les ménages et les entreprises.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Notre gamme comprend du savon liquide, du détergent et de l&rsquo;eau de Javel, tous formulés pour répondre aux normes les plus strictes. Nous sommes fiers de contribuer au développement économique local en créant des emplois et en utilisant des ressources disponibles au Congo.
              </p>

              {/* Stats with CountUp */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-100/50 transition-all duration-300 cursor-default"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center shrink-0 transition-colors">
                      <stat.icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {stat.value > 0 ? (
                          <CountUp
                            target={stat.value}
                            suffix={stat.suffix || ''}
                            duration={2000 + i * 300}
                          />
                        ) : (
                          <span className="text-emerald-600">{stat.textValue}</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* Pourquoi nous choisir ? */}
        <FadeInSection>
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Pourquoi nous choisir ?
              </h3>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">
                Des avantages concrets qui font la différence au quotidien
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {whyChooseItems.map((item, i) => (
                <div
                  key={i}
                  className="group relative p-5 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-3 transition-colors">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1.5">{item.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Timeline */}
        <FadeInSection>
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Notre Histoire
              </h3>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">
                Une croissance constante depuis notre création
              </p>
            </div>

            <div className="relative">
              {/* Horizontal line - desktop */}
              <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200" />

              {/* Timeline items */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                {timelineItems.map((item, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center">
                    {/* Dot - desktop */}
                    <div className="hidden md:flex relative z-10 w-12 h-12 rounded-full bg-white border-2 border-emerald-400 items-center justify-center mb-4 group-hover:border-emerald-600 transition-colors">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    {/* Dot - mobile */}
                    <div className="md:hidden flex items-start gap-4 w-full">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        {i < timelineItems.length - 1 && (
                          <div className="w-0.5 h-full bg-emerald-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-8">
                        <span className="text-emerald-600 font-bold text-sm">{item.year}</span>
                        <h4 className="font-semibold text-gray-900 text-sm mt-1">{item.title}</h4>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    {/* Content - desktop */}
                    <div className="hidden md:block">
                      <span className="text-emerald-600 font-bold text-sm">{item.year}</span>
                      <h4 className="font-semibold text-gray-900 text-sm mt-1">{item.title}</h4>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed max-w-[160px]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Keyframe for floating bottles */}
      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-4px); }
        }
      `}</style>
    </section>
  )
}
