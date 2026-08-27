'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeInSection } from './AnimatedComponents'

export function FAQSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

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

  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Foire Aux Questions</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Trouvez rapidement les réponses à vos questions les plus fréquentes
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-4" />
          </div>
        </FadeInSection>
        <FadeInSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden border border-gray-200">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={expandedFaq === i}
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-600 shrink-0 transition-transform duration-200 ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  )
}