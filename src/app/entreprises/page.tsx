'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Home,
  Building2,
  Shield,
  Truck,
  Users,
  TrendingDown,
  Clock,
  FileText,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  Package,
  Award,
  HeadphonesIcon,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import StorefrontLayout from '@/components/storefront/StorefrontLayout'
import { FadeInSection } from '@/components/storefront/AnimatedComponents'

import WholesaleSection from '@/components/storefront/WholesaleSection'

const benefits = [
  {
    icon: Shield,
    title: 'Approvisionnement fiable',
    description: 'Stock garanti et livraisons régulières pour ne jamais être en rupture de stock.',
  },
  {
    icon: TrendingDown,
    title: 'Prix compétitifs',
    description: 'Tarifs dégressifs adaptés à vos volumes. Plus vous commandez, plus vous économisez.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Gestionnaire dédié',
    description: 'Un interlocuteur unique qui connaît votre entreprise et vos besoins spécifiques.',
  },
  {
    icon: FileText,
    title: 'Contrats flexibles',
    description: 'Mensuels, trimestriels ou annuels. Adaptez votre contrat à votre activité.',
  },
  {
    icon: Truck,
    title: 'Livraison prioritaire',
    description: 'Vos commandes sont traitées en priorité avec des créneaux de livraison définis.',
  },
  {
    icon: RefreshCw,
    title: 'Commandes récurrentes',
    description: 'Automatisez vos commandes et ne pensez plus à réapprovisionner.',
  },
]

const contractTypes = [
  {
    name: 'Mensuel',
    duration: '1 mois',
    minOrder: '10 lots',
    discount: '5%',
    features: ['Prix fixe garanti', 'Livraison prioritaire', 'Gestionnaire dédié', 'Facturation en fin de mois'],
    popular: false,
  },
  {
    name: 'Trimestriel',
    duration: '3 mois',
    minOrder: '25 lots',
    discount: '10%',
    features: ['Tout du mensuel', 'Tarifs dégressifs', 'Commandes récurrentes', 'Stock réservé', 'Pauses possibles'],
    popular: true,
  },
  {
    name: 'Annuel',
    duration: '12 mois',
    minOrder: '50 lots',
    discount: '15%',
    features: ['Tout du trimestriel', 'Prix verrouillé 12 mois', 'Livraison gratuite', 'Formation produits', 'Support 7j/7'],
    popular: false,
  },
]

const businessTestimonials = [
  {
    name: 'Jean-Pierre Massamba',
    role: 'Gérant, Hôtel Le Phare',
    text: 'Nous utilisons les produits KALA\'S depuis 2 ans pour tout l\'entretien de l\'hôtel. Qualité constante, prix compétitifs et livraison toujours à l\'heure. Un partenaire de confiance.',
    rating: 5,
  },
  {
    name: 'Aline Mouanda',
    role: 'Propriétaire, Restaurant Le Cabanon',
    text: 'Le contrat trimestriel nous permet de budgétiser nos dépenses d\'hygiène. Le format 5L est parfait pour la restauration. Je recommande vivement KALA\'S aux professionnels.',
    rating: 5,
  },
  {
    name: 'Patrick Bokamba',
    role: 'Directeur, Clinique Ngokedi',
    text: 'L\'hygiène est critique dans notre établissement. KALA\'S nous garantit un approvisionnement régulier avec des produits certifiés. Leur gestionnaire dédié est très réactif.',
    rating: 5,
  },
]

