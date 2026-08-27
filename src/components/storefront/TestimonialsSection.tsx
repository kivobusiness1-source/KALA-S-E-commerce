'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FadeInSection } from './AnimatedComponents'
import { getInitials } from './helpers'

interface TestimonialsSectionProps {
  activeTestimonial: number
  setActiveTestimonial: (index: number) => void
  isMobile: boolean
}

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
              <Card className={`p-6 h-full flex flex-col hover:shadow-lg transition-shadow duration-300 border-l-4 border-emerald-400 ${isMobile && activeTestimonial !== i ? 'hidden' : ''}`}>
                <CardContent className="p-0 flex flex-col flex-1">
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-emerald-200" />
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className={`w-4 h-4 ${si < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-1 mb-4">{t.text}</p>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-semibold text-sm">{getInitials(t.name)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
        {/* Navigation dots (mobile) */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTestimonial(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'bg-emerald-600 w-6' : 'bg-gray-300'}`}
              aria-label={`Témoignage ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}