'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldAlert, Edit, UserCog } from 'lucide-react'
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
import { useAdminStore } from '@/stores/admin-store'
import { formatDate } from './helpers'
import type { AdminUser } from './types'

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') {
    return (
      <Badge className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90">
        Super Admin
      </Badge>
    )
  }
  if (role === 'admin') {
    return (
      <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200">
        Admin
      </Badge>
    )
  }
  if (role === 'staff') {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
        Staff
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-gray-500">
      Livreur
    </Badge>
  )
}

interface FormData {
  name: string
  email: string
  password: string
  phone: string
  role: string
  isActive: boolean
}

const emptyForm: FormData = { name: '', email: '', password: '', phone: '', role: 'staff', isActive: true }

export default function TeamSection() {
  const { admin } = useAdminStore()
  const queryClient = useQueryClient()
  const role = admin?.role || ''

  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin'
  const canCreate = isSuperAdmin || isAdmin
  const canDelete = isSuperAdmin
  const canEdit = isSuperAdmin || isAdmin || role === 'staff' || role === 'livreur'

  // staff/livreur can only see their own profile
  const canSeeAll = isSuperAdmin || isAdmin

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()).then(d => d.data as AdminUser[]),
    enabled: !!admin,
  })

  const resetForm = () => setForm(emptyForm)

  const openEdit = (u: AdminUser) => {
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      role: u.role,
      isActive: u.isActive,
    })
    setEditingUser(u)
    setEditOpen(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Utilisateur créé avec succès')
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        setCreateOpen(false)
        resetForm()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingUser || !form.name.trim() || !form.email.trim()) {
      toast.error('Nom et email sont obligatoires')
      return
    }
    setFormLoading(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        isActive: form.isActive,
      }
      // Only super_admin/admin can change roles (with restrictions)
      if (canSeeAll && form.role !== editingUser.role) {
        body.role = form.role
      }
      // Password change (optional)
      if (form.password.trim()) {
        body.password = form.password.trim()
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Utilisateur modifié')
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        setEditOpen(false)
        setEditingUser(null)
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

  const handleDelete = async () => {
    if (!deletingUser) return
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Utilisateur supprimé')
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteOpen(false)
      setDeletingUser(null)
    }
  }

  // staff/livreur can only see their own profile
  if (!canSeeAll && admin) {
    const self = users?.find(u => u.id === admin.id)
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mon Profil</h3>
          <p className="text-sm text-muted-foreground">Consultez et modifiez vos informations.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : self ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Nom</p><p className="font-medium">{self.name}</p></div>
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{self.email}</p></div>
                  <div><p className="text-sm text-muted-foreground">Téléphone</p><p className="font-medium">{self.phone || '—'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Rôle</p><RoleBadge role={self.role} /></div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" onClick={() => openEdit(self)}>
                    <Edit className="h-4 w-4 mr-2" />Modifier mon profil
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Edit self dialog */}
        <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditingUser(null); resetForm() }; setEditOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier mon profil</DialogTitle>
              <DialogDescription>Mettez à jour vos informations personnelles.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+242 06 123 4567" />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditingUser(null); resetForm(); setEditOpen(false) }}>Annuler</Button>
              <Button onClick={handleEdit} disabled={formLoading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
                {formLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Full team management for super_admin/admin
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion de l'équipe</h3>
          <p className="text-sm text-muted-foreground">
            {users?.length ?? 0} membre{((users?.length ?? 0) > 1) ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => { resetForm(); setCreateOpen(true) }}
            className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un membre
          </Button>
        )}
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Créé le</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => {
                    const isSelf = admin?.id === u.id
                    // admin cannot edit super_admins or other admins
                    const canEditThisUser = isSuperAdmin
                      || (isAdmin && u.role !== 'super_admin' && u.role !== 'admin')
                      || isSelf
                    // admin cannot see super_admin role in dropdown (handled in form)
                    return (
                      <TableRow key={u.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                        <TableCell className="text-sm font-medium text-gray-900">
                          {u.name}{isSelf ? ' (vous)' : ''}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{u.phone || '—'}</TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={u.isActive
                              ? 'bg-gray-50 text-gray-700 border-gray-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                            }
                          >
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEditThisUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                onClick={() => openEdit(u)}
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && !isSelf && u.role !== 'super_admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => { setDeletingUser(u); setDeleteOpen(true) }}
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <UserCog className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetForm(); setCreateOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>Créer un nouveau compte pour l'équipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nom *</Label>
              <Input id="team-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-email">Email *</Label>
              <Input id="team-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@kalas.cg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-password">Mot de passe *</Label>
              <Input id="team-password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-role">Rôle</Label>
              <Select value={form.role} onValueChange={setForm}>
                <SelectTrigger id="team-role" className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="livreur">Livreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-phone">Téléphone</Label>
              <Input id="team-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+242 06 123 4567" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setCreateOpen(false) }}>Annuler</Button>
            <Button onClick={handleCreate} disabled={formLoading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
              {formLoading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditingUser(null); resetForm() }; setEditOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>Mettre à jour les informations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@kalas.cg" />
            </div>
            {/* Password only when editing — optional */}
            <div className="space-y-2">
              <Label>Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            {/* Role dropdown — only for super_admin/admin and not editing self */}
            {canSeeAll && editingUser && admin?.id !== editingUser.id && (
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={setForm}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                    {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="livreur">Livreur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+242 06 123 4567" />
            </div>
            {/* Active toggle — only for super_admin */}
            {isSuperAdmin && editingUser && admin?.id !== editingUser.id && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="team-active"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="team-active" className="cursor-pointer">Compte actif</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingUser(null); resetForm(); setEditOpen(false) }}>Annuler</Button>
            <Button onClick={handleEdit} disabled={formLoading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
              {formLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur <strong>{deletingUser?.name}</strong> sera définitivement supprimé.
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
