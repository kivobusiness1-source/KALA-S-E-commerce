'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  ShoppingCart, Search, Eye, ChevronLeft, ChevronRight, MoreVertical, FileDown, Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatPrice, formatDate, getInitials, statusLabels, StatusBadge } from './helpers'
import type { Order, OrderStatus } from './types'

export default function OrdersSection() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [orderDetail, setOrderDetail] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const limit = 20

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      return fetch(`/api/orders?${params}`).then(r => r.json()).then(d => d.data)
    },
  })

  const orders = ordersData?.orders ?? []
  const totalPages = ordersData?.totalPages ?? 1

  const openDetail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (data.success) {
        setOrderDetail(data.data)
        setDetailOpen(true)
      }
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        if (orderDetail?.id === orderId) {
          setOrderDetail({ ...orderDetail, status })
        }
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const statusTabs = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const

  const exportOrdersCSV = async () => {
    try {
      const res = await fetch('/api/orders?limit=1000')
      const data = await res.json()
      const allOrders: Order[] = data.data?.orders ?? []
      if (allOrders.length === 0) { toast.error('Aucune commande à exporter'); return }
      const headers = ['N°', 'Client', 'Email', 'Téléphone', 'Adresse', 'Montant', 'Statut', 'Date']
      const rows = allOrders.map(o => [
        o.orderNumber,
        o.customerName,
        o.customerEmail,
        o.customerPhone || '',
        `${o.address}, ${o.city}`,
        String(o.totalAmount),
        statusLabels[o.status] || o.status,
        format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm'),
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `commandes-congoclean-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Fichier CSV téléchargé')
    } catch {
      toast.error('Erreur lors de l\'export')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className={`shrink-0 ${statusFilter === s ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`} onClick={() => { setStatusFilter(s); setPage(1) }}>
              {s === 'all' ? 'Tous' : statusLabels[s]}
            </Button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <Button variant="outline" size="sm" onClick={exportOrdersCSV}>
            <FileDown className="h-4 w-4 mr-1" />Exporter CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: Order, i: number) => {
                    const statusBorderMap: Record<string, string> = {
                      pending: 'border-l-amber-400',
                      confirmed: 'border-l-teal-400',
                      processing: 'border-l-violet-400',
                      shipped: 'border-l-cyan-400',
                      delivered: 'border-l-emerald-400',
                      cancelled: 'border-l-red-400',
                    }
                    return (
                    <TableRow key={o.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} border-l-2 ${statusBorderMap[o.status] || 'border-l-transparent'} hover:bg-emerald-50/30 transition-colors duration-150`}>
                      <TableCell className="font-mono text-xs font-medium">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(o.customerName)}
                          </div>
                          {o.customerName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{o.customerEmail}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatPrice(o.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {o.items?.length ?? 0} article(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(o.id)}><Eye className="h-4 w-4" /></Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                                <DropdownMenuItem key={s} onClick={() => updateStatus(o.id, s)} disabled={o.status === s}>
                                  {statusLabels[s]}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune commande trouvée</p>
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

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-printable>
          {orderDetail && (
            <>
              <DialogHeader className="pb-4 border-b border-gray-100">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-t-xl" />
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <DialogTitle>Commande {orderDetail.orderNumber}</DialogTitle>
                    <DialogDescription>Créée le {formatDate(orderDetail.createdAt)}</DialogDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                {/* Customer info */}
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Informations Client</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Nom:</span> <span className="font-medium">{orderDetail.customerName}</span></p>
                    <p><span className="text-muted-foreground">Email:</span> {orderDetail.customerEmail}</p>
                    {orderDetail.customerPhone && <p><span className="text-muted-foreground">Téléphone:</span> {orderDetail.customerPhone}</p>}
                    <p><span className="text-muted-foreground">Adresse:</span> {orderDetail.address}, {orderDetail.city}</p>
                  </CardContent>
                </Card>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Statut:</span>
                    <StatusBadge status={orderDetail.status} />
                  </div>
                  <Select value={orderDetail.status} onValueChange={v => updateStatus(orderDetail.id, v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items */}
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Articles</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Qté</TableHead>
                          <TableHead className="text-right">Prix Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetail.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm font-medium">{item.productName}{item.product?.volume ? ` (${item.product.volume})` : ''}</TableCell>
                            <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm">{formatPrice(item.unitPrice)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{formatPrice(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Separator className="my-3" />
                    <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-emerald-700">{formatPrice(orderDetail.totalAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {orderDetail.notes && (
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{orderDetail.notes}</p></CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}