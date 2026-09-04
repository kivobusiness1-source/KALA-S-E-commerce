'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, ShieldCheck, Megaphone, Truck, Plus, RefreshCw, Users, MapPin, Image, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAdminStore } from '@/stores/admin-store'
import { formatDate } from './helpers'
import type { AdminUser } from './types'

export default function SettingsSection() {
  const queryClient = useQueryClient()
  const { admin: currentAdmin } = useAdminStore()
  const isSuperAdmin = currentAdmin?.role === 'super_admin'

  // Site settings state
  const [form, setForm] = useState<Record<string, string>>({
    site_name: '', site_tagline: '', site_description: '',
    contact_phone: '', contact_email: '', contact_address: '',
    whatsapp_number: '', currency: '', free_shipping_threshold: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Admin users state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPw, setChangingPw] = useState(false)

  // Promo banner state
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [promoText, setPromoText] = useState('Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567')
  const [promoSaving, setPromoSaving] = useState(false)

  // Delivery zones state
  const [deliveryZones, setDeliveryZones] = useState('Centre-ville, Pointe-Noire\nMboukou\nLoango\nTchinouka')
  const [deliveryZonesSaving, setDeliveryZonesSaving] = useState(false)

  // Hero image state
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroSaving, setHeroSaving] = useState(false)

  const saveDeliveryZones = async () => {
    setDeliveryZonesSaving(true)
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'delivery_zones', value: deliveryZones },
          ],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Zones de livraison sauvegardées')
        queryClient.invalidateQueries({ queryKey: ['site-settings'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeliveryZonesSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setChangingPw(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Mot de passe modifié avec succès')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setChangingPw(false)
    }
  }

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => fetch('/api/site-settings').then(r => r.json()).then(d => d.data as Record<string, string>),
  })

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()).then(d => d.data as AdminUser[]),
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    if (settings) {
      setForm(prev => ({
        ...prev,
        site_name: settings.site_name || '',
        site_tagline: settings.site_tagline || '',
        site_description: settings.site_description || '',
        contact_phone: settings.contact_phone || '',
        contact_email: settings.contact_email || '',
        contact_address: settings.contact_address || '',
        whatsapp_number: settings.whatsapp_number || '',
        currency: settings.currency || 'FCFA',
        free_shipping_threshold: settings.free_shipping_threshold || '',
      }))
      setPromoEnabled(settings.promo_banner_enabled === 'true')
      setPromoText(settings.promo_banner_text || 'Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567')
      if (settings.delivery_zones) setDeliveryZones(settings.delivery_zones)
      setHeroImageUrl(settings.hero_image_url || '')
      setLoading(false)
    }
  }, [settings])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsArray = Object.entries(form).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Paramètres sauvegardés')
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (newAdmin.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setCreatingAdmin(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdmin.email, name: newAdmin.name, password: newAdmin.password }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Administrateur créé')
        setAdminDialogOpen(false)
        setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' })
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setCreatingAdmin(false)
    }
  }

  const savePromoBanner = async () => {
    setPromoSaving(true)
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'promo_banner_enabled', value: promoEnabled ? 'true' : 'false' },
            { key: 'promo_banner_text', value: promoText },
          ],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bannière promotionnelle sauvegardée')
        queryClient.invalidateQueries({ queryKey: ['site-settings'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setPromoSaving(false)
    }
  }

  const fields = [
    { key: 'site_name', label: 'Nom du site', placeholder: 'CongoClean' },
    { key: 'site_tagline', label: 'Slogan', placeholder: 'Produits d\'hygiène de qualité' },
    { key: 'site_description', label: 'Description', placeholder: 'Description du site', multiline: true },
    { key: 'contact_phone', label: 'Téléphone', placeholder: '+242 06 123 4567' },
    { key: 'contact_email', label: 'Email', placeholder: 'contact@congosoap.cg' },
    { key: 'contact_address', label: 'Adresse', placeholder: 'Pointe-Noire, Congo-Brazzaville' },
    { key: 'whatsapp_number', label: 'WhatsApp', placeholder: '+242 06 123 4567' },
    { key: 'currency', label: 'Devise', placeholder: 'FCFA' },
    { key: 'free_shipping_threshold', label: 'Seuil livraison gratuite', placeholder: '50000', type: 'number' },
  ]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="relative">
          <TabsTrigger value="general" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Settings className="h-3.5 w-3.5" />Général</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><ShieldCheck className="h-3.5 w-3.5" />Sécurité</TabsTrigger>
          <TabsTrigger value="banner" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Megaphone className="h-3.5 w-3.5" />Bannière</TabsTrigger>
          <TabsTrigger value="delivery" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Truck className="h-3.5 w-3.5" />Livraison</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Image className="h-3.5 w-3.5" />Apparence</TabsTrigger>
        </TabsList>

        {/* Général Tab */}
        <TabsContent value="general">
          <div className="max-w-2xl">
            <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
              <CardHeader>
                <CardTitle>Paramètres du Site</CardTitle>
                <CardDescription>Configurez les informations générales de votre site.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {fields.map(f => (
                      <div key={f.key} className="space-y-2">
                        <Label>{f.label}</Label>
                        {f.multiline ? (
                          <Textarea
                            value={form[f.key]}
                            onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            rows={3}
                          />
                        ) : (
                          <Input
                            type={f.type || 'text'}
                            value={form[f.key]}
                            onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                            placeholder={f.placeholder}
                            className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                          />
                        )}
                      </div>
                    ))}
                    <div className="pt-4">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveSettings} disabled={saving}>
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sécurité Tab */}
        <TabsContent value="security">
          <div className="max-w-lg">
            <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>Modifiez votre mot de passe de connexion.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mot de passe actuel</Label>
                    <Input
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nouveau mot de passe (min. 8 caractères)</Label>
                    <Input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Minimum 8 caractères"
                      className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmer le nouveau mot de passe</Label>
                    <Input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Retapez le nouveau mot de passe"
                      className="focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                    />
                  </div>
                  <div className="pt-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleChangePassword} disabled={changingPw}>
                      {changingPw ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Changer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bannière Tab */}
        <TabsContent value="banner">
          <div className="max-w-2xl">
            <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
              <CardHeader>
                <CardTitle>Bannière Promotionnelle</CardTitle>
                <CardDescription>Gérez la bannière promotionnelle affichée sur le site.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Activer la bannière</Label>
                    <Switch checked={promoEnabled} onCheckedChange={setPromoEnabled} />
                  </div>
                  <div className="space-y-2">
                    <Label>Message promotionnel</Label>
                    <Textarea
                      value={promoText}
                      onChange={e => setPromoText(e.target.value)}
                      placeholder="Message de la bannière promotionnelle"
                      rows={3}
                    />
                  </div>
                  <div className="pt-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePromoBanner} disabled={promoSaving}>
                      {promoSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Apparence Tab */}
        <TabsContent value="appearance">
          <div className="max-w-2xl">
            <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
              <CardHeader>
                <CardTitle>Image Hero (Page d&apos;accueil)</CardTitle>
                <CardDescription>Image affichée à droite dans la section hero de la page principale.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {heroImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                      <img src={heroImageUrl} alt="Hero image" className="w-full h-48 object-cover" />
                      <button
                        onClick={() => setHeroImageUrl('')}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-48 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                      <div className="text-center">
                        <Image className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Aucune image hero configurée</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm font-medium text-gray-600 hover:text-emerald-700">
                        {heroUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {heroUploading ? 'Upload en cours...' : 'Uploader une image'}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setHeroUploading(true)
                          try {
                            const formData = new FormData()
                            formData.append('image', file)
                            const res = await fetch('/api/upload', { method: 'POST', body: formData })
                            const data = await res.json()
                            if (data.data?.url) {
                              setHeroImageUrl(data.data.url)
                              toast.success('Image uploadée')
                            } else {
                              toast.error(data.error || 'Erreur upload')
                            }
                          } catch {
                            toast.error('Erreur de connexion')
                          } finally {
                            setHeroUploading(false)
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Ou URL de l&apos;image</Label>
                    <Input
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="/uploads/hero.png ou https://..."
                    />
                  </div>
                  <div className="pt-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={async () => {
                      setHeroSaving(true)
                      try {
                        const res = await fetch('/api/site-settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ settings: [{ key: 'hero_image_url', value: heroImageUrl }] }),
                        })
                        const data = await res.json()
                        if (data.success) {
                          toast.success('Image hero sauvegardée')
                        } else {
                          toast.error(data.error || 'Erreur')
                        }
                      } catch {
                        toast.error('Erreur serveur')
                      } finally {
                        setHeroSaving(false)
                      }
                    }} disabled={heroSaving}>
                      {heroSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Livraison Tab */}
        <TabsContent value="delivery">
          <div className="max-w-2xl">
            <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <CardTitle>Zone de livraison</CardTitle>
                </div>
                <CardDescription>Configurez les zones de livraison disponibles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zones de livraison (une par ligne)</Label>
                    <Textarea
                      value={deliveryZones}
                      onChange={e => setDeliveryZones(e.target.value)}
                      placeholder={"Centre-ville, Pointe-Noire\nMboukou\nLoango\nTchinouka"}
                      rows={5}
                    />
                  </div>
                  <div className="pt-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveDeliveryZones} disabled={deliveryZonesSaving}>
                      {deliveryZonesSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Admin User Management */}
      {isSuperAdmin && (
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Administrateurs</CardTitle>
                  <CardDescription>Gérez les comptes administrateurs du site.</CardDescription>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAdminDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : admins && admins.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="hidden sm:table-cell">Date de création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm font-medium">{a.email}</TableCell>
                          <TableCell className="text-sm">{a.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={a.role === 'super_admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}
                            >
                              {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun administrateur trouvé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Admin Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Administrateur</DialogTitle>
            <DialogDescription>Créez un nouveau compte administrateur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={newAdmin.name}
                onChange={e => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@congosoap.cg"
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe *</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={e => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le mot de passe *</Label>
              <Input
                type="password"
                value={newAdmin.confirmPassword}
                onChange={e => setNewAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Retapez le mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createAdmin} disabled={creatingAdmin}>
              {creatingAdmin ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}