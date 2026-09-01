'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Megaphone, Plus, Edit, Trash2, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import { formatDate } from './helpers'
import type { Catchphrase } from './types'

const POSITIONS = [
  { value: 'hero', label: 'Bannière principale' },
  { value: 'promo_bar', label: 'Barre promotionnelle' },
  { value: 'product_page', label: 'Page produit' },
  { value: 'footer', label: 'Pied de page' },
]

function PositionBadge({ position }: { position: string }) {
  switch (position) {
    case 'hero':
      return <Badge className="bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90">Bannière</Badge>
    case 'promo_bar':
      return <Badge className="bg-[#c8a951] text-white hover:bg-[#c8a951]/90">Promo</Badge>
    case 'product_page':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">Produit</Badge>
    case 'footer':
      return <Badge variant="outline" className="text-gray-600">Footer</Badge>
    default:
      return <Badge variant="outline">{position}</Badge>
  }
}

interface FormData {
  text: string
  position: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: FormData = { text: '', position: 'hero', isActive: true, sortOrder: 0 }

export default function CatchphraseSection() {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Catchphrase | null>(null)
  const [deletingItem, setDeletingItem] = useState<Catchphrase | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const { data: catchphrases, isLoading } = useQuery({
    queryKey: ['admin-catchphrases'],
    queryFn: () => fetch('/api/catchphrases').then(r => r.json()).then(d => d.data as Catchphrase[]),
  })

  const totalActive = catchphrases?.filter(c => c.isActive).length ?? 0

  const resetForm = () => setForm(emptyForm)

  const openEdit = (c: Catchphrase) => {
    setForm({
      text: c.text,
      position: c.position,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    })
    setEditingItem(c)
    setEditOpen(true)
  }

  const handleCreate = async () => {
    if (!form.text.trim()) {
      toast.error('Le texte est obligatoire')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/catchphrases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: form.text.trim(),
          position: form.position,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Phrase publicitaire ajoutée')
        queryClient.invalidateQueries({ queryKey: ['admin-catchphrases'] })
        setCreateOpen(false)
        resetForm()
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
    if (!editingItem || !form.text.trim()) {
      toast.error('Le texte est obligatoire')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch(`/api/catchphrases/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: form.text.trim(),
          position: form.position,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Phrase publicitaire modifiée')
        queryClient.invalidateQueries({ queryKey: ['admin-catchphrases'] })
        setEditOpen(false)
        setEditingItem(null)
        resetForm()
      } else {
        toast.error(data.error || 'Erreur lors de la modification')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggle = async (c: Catchphrase) => {
    try {
      const res = await fetch(`/api/catchphrases/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(c.isActive ? 'Phrase désactivée' : 'Phrase activée')
        queryClient.invalidateQueries({ queryKey: ['admin-catchphrases'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      const res = await fetch(`/api/catchphrases/${deletingItem.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Phrase publicitaire supprimée')
        queryClient.invalidateQueries({ queryKey: ['admin-catchphrases'] })
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteOpen(false)
      setDeletingItem(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total phrases</p>
            <p className="text-2xl font-bold text-gray-900">{catchphrases?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Positions</p>
            <p className="text-2xl font-bold text-gray-900">{POSITIONS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Phrases publicitaires</h3>
          <p className="text-sm text-muted-foreground">Gérer les textes promotionnels du site</p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateOpen(true) }}
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
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : catchphrases && catchphrases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Texte</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Ordre</TableHead>
                    <TableHead className="hidden md:table-cell">Créé le</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catchphrases.map((c, i) => (
                    <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[300px]">
                          <Type className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{c.text}</span>
                        </div>
                      </TableCell>
                      <TableCell><PositionBadge position={c.position} /></TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={c.isActive
                            ? 'bg-gray-50 text-gray-700 border-gray-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                          }
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{c.sortOrder}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                            onClick={() => openEdit(c)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingItem(c); setDeleteOpen(true) }}
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
              <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune phrase publicitaire trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog (shared) */}
      <CatchphraseFormDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) resetForm(); setCreateOpen(open) }}
        title="Ajouter une phrase"
        description="Créer un nouveau texte promotionnel."
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        loading={formLoading}
        submitLabel="Ajouter"
      />
      <CatchphraseFormDialog
        open={editOpen}
        onOpenChange={(open) => { if (!open) { setEditingItem(null); resetForm() }; setEditOpen(open) }}
        title="Modifier la phrase"
        description="Modifier le texte promotionnel."
        form={form}
        setForm={setForm}
        onSubmit={handleEdit}
        loading={formLoading}
        submitLabel="Enregistrer"
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette phrase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La phrase publicitaire sera définitivement supprimée.
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

function CatchphraseFormDialog({
  open, onOpenChange, title, description, form, setForm, onSubmit, loading, submitLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: FormData
  setForm: (form: FormData) => void
  onSubmit: () => void
  loading: boolean
  submitLabel: string
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
            <Label htmlFor="cp-text">Texte *</Label>
            <Textarea
              id="cp-text"
              value={form.text}
              onChange={e => setForm({ ...form, text: e.target.value })}
              placeholder="Ex: Livraison gratuite à Pointe-Noire"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-position">Position</Label>
            <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
              <SelectTrigger id="cp-position" className="w-full">
                <SelectValue placeholder="Sélectionner une position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-sort">Ordre d'affichage</Label>
            <Input
              id="cp-sort"
              type="number"
              value={form.sortOrder}
              onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="cp-active"
              checked={form.isActive}
              onCheckedChange={checked => setForm({ ...form, isActive: checked })}
            />
            <Label htmlFor="cp-active" className="cursor-pointer">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white">
            {loading ? 'Enregistrement...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
