'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ShoppingCart, Search, Eye, ChevronLeft, ChevronRight, MoreVertical, FileDown, Printer,
  MessageSquare, Send, Trash2, Clock, Shield, Bot, Reply, Paperclip,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import type { Order, OrderStatus, OrderNote } from './types'

const MAX_REPLY_LENGTH = 2000

export default function OrdersSection() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [orderDetail, setOrderDetail] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [orderNotes, setOrderNotes] = useState<OrderNote[]>([])
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const notesEndRef = useRef<HTMLDivElement>(null)
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

  const fetchNotes = useCallback(async (orderId: string) => {
    setLoadingNotes(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`)
      const data = await res.json()
      if (data.success) {
        setOrderNotes(data.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingNotes(false)
    }
  }, [])

  const openDetail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (data.success) {
        setOrderDetail(data.data)
        setDetailOpen(true)
        setShowNotes(false)
        setReplyText('')
        fetchNotes(orderId)
      }
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  // Scroll to bottom when notes change
  useEffect(() => {
    if (showNotes && notesEndRef.current) {
      notesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [orderNotes, showNotes])

  const updateStatus = async (orderId: string, newStatus: string) => {
    const oldStatus = orderDetail?.status
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        if (orderDetail?.id === orderId) {
          setOrderDetail({ ...orderDetail, status: newStatus })
        }

        // Auto-add system note when status changes
        if (oldStatus && oldStatus !== newStatus && orderId) {
          const oldLabel = statusLabels[oldStatus] || oldStatus
          const newLabel = statusLabels[newStatus] || newStatus
          try {
            await fetch(`/api/orders/${orderId}/notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: `Statut mis à jour : ${oldLabel} → ${newLabel}` }),
            })
            fetchNotes(orderId)
          } catch {
            // silent
          }
        }
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const sendReply = async () => {
    if (!orderDetail || !replyText.trim()) return
    const content = replyText.trim()
    if (content.length > MAX_REPLY_LENGTH) {
      toast.error('Message trop long')
      return
    }
    setSendingReply(true)
    try {
      const res = await fetch(`/api/orders/${orderDetail.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyText('')
        fetchNotes(orderDetail.id)
        toast.success('Réponse envoyée')
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSendingReply(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!orderDetail) return
    try {
      const res = await fetch(`/api/orders/${orderDetail.id}/notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        setOrderNotes(prev => prev.filter(n => n.id !== noteId))
        toast.success('Note supprimée')
      }
    } catch {
      toast.error('Erreur')
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

  const formatNoteTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy 'à' HH:mm", { locale: fr })
    } catch {
      return dateStr
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
            <FileDown className="h-4 w-4 mr-1" />CSV
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
                          {o.items?.length ?? 0} art.
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
      <Dialog open={detailOpen} onOpenChange={(v) => { setDetailOpen(v); if (!v) { setShowNotes(false); setOrderNotes([]) } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-printable>
          {orderDetail && (
            <>
              <DialogHeader className="pb-4 border-b border-gray-100">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-t-xl" />
                <div className="flex items-center justify-between pr-6">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      Commande {orderDetail.orderNumber}
                      {orderNotes.length > 0 && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {orderNotes.length}
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>Créée le {formatDate(orderDetail.createdAt)}</DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showNotes ? 'default' : 'outline'}
                      size="sm"
                      className={showNotes ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5' : 'gap-1.5'}
                      onClick={() => setShowNotes(!showNotes)}
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                      {orderNotes.length > 0 && (
                        <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${showNotes ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {orderNotes.length}
                        </span>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                      <Printer className="w-4 h-4" />
                      <span className="hidden sm:inline">Imprimer</span>
                    </Button>
                  </div>
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
                    <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Paperclip className="h-4 w-4 text-muted-foreground" />Notes Client</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{orderDetail.notes}</p></CardContent>
                  </Card>
                )}

                {/* ====== NOTES / REPLIES SECTION ====== */}
                <Card className="border-l-4 border-l-emerald-500 overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-600" />
                        Historique des Réponses
                        {orderNotes.length > 0 && (
                          <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                            {orderNotes.length} message(s)
                          </Badge>
                        )}
                      </CardTitle>
                      {!showNotes && orderNotes.length > 0 && (
                        <Button variant="ghost" size="sm" className="text-emerald-600 text-xs" onClick={() => setShowNotes(true)}>
                          Voir tout ↓
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingNotes ? (
                      <div className="space-y-3 py-4">
                        {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                      </div>
                    ) : orderNotes.length === 0 && !showNotes ? (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <MessageSquare className="h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">Aucune réponse pour le moment</p>
                        <p className="text-xs text-muted-foreground">Envoyez la première réponse au client</p>
                      </div>
                    ) : (
                      <>
                        {/* Notes timeline */}
                        <div className="relative space-y-0">
                          {/* Vertical line */}
                          {orderNotes.length > 1 && (
                            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-emerald-100" />
                          )}

                          {(showNotes ? orderNotes : orderNotes.slice(-2)).map((note, idx) => {
                            const isAdmin = note.senderType === 'admin'
                            const isSystem = note.senderType === 'system'
                            const isLast = idx === (showNotes ? orderNotes : orderNotes.slice(-2)).length - 1

                            return (
                              <div key={note.id} className={`relative flex gap-3 ${!isLast ? 'pb-4' : ''}`}>
                                {/* Timeline dot */}
                                <div className="relative z-10 mt-1 shrink-0">
                                  <div className={`w-[36px] h-[36px] rounded-full flex items-center justify-center ${
                                    isSystem
                                      ? 'bg-gray-100 text-gray-500'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {isSystem ? <Bot className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                                  </div>
                                </div>

                                {/* Content */}
                                <div className={`flex-1 min-w-0 rounded-lg border p-3 ${
                                  isSystem
                                    ? 'bg-gray-50/80 border-gray-200/60'
                                    : 'bg-emerald-50/60 border-emerald-200/60'
                                }`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-semibold ${isSystem ? 'text-gray-500' : 'text-emerald-700'}`}>
                                      {isSystem ? 'Système' : 'Admin'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatNoteTime(note.createdAt)}
                                      </span>
                                      {isAdmin && (
                                        <button
                                          onClick={() => deleteNote(note.id)}
                                          className="text-gray-300 hover:text-red-500 transition-colors duration-150"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className={`text-sm leading-relaxed ${isSystem ? 'text-gray-600 italic' : 'text-gray-800'}`}>
                                    {note.content}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={notesEndRef} />
                        </div>

                        {/* Reply input */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Reply className="h-3.5 w-3.5" />
                                Écrire une réponse
                              </Label>
                              <span className={`text-xs ${replyText.length > MAX_REPLY_LENGTH * 0.9 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                                {replyText.length} / {MAX_REPLY_LENGTH}
                              </span>
                            </div>
                            <Textarea
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Écrivez votre réponse au client ici..."
                              rows={3}
                              className="resize-none focus-visible:ring-emerald-500/40 focus-visible:border-emerald-400 transition-all duration-200"
                              onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                  e.preventDefault()
                                  sendReply()
                                }
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">
                                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl</kbd>
                                {' + '}
                                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Entrée</kbd>
                                {' pour envoyer'}
                              </p>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm shadow-emerald-600/20"
                                onClick={sendReply}
                                disabled={sendingReply || !replyText.trim()}
                              >
                                {sendingReply ? (
                                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                Envoyer la réponse
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
