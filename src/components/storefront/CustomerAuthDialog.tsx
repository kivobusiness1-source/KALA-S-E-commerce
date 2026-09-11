'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { User, Mail, Lock, Phone, MapPin, Building2, Users, Loader2 } from 'lucide-react'
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
import { useCustomerAuthStore } from '@/stores/customer-auth-store'

interface CustomerAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'register'
  onSwitchToDashboard?: () => void
}

export function CustomerAuthDialog({ open, onOpenChange, defaultTab = 'login', onSwitchToDashboard }: CustomerAuthDialogProps) {
  const { login, register } = useCustomerAuthStore()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regAddress, setRegAddress] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regQuartier, setRegQuartier] = useState('')
  const [regReferralCode, setRegReferralCode] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const resetForms = () => {
    setLoginEmail('')
    setLoginPassword('')
    setRegName('')
    setRegEmail('')
    setRegPhone('')
    setRegPassword('')
    setRegAddress('')
    setRegCity('')
    setRegQuartier('')
    setRegReferralCode('')
    setActiveTab(defaultTab)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForms()
    }
    onOpenChange(isOpen)
  }

  // Login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setLoginLoading(true)
    try {
      const success = await login(loginEmail, loginPassword)
      if (success) {
        const customer = useCustomerAuthStore.getState().customer
        toast.success(`Bienvenue, ${customer?.name || 'client'} !`)
        handleClose(false)
        onSwitchToDashboard?.()
      } else {
        toast.error('Email ou mot de passe incorrect')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoginLoading(false)
    }
  }

  // Register submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPhone || !regPassword || !regAddress || !regCity || !regQuartier) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (regPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    setRegLoading(true)
    try {
      const success = await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        address: regAddress,
        city: regCity,
        quartier: regQuartier,
        referralCode: regReferralCode || undefined,
      })
      if (success) {
        const customer = useCustomerAuthStore.getState().customer
        toast.success(`Bienvenue, ${customer?.name || 'client'} !`)
        handleClose(false)
        onSwitchToDashboard?.()
      } else {
        toast.error('Erreur lors de l\'inscription. Cet email est peut-être déjà utilisé.')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[#1a1a1a] text-xl font-bold tracking-tight">
            Mon Compte KALA&apos;S
          </DialogTitle>
          <DialogDescription className="text-[#888888] text-sm">
            Connectez-vous ou créez votre compte client
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'login' | 'register')}
          className="w-full"
        >
          <div className="px-6 pt-2">
            <TabsList className="w-full h-10 bg-gray-100 rounded-lg p-1">
              <TabsTrigger
                value="login"
                className="flex-1 rounded-md data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-medium transition-all duration-200"
              >
                Connexion
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 rounded-md data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-medium transition-all duration-200"
              >
                Inscription
              </TabsTrigger>
            </TabsList>
          </div>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="mt-0 px-6 pb-6 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-[#1a1a1a] text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-[#1a1a1a] text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium rounded-lg transition-colors duration-200"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-[#888888]">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-[#1a1a1a] font-medium hover:underline underline-offset-2"
                >
                  Créez-en un
                </button>
              </p>
            </form>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="mt-0 px-6 pb-6 pt-4">
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-[#1a1a1a] text-sm font-medium">
                  Nom complet <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-[#1a1a1a] text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-phone" className="text-[#1a1a1a] text-sm font-medium">
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                    <Input
                      id="reg-phone"
                      type="tel"
                      placeholder="+242 06 XXX XXXX"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-[#1a1a1a] text-sm font-medium">
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Min. 6 caractères"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-address" className="text-[#1a1a1a] text-sm font-medium">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="reg-address"
                    type="text"
                    placeholder="123 Avenue de la Paix"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* City + Quartier row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-city" className="text-[#1a1a1a] text-sm font-medium">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                    <Input
                      id="reg-city"
                      type="text"
                      placeholder="Pointe-Noire"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-quartier" className="text-[#1a1a1a] text-sm font-medium">
                    Quartier <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reg-quartier"
                    type="text"
                    placeholder="Centre-ville"
                    value={regQuartier}
                    onChange={(e) => setRegQuartier(e.target.value)}
                    className="h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Referral code (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-referral" className="text-[#1a1a1a] text-sm font-medium">
                  Code de parrainage <span className="text-[#888888] font-normal">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="reg-referral"
                    type="text"
                    placeholder="KALA-XXXXXX"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value)}
                    className="pl-10 h-10 border-gray-200 focus:border-[#1a1a1a] focus:ring-[#1a1a1a]/20 rounded-lg text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={regLoading}
                className="w-full h-11 bg-[#1a1a1a] hover:bg-[#333] text-white font-medium rounded-lg transition-colors duration-200"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inscription en cours...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Créer mon compte
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-[#888888]">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-[#1a1a1a] font-medium hover:underline underline-offset-2"
                >
                  Connectez-vous
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
