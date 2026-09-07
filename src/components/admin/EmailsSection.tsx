'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Mail, Search, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from './helpers'
import type { EmailSubscriber } from './types'

export default function EmailsSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: () => fetch('/api/emails').then(r => r.json()).then(d => d.data as EmailSubscriber[]),
  })

  const filtered = (subscribers ?? []).filter(s => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
    const matchSource = sourceFilter === 'all' || s.source === sourceFilter
    return matchSearch && matchSource
  })

  const deleteSubscriber = async () => {
    if (!deletingId) return
    try {
      const res = await fetch('/api/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletingId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Abonné supprimé')
        queryClient.invalidateQueries({ queryKey: ['subscribers'] })
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

  const exportCSV = () => {
    if (!subscribers || subscribers.length === 0) { toast.error('Aucun abonné à exporter'); return }
    const headers = ['Email', 'Nom', 'Source', 'Statut', 'Date']
    const rows = subscribers.map(s => [
      s.email,
      s.name || '',
      s.source,
      s.isActive ? 'Actif' : 'Inactif',
      format(new Date(s.createdAt), 'yyyy-MM-dd HH:mm'),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abonnes-kalas-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fichier CSV téléchargé')
  }

  const sources = [...new Set((subscribers ?? []).map(s => s.source))]

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-900">Abonnés Email</h3>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {subscribers?.length ?? 0} abonné(s)
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.name || '—'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.source}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                          {s.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun abonné trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonné ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteSubscriber}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
