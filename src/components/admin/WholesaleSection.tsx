'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Package, ShoppingCart, CreditCard, Plus, Edit, Trash2, Search, RefreshCw,
  Power, PowerOff, ChevronUp, ChevronDown, Eye, X, Filter, Box, Truck,
  DollarSign, Phone, Mail, Building2, MapPin, FileText, UserPlus,
  ToggleLeft, ToggleRight, Banknote, Layers, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice, formatDate } from './helpers'
import type { Deliverer } from './types'

// ─── Types ────────────────────────────────────────────────────────────────

interface WholesaleProduct {
  id: string
  name: string
  description: string | null
  lotSize: number
  lotUnit: string
  pricePerLot: number
  comparePrice: number | null
  minLots: number
  stockLots: number
  image: string | null
  isActive: boolean
  createdAt: string
}

interface WholesaleOrderItem {
  id: string
  productId: string
  productName: string
  lotSize: number
  lotUnit: string
  quantityLots: number
  pricePerLot: number
  total: number
}

interface WholesaleOrder {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  company: string | null
  nif: string | null
  stat: string | null
  address: string | null
  status: string
  totalAmount: number
  paymentMethod: string | null
  paymentStatus: string
  paymentReference: string | null
  notes: string | null
  delivererId: string | null
  createdAt: string
  updatedAt: string
  items: WholesaleOrderItem[]
  deliverer?: { id: string; name: string; phone: string } | null
}

interface PaymentMethod {
  id: string
  name: string
  description: string | null
  accountInfo: string | null
  icon: string | null
  isActive: boolean
  isCash: boolean
  sortOrder: number
  createdAt: string
}

// ─── Status configs ───────────────────────────────────────────────────────

const wholesaleStatusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En traitement',
  ready: 'Prête',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const wholesaleStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  ready: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const wholesaleStatusDotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  processing: 'bg-violet-400',
  ready: 'bg-indigo-400',
  shipped: 'bg-orange-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

const paymentStatusLabels: Record<string, string> = {
  unpaid: 'Non payé',
  partial: 'Partiel',
  paid: 'Payé',
}

