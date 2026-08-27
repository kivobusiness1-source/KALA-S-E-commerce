'use client'

import { useState } from 'react'
import { Star, Quote, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FadeInSection } from './AnimatedComponents'
import { getInitials } from './helpers'

interface TestimonialsSectionProps {
  activeTestimonial: number
  setActiveTestimonial: (index: number) => void
  isMobile: boolean
}

const borderColors = ['border-l-emerald-400', 'border-l-teal-400', 'border-l-amber-400']
const dotColors = ['bg-emerald-400', 'bg-teal-400', 'bg-amber-400']
const ringColors = ['ring-emerald-200', 'ring-teal-200', 'ring-amber-200']

export function TestimonialsSection({ activeTestimonial, setActiveTestimonial, isMobile }: TestimonialsSectionProps) {
  const testimonials = [
    { name: 'Marie Nzaba', role: 'Ménagère, Pointe-Noire', text: 'Le CongoClean 5L est devenu indispensable chez nous. Parfait pour toute la famille, il nettoie bien et ne sèche pas les mains.', rating: 5 },
    { name: 'Jean-Pierre Massamba', role: 'Gérant Hôtel Le Phare', text: 'Nous utilisons les produits CongoClean depuis 2 ans. Qualité constante et prix compétitifs. Je recommande vivement.', rating: 5 },
    { name: 'Aline Mouanda', role: 'Propriétaire Restaurant', text: 'Le détergent ProWash est excellent pour la vaisselle de mon restaurant. Format 5L très économique. Livraison rapide.', rating: 4 },
  ]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              La satisfaction de nos clients est notre plus grande fierté
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeInSection key={i}>
              <Card className={`relative p-6 h-full flex flex-col hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border-l-4 ${borderColors[i]} ${isMobile && activeTestimonial !== i ? 'hidden' : ''} overflow-hidden`}
              >
                <CardContent className="p-0 flex flex-col flex-1 relative z-10">
                  {/* Large decorative quote icon - absolute top-right */}
                  <Quote className="w-16 h-16 absolute top-4 right-4 text-gray-100 opacity-50 select-none pointer-events-none z-0" />

                  {/* Large background number */}
                  <span className="absolute -bottom-2 -left-2 text-[100px] font-black text-gray-50/60 select-none leading-none pointer-events-none z-0">
                    0{i + 1}
                  </span>

                  <div className="mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} className={`w-4 h-4 ${si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600 border-amber-200 font-medium">
                        Étoiles
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed flex-1 mb-4 relative z-10">&ldquo;{t.text}&rdquo;</p>

                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-0" />

                  <div className="border-t border-gray-100 pt-4 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* Avatar with colored ring and online dot */}
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 ring-2 ${ringColors[i]}`}>
                          <span className="text-emerald-700 font-semibold text-sm">{getInitials(t.name)}</span>
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${dotColors[i]} rounded-full border-2 border-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                      </div>
                      {/* Verified purchase badge */}
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-emerald-600 border-emerald-200 bg-emerald-50/50 shrink-0">
                        <ShieldCheck className="w-3 h-3 mr-0.5" />
                        Achat vérifié
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
        {/* Navigation dots (mobile) with sliding indicator */}
        <div className="flex justify-center mt-8 md:hidden">
          <div className="relative flex items-center gap-2.5 bg-gray-100 rounded-full px-3 py-2">
            {/* Sliding indicator background */}
            <div
              className="absolute top-1 bottom-1 w-8 bg-emerald-600 rounded-full transition-all duration-300 ease-in-out"
              style={{ left: `${activeTestimonial * 36 + 4}px` }}
            />
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`relative z-10 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center ${activeTestimonial === i ? 'text-white' : 'text-gray-400 hover:text-gray-500'}`}
                aria-label={`Témoignage ${i + 1}`}
              >
                <span className="text-[10px] font-bold">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}