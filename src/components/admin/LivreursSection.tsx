'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Bike, Phone, MapPin, Truck, Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Deliverer } from './types'

const ZONES = ['Centre-ville', 'Loandjili', 'Mpaka', 'Tchiamba', 'Tié-Tié', 'Mvouti']
const VEHICLES = ['Moto', 'Vélo', 'Camionnette']

const vehicleIcons: Record<string, React.ReactNode> = {
  Moto: <Bike className="h-4 w-4" />,
  Vélo: <Bike className="h-4 w-4" />,
  Camionnette: <Truck className="h-4 w-4" />,
}

interface FormData {
  name: string
  phone: string
  email: string
  zone: string
  vehicle: string
}

const emptyForm: FormData = { name: '', phone: '', email: '', zone: '', vehicle: '' }

export default function LivreursSection() {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingDeliverer, setEditingDeliverer] = useState<Deliverer | null>(null)
  const [deletingDeliverer, setDeletingDeliverer] = useState<Deliverer | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const { data: livreurs, isLoading } = useQuery({
    queryKey: ['admin-livreurs'],
    queryFn: () => fetch('/api/livreurs').then(r => r.json()).then(d => d.data as Deliverer[]),
  })

  const totalActive = livreurs?.filter(l => l.isActive).length ?? 0
  const totalInactive = livreurs?.filter(l => !l.isActive).length ?? 0

  const updateField = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const openCreate = () => {
    setForm(emptyForm)
    setCreateOpen(true)
  }

  const openEdit = (d: Deliverer) => {
    setForm({
      name: d.name,
      phone: d.phone,
      email: d.email || '',
      zone: d.zone || '',
      vehicle: d.vehicle || '',
    })
    setEditingDeliverer(d)
    setEditOpen(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Le nom et le téléphone sont obligatoires')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/livreurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          zone: form.zone || null,
          vehicle: form.vehicle || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Livreur ajouté avec succès')
        queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] })
        setCreateOpen(false)
        setForm(emptyForm)
      } else {
        toast.error(data.error || 'Erreur lors de l\'ajout')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingDeliverer || !form.name.trim() || !form.phone.trim()) {
      toast.error('Le nom et le téléphone sont obligatoires')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch(`/api/livreurs/${editingDeliverer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          zone: form.zone || null,
          vehicle: form.vehicle || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Livreur modifié avec succès')
        queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] })
        setEditOpen(false)
        setEditingDeliverer(null)
        setForm(emptyForm)
      } else {
        toast.error(data.error || 'Erreur lors de la modification')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggle = async (d: Deliverer) => {
    try {
      const res = await fetch(`/api/livreurs/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !d.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(d.isActive ? 'Livreur désactivé' : 'Livreur activé')
        queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleDelete = async () => {
    if (!deletingDeliverer) return
    try {
      const res = await fetch(`/api/livreurs/${deletingDeliverer.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Livreur supprimé')
        queryClient.invalidateQueries({ queryKey: ['admin-livreurs'] })
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteOpen(false)
      setDeletingDeliverer(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total livreurs</p>
            <p className="text-2xl font-bold text-gray-900">{livreurs?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actifs</p>
            <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inactifs</p>
            <p className="text-2xl font-bold text-gray-500">{totalInactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Livreurs</h3>
          <p className="text-sm text-muted-foreground">Gestion des livreurs et zones de livraison</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : livreurs && livreurs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="hidden md:table-cell">Zone</TableHead>
                    <TableHead className="hidden lg:table-cell">Véhicule</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Commandes</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livreurs.map((l, i) => (
                    <TableRow key={l.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                      <TableCell className="text-sm font-medium text-gray-900">{l.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {l.phone}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {l.zone ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {l.zone}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {l.vehicle ? (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {vehicleIcons[l.vehicle] || <Truck className="h-4 w-4" />}
                            {l.vehicle}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={l.isActive
                            ? 'bg-gray-50 text-gray-700 border-gray-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                          }
                        >
                          {l.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm font-medium text-gray-900">{l._count?.orders ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                            onClick={() => openEdit(l)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingDeliverer(l); setDeleteOpen(true) }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun livreur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog (shared) */}
      <DelivererFormDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) setForm(emptyForm); setCreateOpen(open) }}
        title="Ajouter un livreur"
        description="Ajouter un nouveau livreur à l'équipe de livraison."
        form={form}
        updateField={updateField}
        onSubmit={handleCreate}
        loading={formLoading}
      />
      <DelivererFormDialog
        open={editOpen}
        onOpenChange={(open) => { if (!open) { setEditingDeliverer(null); setForm(emptyForm) }; setEditOpen(open) }}
        title="Modifier le livreur"
        description="Modifier les informations du livreur."
        form={form}
        updateField={updateField}
        onSubmit={handleEdit}
        loading={formLoading}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce livreur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le livreur <strong>{deletingDeliverer?.name}</strong> sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DelivererFormDialog({
  open, onOpenChange, title, description, form, updateField, onSubmit, loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: FormData
  updateField: (field: keyof FormData, value: string) => void
  onSubmit: () => void
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="livreur-name">Nom *</Label>
            <Input id="livreur-name" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Nom complet" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="livreur-phone">Téléphone *</Label>
            <Input id="livreur-phone" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+242 06 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="livreur-email">Email</Label>
            <Input id="livreur-email" type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="email@exemple.cg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="livreur-zone">Zone</Label>
            <Select value={form.zone} onValueChange={v => updateField('zone', v)}>
              <SelectTrigger id="livreur-zone" className="w-full">
                <SelectValue placeholder="Sélectionner une zone" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map(z => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="livreur-vehicle">Véhicule</Label>
            <Select value={form.vehicle} onValueChange={v => updateField('vehicle', v)}>
              <SelectTrigger id="livreur-vehicle" className="w-full">
                <SelectValue placeholder="Sélectionner un véhicule" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLES.map(v => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white">
            {loading ? 'Enregistrement...' : title.includes('Ajouter') ? 'Ajouter' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