const paymentStatusColors: Record<string, string> = {
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const paymentStatusDotColors: Record<string, string> = {
  unpaid: 'bg-red-400',
  partial: 'bg-amber-400',
  paid: 'bg-emerald-400',
}

function WholesaleStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${wholesaleStatusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200'} flex items-center gap-1.5`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${wholesaleStatusDotColors[status] || 'bg-gray-400'}`} />
      {wholesaleStatusLabels[status] || status}
    </Badge>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${paymentStatusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200'} flex items-center gap-1.5`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${paymentStatusDotColors[status] || 'bg-gray-400'}`} />
      {paymentStatusLabels[status] || status}
    </Badge>
  )
}

const WHOLESALE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid']

// ─── Main Component ───────────────────────────────────────────────────────

export default function WholesaleSection() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produits en Gros</span>
            <span className="sm:hidden">Produits</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-1.5">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Commandes en Gros</span>
            <span className="sm:hidden">Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="payment-methods" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Méthodes de Paiement</span>
            <span className="sm:hidden">Paiement</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <WholesaleProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <WholesaleOrdersTab />
        </TabsContent>
        <TabsContent value="payment-methods">
          <PaymentMethodsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Sub-tab 1: Wholesale Products ────────────────────────────────────────

interface ProductFormData {
  name: string
  description: string
  lotSize: number
  lotUnit: string
  pricePerLot: number
  comparePrice: number
  minLots: number
  stockLots: number
  image: string
  isActive: boolean
}

const emptyProductForm: ProductFormData = {
  name: '', description: '', lotSize: 1, lotUnit: 'unités', pricePerLot: 0,
  comparePrice: 0, minLots: 1, stockLots: 0, image: '', isActive: true,
}

function WholesaleProductsTab() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<WholesaleProduct | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<WholesaleProduct | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyProductForm)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')

  const { data: products, isLoading } = useQuery({
    queryKey: ['wholesale-products'],
    queryFn: () => fetch('/api/wholesale/products').then(r => r.json()).then(d => d.data as WholesaleProduct[]),
  })

  const filteredProducts = useMemo(() => {
    if (!products) return []
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
  }, [products, search])

  const totalActive = products?.filter(p => p.isActive).length ?? 0
  const totalInactive = products?.filter(p => !p.isActive).length ?? 0

  const resetForm = () => setForm(emptyProductForm)

  const openEdit = (p: WholesaleProduct) => {
    setForm({
      name: p.name,
      description: p.description || '',
      lotSize: p.lotSize,
      lotUnit: p.lotUnit,
      pricePerLot: p.pricePerLot,
      comparePrice: p.comparePrice || 0,
      minLots: p.minLots,
      stockLots: p.stockLots,
      image: p.image || '',
      isActive: p.isActive,
    })
    setEditingProduct(p)
    setEditOpen(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Le nom est obligatoire'); return }
    if (form.pricePerLot <= 0) { toast.error('Le prix par lot doit être positif'); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/wholesale/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          lotSize: form.lotSize,
          lotUnit: form.lotUnit,
          pricePerLot: form.pricePerLot,
          comparePrice: form.comparePrice > 0 ? form.comparePrice : null,
          minLots: form.minLots,
          stockLots: form.stockLots,
          image: form.image.trim() || null,
          isActive: form.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Produit en gros ajouté')
        queryClient.invalidateQueries({ queryKey: ['wholesale-products'] })
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
    if (!editingProduct || !form.name.trim()) { toast.error('Le nom est obligatoire'); return }
    setFormLoading(true)
    try {
      const res = await fetch(`/api/wholesale/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          lotSize: form.lotSize,
          lotUnit: form.lotUnit,
          pricePerLot: form.pricePerLot,
          comparePrice: form.comparePrice > 0 ? form.comparePrice : null,
          minLots: form.minLots,
          stockLots: form.stockLots,
          image: form.image.trim() || null,
          isActive: form.isActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Produit modifié')
        queryClient.invalidateQueries({ queryKey: ['wholesale-products'] })
        setEditOpen(false)
        setEditingProduct(null)
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

  const handleToggle = async (p: WholesaleProduct) => {
    try {
      const res = await fetch(`/api/wholesale/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(p.isActive ? 'Produit désactivé' : 'Produit activé')
        queryClient.invalidateQueries({ queryKey: ['wholesale-products'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetch(`/api/wholesale/products/${deletingProduct.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Produit supprimé')
        queryClient.invalidateQueries({ queryKey: ['wholesale-products'] })
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteOpen(false)
      setDeletingProduct(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total produits</p>
            <p className="text-2xl font-bold text-gray-900">{products?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actifs</p>
            <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inactifs</p>
            <p className="text-2xl font-bold text-gray-500">{totalInactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Stock total (lots)</p>
            <p className="text-2xl font-bold text-gray-900">{products?.reduce((s, p) => s + p.stockLots, 0) ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Produits en Gros</h3>
          <p className="text-sm text-muted-foreground">Gérer les produits vendus en lots</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>
          <Button
            onClick={() => { resetForm(); setCreateOpen(true) }}
            className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Produit</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Prix/lot</TableHead>
                    <TableHead className="hidden md:table-cell">Min. lots</TableHead>
                    <TableHead>Stock (lots)</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p, i) => (
                    <TableRow key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Box className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 whitespace-nowrap">
                          <Layers className="h-3 w-3 mr-1" />
                          1 lot = {p.lotSize} {p.lotUnit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{formatPrice(p.pricePerLot)}</p>
                          {p.comparePrice && p.comparePrice > 0 && (
                            <p className="text-xs text-muted-foreground line-through">{formatPrice(p.comparePrice)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{p.minLots}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${p.stockLots <= p.minLots ? 'text-red-600' : 'text-gray-900'}`}>
                          {p.stockLots}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                          }
                        >
                          {p.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${p.isActive ? 'text-gray-500 hover:text-orange-600' : 'text-orange-500 hover:text-orange-700'}`}
                            onClick={() => handleToggle(p)}
                            title={p.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {p.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                            onClick={() => openEdit(p)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingProduct(p); setDeleteOpen(true) }}
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
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun produit en gros trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <ProductFormDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) resetForm(); setCreateOpen(open) }}
        title="Ajouter un produit en gros"
        description="Créer un nouveau produit vendu en lots."
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        loading={formLoading}
        submitLabel="Ajouter"
      />

      {/* Edit Dialog */}
      <ProductFormDialog
        open={editOpen}
        onOpenChange={(open) => { if (!open) { setEditingProduct(null); resetForm() }; setEditOpen(open) }}
        title="Modifier le produit"
        description="Modifier les informations du produit en gros."
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
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit <strong>{deletingProduct?.name}</strong> sera définitivement supprimé.
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

// ─── Product Form Dialog ──────────────────────────────────────────────────

function ProductFormDialog({
  open, onOpenChange, title, description, form, setForm, onSubmit, loading, submitLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: ProductFormData
  setForm: (form: ProductFormData) => void
  onSubmit: () => void
  loading: boolean
  submitLabel: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="wp-name">Nom *</Label>
            <Input id="wp-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Savon Liquide 5L" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-desc">Description</Label>
            <Textarea id="wp-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description du produit" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wp-lot-size">Taille du lot *</Label>
              <Input id="wp-lot-size" type="number" min={1} value={form.lotSize} onChange={e => setForm({ ...form, lotSize: Math.max(1, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-lot-unit">Unité</Label>
              <Input id="wp-lot-unit" value={form.lotUnit} onChange={e => setForm({ ...form, lotUnit: e.target.value })} placeholder="unités" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wp-price">Prix par lot (FCFA) *</Label>
              <Input id="wp-price" type="number" min={0} value={form.pricePerLot} onChange={e => setForm({ ...form, pricePerLot: Math.max(0, parseInt(e.target.value) || 0) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-compare">Prix comparé (FCFA)</Label>
              <Input id="wp-compare" type="number" min={0} value={form.comparePrice} onChange={e => setForm({ ...form, comparePrice: Math.max(0, parseInt(e.target.value) || 0) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wp-min-lots">Minimum de lots</Label>
              <Input id="wp-min-lots" type="number" min={1} value={form.minLots} onChange={e => setForm({ ...form, minLots: Math.max(1, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-stock-lots">Stock (lots)</Label>
              <Input id="wp-stock-lots" type="number" min={0} value={form.stockLots} onChange={e => setForm({ ...form, stockLots: Math.max(0, parseInt(e.target.value) || 0) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wp-image">URL de l&apos;image</Label>
            <Input id="wp-image" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="wp-active" checked={form.isActive} onCheckedChange={checked => setForm({ ...form, isActive: checked })} />
            <Label htmlFor="wp-active" className="cursor-pointer">Produit actif</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
            {loading ? 'Enregistrement...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Sub-tab 2: Wholesale Orders ──────────────────────────────────────────

function WholesaleOrdersTab() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<WholesaleOrder | null>(null)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ['wholesale-orders', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      return fetch(`/api/wholesale/orders?${params}`).then(r => r.json()).then(d => (d.data?.orders ?? []) as WholesaleOrder[])
    },
  })
  const orders = Array.isArray(rawOrders) ? rawOrders : []

  // Fetch deliverers for assignment
  const { data: deliverers } = useQuery({
    queryKey: ['admin-livreurs'],
    queryFn: () => fetch('/api/livreurs').then(r => r.json()).then(d => d.data as Deliverer[]),
  })

  const openDetail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedOrder(data.data)
        setDetailOpen(true)
        setNoteText('')
      }
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut mis à jour')
        queryClient.invalidateQueries({ queryKey: ['wholesale-orders'] })
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: string) => {
    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Statut de paiement mis à jour')
        queryClient.invalidateQueries({ queryKey: ['wholesale-orders'] })
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus })
        }
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const assignDeliverer = async (orderId: string, delivererId: string | null) => {
    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivererId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(delivererId ? 'Livreur assigné' : 'Livreur retiré')
        queryClient.invalidateQueries({ queryKey: ['wholesale-orders'] })
        if (selectedOrder?.id === orderId) {
          const del = delivererId ? deliverers?.find(d => d.id === delivererId) : null
          setSelectedOrder({
            ...selectedOrder,
            delivererId,
            deliverer: del ? { id: del.id, name: del.name, phone: del.phone } : null,
          })
        }
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const addNote = async () => {
    if (!selectedOrder || !noteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/wholesale/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Note ajoutée')
        setSelectedOrder({ ...selectedOrder, notes: noteText.trim() })
        setNoteText('')
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setAddingNote(false)
    }
  }

  // Summary stats
  const totalOrders = orders.length
  const pendingCount = orders.filter(o => o.status === 'pending').length
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total commandes</p>
            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Livrées</p>
            <p className="text-2xl font-bold text-emerald-600">{orders.filter(o => o.status === 'delivered').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Chiffre d&apos;affaires</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Commandes en Gros</h3>
          <p className="text-sm text-muted-foreground">Suivi des commandes de gros</p>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="N° commande, nom, suivi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {WHOLESALE_ORDER_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{wholesaleStatusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Entreprise</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Paiement</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="w-20">Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o, i) => (
                    <TableRow key={o.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">{o.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{o.customerName}</p>
                          {o.customerPhone && (
                            <p className="text-xs text-muted-foreground truncate">{o.customerPhone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{o.company || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">{formatPrice(o.totalAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <WholesaleStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-gray-700"
                          onClick={() => openDetail(o.id)}
                          title="Voir détail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune commande en gros trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Commande {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>Détails de la commande en gros</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-2">
              {/* Status & Payment Row */}
              <div className="flex flex-wrap gap-3 items-center">
                <WholesaleStatusBadge status={selectedOrder.status} />
                <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                <span className="text-sm text-muted-foreground">{formatDate(selectedOrder.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Statut commande</Label>
                  <Select value={selectedOrder.status} onValueChange={v => updateOrderStatus(selectedOrder.id, v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WHOLESALE_ORDER_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{wholesaleStatusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Statut paiement</Label>
                  <Select value={selectedOrder.paymentStatus} onValueChange={v => updatePaymentStatus(selectedOrder.id, v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{paymentStatusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Livreur</Label>
                  <Select
                    value={selectedOrder.delivererId || 'none'}
                    onValueChange={v => assignDeliverer(selectedOrder.id, v === 'none' ? null : v)}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {deliverers?.filter(d => d.isActive).map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name} — {d.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informations client
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">Nom:</span>
                    <span className="font-medium text-gray-900">{selectedOrder.customerName}</span>
                  </div>
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-gray-900">{selectedOrder.customerPhone}</span>
                    </div>
                  )}
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-gray-900">{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                  {selectedOrder.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-gray-900">{selectedOrder.company}</span>
                    </div>
                  )}
                  {selectedOrder.nif && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">NIF:</span>
                      <span className="text-gray-900">{selectedOrder.nif}</span>
                    </div>
                  )}
                  {selectedOrder.stat && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">STAT:</span>
                      <span className="text-gray-900">{selectedOrder.stat}</span>
                    </div>
                  )}
                  {selectedOrder.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-gray-900">{selectedOrder.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Articles commandés
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantityLots} lot(s) × {formatPrice(item.pricePerLot)} / lot
                          <span className="ml-2">({item.lotSize} {item.lotUnit}/lot)</span>
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Informations de paiement
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Méthode</span>
                    <p className="font-medium text-gray-900">{selectedOrder.paymentMethod || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Référence</span>
                    <p className="font-medium text-gray-900">{selectedOrder.paymentReference || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant</span>
                    <p className="font-semibold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assigned Deliverer */}
              {selectedOrder.deliverer && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Livreur assigné
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium text-gray-900">{selectedOrder.deliverer.name}</span>
                      <span className="text-muted-foreground">{selectedOrder.deliverer.phone}</span>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Notes */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h4>
                {selectedOrder.notes && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">{selectedOrder.notes}</p>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ajouter une note..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={addNote}
                    disabled={addingNote || !noteText.trim()}
                    className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white self-end"
                  >
                    {addingNote ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-tab 3: Payment Methods ───────────────────────────────────────────

interface PaymentMethodFormData {
  name: string
  description: string
  accountInfo: string
  icon: string
  isActive: boolean
  isCash: boolean
  sortOrder: number
}

const emptyPaymentMethodForm: PaymentMethodFormData = {
  name: '', description: '', accountInfo: '', icon: '',
  isActive: true, isCash: false, sortOrder: 0,
}

function PaymentMethodsTab() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethod | null>(null)
  const [form, setForm] = useState<PaymentMethodFormData>(emptyPaymentMethodForm)
  const [formLoading, setFormLoading] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)

  const { data: methods, isLoading } = useQuery({
    queryKey: ['wholesale-payment-methods'],
    queryFn: () => fetch('/api/wholesale/payment-methods').then(r => r.json()).then(d => d.data as PaymentMethod[]),
  })

  const sortedMethods = useMemo(() => {
    if (!methods) return []
    return [...methods].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [methods])

  const totalActive = methods?.filter(m => m.isActive).length ?? 0

  const resetForm = () => setForm(emptyPaymentMethodForm)

  const openEdit = (m: PaymentMethod) => {
    setForm({
      name: m.name,
      description: m.description || '',
      accountInfo: m.accountInfo || '',
      icon: m.icon || '',
      isActive: m.isActive,
      isCash: m.isCash,
      sortOrder: m.sortOrder,
    })
    setEditingMethod(m)
    setEditOpen(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Le nom est obligatoire'); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/wholesale/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          accountInfo: form.accountInfo.trim() || null,
          icon: form.icon.trim() || null,
          isActive: form.isActive,
          isCash: form.isCash,
          sortOrder: form.sortOrder,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Méthode de paiement ajoutée')
        queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
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
    if (!editingMethod || !form.name.trim()) { toast.error('Le nom est obligatoire'); return }
    setFormLoading(true)
    try {
      const res = await fetch(`/api/wholesale/payment-methods/${editingMethod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          accountInfo: form.accountInfo.trim() || null,
          icon: form.icon.trim() || null,
          isActive: form.isActive,
          isCash: form.isCash,
          sortOrder: form.sortOrder,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Méthode modifiée')
        queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
        setEditOpen(false)
        setEditingMethod(null)
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

  const handleToggle = async (m: PaymentMethod) => {
    try {
      const res = await fetch(`/api/wholesale/payment-methods/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !m.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(m.isActive ? 'Méthode désactivée' : 'Méthode activée')
        queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleDelete = async () => {
    if (!deletingMethod) return
    try {
      const res = await fetch(`/api/wholesale/payment-methods/${deletingMethod.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Méthode supprimée')
        queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteOpen(false)
      setDeletingMethod(null)
    }
  }

  const handleReorder = async (method: PaymentMethod, direction: 'up' | 'down') => {
    if (!sortedMethods) return
    const currentIndex = sortedMethods.findIndex(m => m.id === method.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sortedMethods.length) return
    const targetMethod = sortedMethods[targetIndex]
    try {
      await Promise.all([
        fetch(`/api/wholesale/payment-methods/${method.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetMethod.sortOrder }),
        }),
        fetch(`/api/wholesale/payment-methods/${targetMethod.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: method.sortOrder }),
        }),
      ])
      queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
      toast.success('Ordre mis à jour')
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleSeed = async () => {
    setSeedLoading(true)
    try {
      const res = await fetch('/api/wholesale/seed', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Données initiales créées')
        queryClient.invalidateQueries({ queryKey: ['wholesale-payment-methods'] })
        queryClient.invalidateQueries({ queryKey: ['wholesale-products'] })
      } else {
        toast.error(data.error || 'Erreur lors de l\'initialisation')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total méthodes</p>
            <p className="text-2xl font-bold text-gray-900">{methods?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Espèces</p>
            <p className="text-2xl font-bold text-gray-900">{methods?.filter(m => m.isCash).length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Méthodes de Paiement</h3>
          <p className="text-sm text-muted-foreground">Gérer les modes de paiement pour les commandes en gros</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSeed}
            disabled={seedLoading}
          >
            {seedLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Initialiser
          </Button>
          <Button
            onClick={() => { resetForm(); setCreateOpen(true) }}
            className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : sortedMethods.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Compte</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden sm:table-cell">Ordre</TableHead>
                    <TableHead className="w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMethods.map((m, i) => (
                    <TableRow key={m.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <button
                            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                            onClick={() => handleReorder(m, 'up')}
                            disabled={i === 0}
                            title="Monter"
                          >
                            <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button
                            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                            onClick={() => handleReorder(m, 'down')}
                            disabled={i === sortedMethods.length - 1}
                            title="Descendre"
                          >
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {m.icon ? (
                            <span className="text-lg">{m.icon}</span>
                          ) : (
                            <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{m.accountInfo || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {m.isCash ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            <Banknote className="h-3 w-3 mr-1" />
                            Espèces
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <CreditCard className="h-3 w-3 mr-1" />
                            Mobile
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={m.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                          }
                        >
                          {m.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">{m.sortOrder}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${m.isActive ? 'text-gray-500 hover:text-orange-600' : 'text-orange-500 hover:text-orange-700'}`}
                            onClick={() => handleToggle(m)}
                            title={m.isActive ? 'Désactiver' : 'Activer'}
                          >
                            {m.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                            onClick={() => openEdit(m)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingMethod(m); setDeleteOpen(true) }}
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
              <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground mb-4">Aucune méthode de paiement configurée</p>
              <Button variant="outline" onClick={handleSeed} disabled={seedLoading}>
                {seedLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Initialiser les méthodes par défaut
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <PaymentMethodFormDialog
        open={createOpen}
        onOpenChange={(open) => { if (!open) resetForm(); setCreateOpen(open) }}
        title="Ajouter une méthode de paiement"
        description="Créer un nouveau mode de paiement."
        form={form}
        setForm={setForm}
        onSubmit={handleCreate}
        loading={formLoading}
        submitLabel="Ajouter"
      />

      {/* Edit Dialog */}
      <PaymentMethodFormDialog
        open={editOpen}
        onOpenChange={(open) => { if (!open) { setEditingMethod(null); resetForm() }; setEditOpen(open) }}
        title="Modifier la méthode"
        description="Modifier les informations du mode de paiement."
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
            <AlertDialogTitle>Supprimer cette méthode ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La méthode <strong>{deletingMethod?.name}</strong> sera définitivement supprimée.
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

// ─── Payment Method Form Dialog ───────────────────────────────────────────

function PaymentMethodFormDialog({
  open, onOpenChange, title, description, form, setForm, onSubmit, loading, submitLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  form: PaymentMethodFormData
  setForm: (form: PaymentMethodFormData) => void
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
            <Label htmlFor="pm-name">Nom *</Label>
            <Input id="pm-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: M-Pesa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pm-desc">Description</Label>
            <Textarea id="pm-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description de la méthode" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pm-account">Informations du compte</Label>
            <Input id="pm-account" value={form.accountInfo} onChange={e => setForm({ ...form, accountInfo: e.target.value })} placeholder="Numéro ou identifiant du compte" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pm-icon">Icône (emoji)</Label>
              <Input id="pm-icon" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="📱" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-sort">Ordre d&apos;affichage</Label>
              <Input id="pm-sort" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch id="pm-active" checked={form.isActive} onCheckedChange={checked => setForm({ ...form, isActive: checked })} />
              <Label htmlFor="pm-active" className="cursor-pointer">Active</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="pm-cash" checked={form.isCash} onCheckedChange={checked => setForm({ ...form, isCash: checked })} />
              <Label htmlFor="pm-cash" className="cursor-pointer">Espèces</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
            {loading ? 'Enregistrement...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
