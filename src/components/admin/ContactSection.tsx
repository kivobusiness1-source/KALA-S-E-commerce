'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Inbox, Search, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from './helpers'
import type { ContactSubmission } from './types'

export default function ContactSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingRead, setMarkingRead] = useState<string | null>(null)
  const limit = 20

  const { data: contactData, isLoading } = useQuery({
    queryKey: ['contact-submissions', search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      return fetch(`/api/contact?${params}`).then(r => r.json()).then(d => d.data)
    },
  })

  const submissions = contactData?.submissions ?? []
  const totalPages = contactData?.totalPages ?? 1

  const openDetail = (submission: ContactSubmission) => {
    setSelectedContact(submission)
    setDetailOpen(true)
    if (!submission.isRead) {
      markAsRead(submission.id)
    }
  }

  const markAsRead = async (id: string) => {
    setMarkingRead(id)
    try {
      await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, isRead: true })
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setMarkingRead(null)
    }
  }

  const deleteContact = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/contact?id=${deletingId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Soumission supprimée')
        queryClient.invalidateQueries({ queryKey: ['contact-submissions'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-900">Soumissions de Contact</h3>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {contactData?.total ?? 0} soumission(s)
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Sujet</TableHead>
                    <TableHead className="hidden lg:table-cell">Message</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Lu</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s: ContactSubmission) => (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer hover:bg-gray-50 ${!s.isRead ? 'bg-emerald-50/50' : ''}`}
                      onClick={() => openDetail(s)}
                    >
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{s.subject || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{s.message}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.isRead ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                          {s.isRead ? 'Lu' : 'Non lu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {!s.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead(s.id)}
                              disabled={markingRead === s.id}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true) }}
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
              <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune soumission de contact</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContact.subject || 'Soumission de Contact'}</DialogTitle>
                <DialogDescription>De {selectedContact.name} ({selectedContact.email})</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selectedContact.phone && (
                  <p><span className="text-muted-foreground">Téléphone:</span> {selectedContact.phone}</p>
                )}
                <Separator />
                <p className="whitespace-pre-wrap leading-relaxed">{selectedContact.message}</p>
                <Separator />
                <p className="text-xs text-muted-foreground">Reçu le {formatDate(selectedContact.createdAt)}</p>
              </div>
              <DialogFooter>
                {!selectedContact.isRead && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markAsRead(selectedContact.id)} disabled={markingRead === selectedContact.id}>
                    <Check className="h-4 w-4 mr-1" />Marquer comme lu
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette soumission ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteContact}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
