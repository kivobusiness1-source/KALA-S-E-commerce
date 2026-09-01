'use client'

import { Mail, Send, Check, Copy, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface NewsletterSectionProps {
  newsletterEmail: string
  setNewsletterEmail: (val: string) => void
  newsletterLoading: boolean
  newsletterSuccess: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function NewsletterSection({
  newsletterEmail,
  setNewsletterEmail,
  newsletterLoading,
  newsletterSuccess,
  onSubmit,
}: NewsletterSectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText('CONGOCLEAN10')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (newsletterSuccess) {
    return (
      <section className="py-14 bg-white border-y border-[#e2e8f0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-14 h-14 rounded-full bg-[#fafafa] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-[#16a34a]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Merci pour votre inscription !</h2>
            <p className="text-[#64748b] text-sm mb-6">Utilisez le code pour 10% de reduction sur votre premiere commande.</p>
            <div className="inline-flex items-center gap-2 bg-[#fafafa] border border-[#e2e8f0] rounded-lg px-4 py-3">
              <Gift className="w-4 h-4 text-[#c8a951]" />
              <code className="text-sm font-mono font-bold text-[#1a1a2e] tracking-wider">CONGOCLEAN10</code>
              <button
                onClick={handleCopyCode}
                className="w-8 h-8 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
                aria-label="Copier le code"
              >
                {copied ? <Check className="w-4 h-4 text-[#16a34a]" /> : <Copy className="w-4 h-4 text-[#64748b]" />}
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-14 bg-white border-y border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-[#fafafa] border border-[#e2e8f0] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-5 h-5 text-[#64748b]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Restez Informe</h2>
          <p className="text-[#64748b] text-sm mb-6">
            Inscrivez-vous pour recevoir nos offres speciales et nouveautes
          </p>
          <form
            onSubmit={onSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b] pointer-events-none" />
              <Input
                type="email"
                placeholder="Votre adresse email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="pl-10 bg-white border-[#e2e8f0] focus-visible:ring-[#1a1a2e]/10 focus-visible:border-[#1a1a2e]/30"
              />
            </div>
            <Button
              type="submit"
              disabled={newsletterLoading}
              className="bg-[#c8a951] hover:bg-[#c8a951]/90 text-[#1a1a2e] font-semibold px-8"
            >
              {newsletterLoading ? '...' : "S'abonner"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}