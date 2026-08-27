'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from './helpers'
import type { Review, ReviewFilter } from './types'

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function ReviewsSection() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => fetch('/api/reviews').then(r => r.json()).then(d => d.data as Review[]),
  })

  const filtered = (reviews ?? []).filter(r => {
    if (filter === 'all') return true
    if (filter === 'pending') return !r.isApproved
    if (filter === 'approved') return r.isApproved
    if (filter === 'rejected') return false
    return true
  })

  const totalReviews = reviews?.length ?? 0
  const approvedCount = reviews?.filter(r => r.isApproved).length ?? 0
  const pendingCount = reviews?.filter(r => !r.isApproved).length ?? 0
  const avgRating = totalReviews > 0
    ? (reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0'

  const approveReview = async (reviewId: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isApproved ? 'Avis approuvé' : 'Avis rejeté')
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
        queryClient.invalidateQueries({ queryKey: ['admin-reviews-badge'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const deleteReview = async () => {
    if (!deletingReview) return
    try {
      const res = await fetch(`/api/reviews/${deletingReview.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Avis supprimé')
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
        queryClient.invalidateQueries({ queryKey: ['admin-reviews-badge'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingReview(null)
    }
  }

  const filterTabs: { key: ReviewFilter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'pending', label: 'En attente' },
    { key: 'approved', label: 'Approuvés' },
    { key: 'rejected', label: 'Rejetés' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total avis</p>
            <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Note moyenne</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{avgRating}</p>
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approuvés</p>
            <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map(tab => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 ${filter === tab.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reviews table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Produit</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="hidden lg:table-cell">Commentaire</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, i) => (
                    <TableRow key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <TableCell className="text-sm font-medium">{r.product?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{r.customerName}</TableCell>
                      <TableCell><StarDisplay rating={r.rating} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{r.comment || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={r.isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {r.isApproved ? 'Approuvé' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!r.isApproved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                              onClick={() => approveReview(r.id, true)}
                              title="Approuver"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {r.isApproved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                              onClick={() => approveReview(r.id, false)}
                              title="Rejeter"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingReview(r); setDeleteDialogOpen(true) }}
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
              <Star className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun avis trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteReview}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
