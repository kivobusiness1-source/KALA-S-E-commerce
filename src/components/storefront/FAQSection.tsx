'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FadeInSection } from './AnimatedComponents'

export function FAQSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [faqSearch, setFaqSearch] = useState('')

  const faqs = [
    {
      question: 'Quelle est votre zone de livraison ?',
      answer: 'Nous livrons à Pointe-Noire et dans sa périphérie dans un rayon de 15 km. La livraison est gratuite pour les commandes de plus de 25 000 FCFA. Pour les zones éloignées, veuillez nous contacter pour vérifier la disponibilité.'
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons le paiement à la livraison (espèces), les virements mobiles (M-Pesa, Orange Money), et les virements bancaires. Le paiement en ligne par carte sera bientôt disponible.'
    },
    {
      question: 'Quel est le délai de livraison ?',
      answer: 'Le délai de livraison standard est de 24 à 48 heures après confirmation de votre commande. Pour les commandes en gros, le délai peut être de 2 à 5 jours ouvrables selon la disponibilité des produits.'
    },
    {
      question: 'Quelle est votre politique de retours et échanges ?',
      answer: 'En cas de produit défectueux ou non conforme, vous disposez de 7 jours après réception pour demander un échange ou un remboursement. Contactez-nous par email à contact@congoclean.cg ou par téléphone au +242 06 123 4567.'
    },
    {
      question: 'Proposez-vous des commandes en gros ?',
      answer: 'Oui, nous proposons des tarifs préférentiels pour les commandes en gros (hôtels, restaurants, entreprises, etc.). Contactez-nous directement par téléphone ou via le formulaire de contact pour obtenir un devis personnalisé.'
    },
    {
      question: 'Quelle est la qualité de vos produits ?',
      answer: 'Nos produits sont fabriqués selon des normes industrielles strictes avec des matières premières de qualité. Chaque lot est contrôlé avant la mise sur le marché. Nos produits sont biodégradables et respectueux de l\'environnement.'
    },
  ]

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
            {/* Decorative question mark illustration */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-emerald-200 flex items-center justify-center">
                <HelpCircle className="w-9 h-9 text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                <span className="text-amber-600 text-[10px] font-bold">?</span>
              </div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-teal-100 border border-teal-200" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Foire Aux Questions</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Trouvez rapidement les réponses à vos questions les plus fréquentes
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          {/* Search / Filter */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans la FAQ..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-400 transition-all duration-300"
            />
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500">Aucune question ne correspond à votre recherche</p>
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
                    className={`overflow-hidden border transition-all duration-300 ${isExpanded ? 'border-emerald-300 shadow-md shadow-emerald-500/5' : 'border-gray-200'}`}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : originalIdx)}
                      className={`w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-colors ${isExpanded ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                      aria-expanded={isExpanded}
                    >
                      <span className={`text-sm font-bold shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${isExpanded ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {stepNumber}
                      </span>
                      <span className={`font-medium pr-4 flex-1 transition-colors duration-300 ${isExpanded ? 'text-emerald-800' : 'text-gray-900'}`}>
                        {faq.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-300 ${isExpanded ? 'rotate-180 text-emerald-600' : 'text-emerald-600'}`} />
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
                            <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
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