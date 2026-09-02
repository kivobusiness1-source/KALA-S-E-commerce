'use client'

import { Users, Package, Award, MapPin, Shield, Leaf, Truck, Sparkles } from 'lucide-react'
import { FadeInSection, CountUp } from './AnimatedComponents'

const timelineItems = [
  { year: '2021', title: 'Creation', description: 'Fondation de CongoClean a Pointe-Noire avec une vision claire.' },
  { year: '2022', title: 'Premiers produits', description: "Lancement de notre gamme initiale de 5 produits d'hygiene." },
  { year: '2023', title: 'Expansion', description: "Elargissement de la gamme et croissance de l'equipe." },
  { year: '2024', title: '500+ clients', description: 'Depassement de la barre des 500 clients satisfaits.' },
  { year: '2025', title: 'Leader du marche', description: "Positionnement comme leader des produits d'entretien au Congo." },
]

const whyChooseItems = [
  { icon: Shield, title: 'Qualite garantie', description: 'Nos produits repondent aux normes internationales les plus strictes.' },
  { icon: Leaf, title: 'Eco-responsable', description: "Formulations concues pour minimiser l'impact environnemental." },
  { icon: Truck, title: 'Livraison rapide', description: 'Livraison en 24-48h a Pointe-Noire et dans tout le Congo.' },
  { icon: Sparkles, title: 'Innovation locale', description: 'Recherche et developpement au coeur du Congo-Brazzaville.' },
  { icon: Users, title: 'Service client', description: "Une equipe disponible et a l'ecoute de vos besoins." },
]

export function AboutSection() {
  const stats = [
    { icon: Users, value: 500, suffix: '+', label: 'Clients Satisfaits' },
    { icon: Package, value: 15, suffix: '+', label: 'Produits' },
    { icon: Award, value: 0, suffix: '', textValue: 'Qualite', label: 'Industrielle' },
    { icon: MapPin, value: 100, suffix: '%', label: 'Congolaise' },
  ]

  return (
    <section id="about" className="py-16 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <FadeInSection>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">
              A Propos de CongoClean
            </h2>
            <p className="text-[#555555] max-w-2xl mx-auto">
              Notre engagement pour la qualite et le developpement local
            </p>
            <div className="w-16 h-1 bg-[#1a1a1a] rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>

        <FadeInSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Visual area */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm relative bg-[#1a1a1a]">
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white/80 text-lg sm:text-xl font-bold tracking-wider">CongoClean</p>
                  <p className="text-white/50 text-[10px] sm:text-xs mt-0.5">Proprete & Qualite depuis 2021</p>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div>
              <p className="text-[#555555] mb-4 leading-relaxed">
                CongoClean est une entreprise de fabrication de produits d&rsquo;hygiene basee a Pointe-Noire, au coeur du Congo-Brazzaville. Depuis notre creation, nous nous engageons a fournir des produits de qualite industrielle pour les menages et les entreprises.
              </p>
              <p className="text-[#555555] mb-8 leading-relaxed">
                Notre gamme comprend du savon liquide, du detergent et de l&rsquo;eau de Javel, tous formules pour repondre aux normes les plus strictes. Nous sommes fiers de contribuer au developpement economique local en creant des emplois et en utilisant des ressources disponibles au Congo.
              </p>

              {/* Stats with CountUp */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 cursor-default"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5 text-[#1a1a1a]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#1a1a1a] text-sm">
                        {stat.value > 0 ? (
                          <CountUp
                            target={stat.value}
                            suffix={stat.suffix || ''}
                            duration={2000 + i * 300}
                          />
                        ) : (
                          <span className="text-[#1a1a1a]">{stat.textValue}</span>
                        )}
                      </p>
                      <p className="text-[#555555] text-xs">{stat.label}</p>
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
              <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mb-3">
                Pourquoi nous choisir ?
              </h3>
              <p className="text-[#555555] max-w-xl mx-auto text-sm">
                Des avantages concrets qui font la difference au quotidien
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {whyChooseItems.map((item, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-[#e5e5e5] shadow-sm hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                    <item.icon className="w-6 h-6 text-[#1a1a1a]" />
                  </div>
                  <h4 className="font-semibold text-[#1a1a1a] text-sm mb-1.5">{item.title}</h4>
                  <p className="text-[#555555] text-xs leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Timeline */}
        <FadeInSection>
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] mb-3">
                Notre Histoire
              </h3>
              <p className="text-[#555555] max-w-xl mx-auto text-sm">
                Une croissance constante depuis notre creation
              </p>
            </div>

            <div className="relative">
              {/* Horizontal line - desktop */}
              <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-[#e5e5e5]" />

              {/* Timeline items */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-2">
                {timelineItems.map((item, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center">
                    {/* Dot - desktop */}
                    <div className="hidden md:flex relative z-10 w-12 h-12 rounded-full bg-white border-2 border-[#1a1a1a] items-center justify-center mb-4">
                      <div className="w-3 h-3 rounded-full bg-[#1a1a1a]" />
                    </div>
                    {/* Dot - mobile */}
                    <div className="md:hidden flex items-start gap-4 w-full">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
                        </div>
                        {i < timelineItems.length - 1 && (
                          <div className="w-0.5 h-full bg-[#e5e5e5] mt-1" />
                        )}
                      </div>
                      <div className="pb-8">
                        <span className="text-[#1a1a1a] font-bold text-sm">{item.year}</span>
                        <h4 className="font-semibold text-[#1a1a1a] text-sm mt-1">{item.title}</h4>
                        <p className="text-[#555555] text-xs mt-1 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                    {/* Content - desktop */}
                    <div className="hidden md:block">
                      <span className="text-[#1a1a1a] font-bold text-sm">{item.year}</span>
                      <h4 className="font-semibold text-[#1a1a1a] text-sm mt-1">{item.title}</h4>
                      <p className="text-[#555555] text-xs mt-1 leading-relaxed max-w-[160px]">{item.description}</p>
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