'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAffiliateAuthStore } from '@/stores/affiliate-auth-store'
import { Loader2, Handshake, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface AffiliateAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToDashboard?: () => void
}

export function AffiliateAuthDialog({ open, onOpenChange, onSwitchToDashboard }: AffiliateAuthDialogProps) {
  const { login, register, isLoading } = useAffiliateAuthStore()

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regBankInfo, setRegBankInfo] = useState('')

  const resetForms = () => {
    setLoginEmail('')
    setLoginPassword('')
    setRegName('')
    setRegEmail('')
    setRegPhone('')
    setRegPassword('')
    setRegCompany('')
    setRegBankInfo('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    const success = await login(loginEmail, loginPassword)
    if (success) {
      toast.success('Connexion réussie !')
      resetForms()
      onOpenChange(false)
      onSwitchToDashboard?.()
    } else {
      toast.error('Email ou mot de passe incorrect')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPhone || !regPassword) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    const success = await register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      company: regCompany || undefined,
      bankInfo: regBankInfo || undefined,
    })
    if (success) {
      toast.success('Inscription réussie ! Bienvenue partenaire KALA\u2019S')
      resetForms()
      onOpenChange(false)
      onSwitchToDashboard?.()
    } else {
      toast.error('Erreur lors de l\u2019inscription. Veuillez réessayer.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Handshake className="w-5 h-5 text-emerald-600" />
            Espace Partenaire
          </DialogTitle>
          <DialogDescription>
            Connectez-vous ou devenez partenaire KALA&apos;S
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1 gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                Connexion
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 gap-1.5">
                <Handshake className="w-3.5 h-3.5" />
                Devenir Partenaire
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Login Tab */}
          <TabsContent value="login" className="px-6 pb-6 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="affiliate-login-email">Email</Label>
                <Input
                  id="affiliate-login-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate-login-password">Mot de passe</Label>
                <Input
                  id="affiliate-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Pas encore partenaire ? Créez votre compte gratuitement.
              </p>
            </div>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="px-6 pb-6 pt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="affiliate-reg-name">Nom complet *</Label>
                <Input
                  id="affiliate-reg-name"
                  type="text"
                  placeholder="Mariam Diallo"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="affiliate-reg-email">Email *</Label>
                  <Input
                    id="affiliate-reg-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliate-reg-phone">Téléphone *</Label>
                  <Input
                    id="affiliate-reg-phone"
                    type="tel"
                    placeholder="+242 06 000 0000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate-reg-password">Mot de passe *</Label>
                <Input
                  id="affiliate-reg-password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="affiliate-reg-company" className="text-gray-500">
                  Entreprise <span className="text-xs font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="affiliate-reg-company"
                  type="text"
                  placeholder="Nom de votre entreprise"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                  disabled={isLoading}
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate-reg-bank" className="text-gray-500">
                  Informations bancaires ou Mobile Money{' '}
                  <span className="text-xs font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="affiliate-reg-bank"
                  type="text"
                  placeholder="Ex: MTN Mobile Money - +242 06 000 0000"
                  value={regBankInfo}
                  onChange={(e) => setRegBankInfo(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <Handshake className="w-4 h-4" />
                    Devenir partenaire
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                En vous inscrivant, vous acceptez les conditions du programme de partenariat KALA&apos;S.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