export default function EntreprisesPage() {
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    sector: '',
    volume: '',
    message: '',
  })
  const [quoteLoading, setQuoteLoading] = useState(false)

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quoteForm.companyName || !quoteForm.contactName || !quoteForm.email || !quoteForm.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setQuoteLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteForm.contactName,
          email: quoteForm.email,
          phone: quoteForm.phone,
          subject: `Demande de devis entreprise - ${quoteForm.companyName}`,
          message: `Entreprise: ${quoteForm.companyName}\nSecteur: ${quoteForm.sector}\nVolume estimé: ${quoteForm.volume}\n\n${quoteForm.message}`,
        }),
      })
      if (res.ok) {
        toast.success('Demande de devis envoyée ! Nous vous contacterons sous 24h.')
        setQuoteForm({ companyName: '', contactName: '', email: '', phone: '', sector: '', volume: '', message: '' })
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setQuoteLoading(false)
    }
  }

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">Entreprises</span>
          </nav>
        </div>
      </div>

      {/* Hero Section for B2B */}
      <section className="relative py-16 sm:py-24 bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-emerald-900/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-teal-900/15 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-900/50 text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-6 border border-emerald-700/30">
              <Building2 className="h-3.5 w-3.5" />
              Solutions B2B
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Solutions pour
              <br />
              <span className="text-emerald-400">Entreprises</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Hôtels, restaurants, cliniques, écoles... KALA&apos;S accompagne les professionnels de Pointe-Noire avec des solutions d&apos;hygiène sur mesure et des contrats flexibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base px-8"
                onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Demander un devis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 bg-transparent text-white hover:bg-gray-800 font-semibold text-base px-8"
                onClick={() => document.getElementById('wholesale-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Commander en gros
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-800">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">50+</p>
                <p className="text-sm text-gray-400 mt-1">Clients entreprises</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">98%</p>
                <p className="text-sm text-gray-400 mt-1">Taux de satisfaction</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">24h</p>
                <p className="text-sm text-gray-400 mt-1">Délai de livraison</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Pourquoi choisir KALA&apos;S ?</h2>
              <p className="text-[#555555] mt-3 max-w-2xl mx-auto">
                Un partenaire fiable pour l&apos;approvisionnement en produits d&apos;hygiène de votre entreprise
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <FadeInSection key={index}>
                  <Card className="border border-[#e5e5e5] hover:shadow-md transition-shadow duration-200 h-full">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{benefit.title}</h3>
                      <p className="text-sm text-[#555555] leading-relaxed">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </FadeInSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contract Types Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Nos Contrats</h2>
              <p className="text-[#555555] mt-3 max-w-2xl mx-auto">
                Choisissez la formule qui correspond à vos besoins et bénéficiez de tarifs préférentiels
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {contractTypes.map((contract, index) => (
              <FadeInSection key={index}>
                <Card className={`relative border h-full flex flex-col ${contract.popular ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-[#e5e5e5]'}`}>
                  {contract.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white px-3">Populaire</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[#1a1a1a]">{contract.name}</h3>
                      <p className="text-sm text-[#888888] mt-1">Engagement {contract.duration}</p>
                      <p className="text-sm text-[#888888] mt-1">Minimum {contract.minOrder}/mois</p>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-emerald-600">-{contract.discount}</span>
                        <span className="text-sm text-[#888888] ml-1">sur les tarifs publics</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {contract.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-sm text-[#555555]">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className={`w-full font-medium ${
                        contract.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#1a1a1a] hover:bg-[#333] text-white'
                      }`}
                      onClick={() => document.getElementById('quote-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Demander un devis
                    </Button>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale Section */}
      <div id="wholesale-section">
        <WholesaleSection />
      </div>

      {/* Business Testimonials */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a1a1a]">Ils nous font confiance</h2>
              <p className="text-[#555555] mt-3 max-w-2xl mx-auto">
                Découvrez pourquoi les professionnels de Pointe-Noire choisissent KALA&apos;S
              </p>
            </div>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businessTestimonials.map((testimonial, index) => (
              <FadeInSection key={index}>
                <Card className="border border-[#e5e5e5] h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Award key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-[#555555] leading-relaxed mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                        {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1a1a]">{testimonial.name}</p>
                        <p className="text-xs text-[#888888]">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Request Form */}
      <section id="quote-form" className="py-16 sm:py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left info */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Demande de devis</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Remplissez le formulaire ci-contre et notre équipe commerciale vous contactera sous 24 heures avec une proposition personnalisée.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Téléphone</p>
                    <p className="text-gray-400 text-sm">+242 06 123 4567</p>
                    <p className="text-gray-500 text-xs mt-1">Lun-Ven 8h-18h, Sam 9h-13h</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-gray-400 text-sm">contact@kalas.cg</p>
                    <p className="text-gray-500 text-xs mt-1">Réponse sous 24h garantie</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Délai de traitement</p>
                    <p className="text-gray-400 text-sm">Devis personnalisé sous 24h</p>
                    <p className="text-gray-500 text-xs mt-1">Première livraison sous 48h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleQuoteSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Nom de l&apos;entreprise *</Label>
                      <Input
                        value={quoteForm.companyName}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, companyName: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="Hôtel Le Phare"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Contact *</Label>
                      <Input
                        value={quoteForm.contactName}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, contactName: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="Jean-Pierre Massamba"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Email *</Label>
                      <Input
                        type="email"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="jp@hotelphare.cg"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Téléphone *</Label>
                      <Input
                        type="tel"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="+242 06 XXX XXXX"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300 text-sm">Secteur d&apos;activité</Label>
                      <Input
                        value={quoteForm.sector}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, sector: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="Hôtellerie, Restauration..."
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300 text-sm">Volume estim+é</Label>
                      <Input
                        value={quoteForm.volume}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, volume: e.target.value }))}
                        className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                        placeholder="20 lots/mois"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm">Message</Label>
                    <Textarea
                      value={quoteForm.message}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                      className="mt-1.5 bg-gray-700 border-gray-600 text-white placeholder-gray-500 min-h-[100px]"
                      placeholder="Décrivez vos besoins en produits d'hygiène..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={quoteLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
                  >
                    {quoteLoading ? 'Envoi en cours...' : 'Envoyer la demande de devis'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  )
}
