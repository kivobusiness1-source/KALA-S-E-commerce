'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldAlert } from 'lucide-react'
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
      <Badge className="bg-[#1a1a2e] text-white hover:bg-[#1a1a2e]/90">
        Super Admin
      </Badge>
    )
  }
  if (role === 'admin') {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
        Admin
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-gray-600">
      Staff
    </Badge>
  )
}

export default function TeamSection() {
  const { admin } = useAdminStore()
  const queryClient = useQueryClient()
  const isSuperAdmin = admin?.role === 'super_admin'

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('staff')
  const [formPhone, setFormPhone] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()).then(d => d.data as AdminUser[]),
    enabled: isSuperAdmin,
  })

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormRole('staff')
    setFormPhone('')
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          phone: formPhone.trim() || null,
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

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Accès restreint</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Cette section est réservée aux super administrateurs.
        </p>
      </div>
    )
  }

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
        <Button
          onClick={() => { resetForm(); setCreateOpen(true) }}
          className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
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
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u, i) => {
                    const isSelf = admin?.id === u.id
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
                          {!isSelf && u.role !== 'super_admin' && (
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
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) resetForm(); setCreateOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>Créer un nouveau compte pour l'équipe d'administration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nom *</Label>
              <Input id="team-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-email">Email *</Label>
              <Input id="team-email" type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@congosoap.cg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-password">Mot de passe *</Label>
              <Input id="team-password" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-role">Rôle</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger id="team-role" className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-phone">Téléphone</Label>
              <Input id="team-phone" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+242 06 123 4567" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setCreateOpen(false) }}>Annuler</Button>
            <Button onClick={handleCreate} disabled={formLoading} className="bg-[#1a1a2e] hover:bg-[#1a1a2e]/90 text-white">
              {formLoading ? 'Création...' : 'Créer'}
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
