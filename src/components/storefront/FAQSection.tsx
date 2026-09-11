'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FadeInSection } from './AnimatedComponents'

const faqs = [
  {
    question: 'Quelle est votre zone de livraison ?',
    answer: 'Nous livrons a Pointe-Noire et dans sa peripherie dans un rayon de 15 km. La livraison est gratuite pour les commandes de plus de 25 000 FCFA. Pour les zones eloignees, veuillez nous contacter pour verifier la disponibilite.'
  },
  {
    question: 'Quels sont les modes de paiement acceptes ?',
    answer: 'Nous acceptons le paiement a la livraison ( especes), les virements mobiles (M-Pesa, Orange Money), et les virements bancaires. Le paiement en ligne par carte sera bientot disponible.'
  },
  {
    question: 'Quel est le delai de livraison ?',
    answer: "Le delai de livraison standard est de 24 a 48 heures apres confirmation de votre commande. Pour les commandes en gros, le delai peut etre de 2 a 5 jours ouvrables selon la disponibilite des produits."
  },
  {
    question: 'Quelle est votre politique de retours et echanges ?',
    answer: "En cas de produit defectueux ou non conforme, vous disposez de 7 jours apres reception pour demander un echange ou un remboursement. Contactez-nous par email a contact@kalas.cg ou par telephone au +242 06 123 4567."
  },
  {
    question: 'Proposez-vous des commandes en gros ?',
    answer: "Oui, nous proposons des tarifs preferentiels pour les commandes en gros (hotels, restaurants, entreprises, etc.). Contactez-nous directement par telephone ou via le formulaire de contact pour obtenir un devis personnalise."
  },
  {
    question: 'Quelle est la qualite de vos produits ?',
    answer: "Nos produits sont fabriques selon des normes industrielles strictes avec des matieres premieres de qualite. Chaque lot est controle avant la mise sur le marche. Nos produits sont biodégradables et respectueux de l'environnement."
  },
]

export function FAQSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [faqSearch, setFaqSearch] = useState('')

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return faqs
    const q = faqSearch.toLowerCase()
    return faqs.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    )
  }, [faqSearch])

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gray-100 border border-[#e5e5e5] flex items-center justify-center">
                <HelpCircle className="w-9 h-9 text-[#888888]" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] mb-4">Foire Aux Questions</h2>
            <p className="text-[#555555] max-w-2xl mx-auto">
              Trouvez rapidement les reponses a vos questions les plus frequentes
            </p>
            <div className="w-16 h-1 bg-[#1a1a1a] rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          {/* Search / Filter */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
            <Input
              placeholder="Rechercher dans la FAQ..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10 bg-white border-[#e5e5e5] focus-visible:ring-[#1a1a1a]/10 focus-visible:border-[#1a1a1a] transition-all duration-300"
            />
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[#555555]">Aucune question ne correspond a votre recherche</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq, i) => {
                const originalIdx = faqs.indexOf(faq)
                const isExpanded = expandedFaq === originalIdx
                const stepNumber = String(originalIdx + 1).padStart(2, '0')

                return (
                  <Card
                    key={originalIdx}
                    className={`overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-[#1a1a1a] shadow-sm' : 'border-[#e5e5e5]'}`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : originalIdx)}
                      className={`w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                      aria-expanded={isExpanded}
                    >
                      <span className={`text-sm font-bold shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${isExpanded ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-[#888888]'}`}>
                        {stepNumber}
                      </span>
                      <span className={`font-medium pr-4 flex-1 transition-colors duration-300 ${isExpanded ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>
                        {faq.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-300 ${isExpanded ? 'rotate-180 text-[#1a1a1a]' : 'text-[#888888]'}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5 pl-15 sm:pl-16">
                            <p className="text-[#555555] text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                )
              })}
            </div>
          )}
        </FadeInSection>
      </div>
    </section>
  )
}