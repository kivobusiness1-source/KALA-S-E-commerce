'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Package, Plus, Edit, Trash2, Search, Filter, X, RefreshCw, FileDown, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { formatPrice } from './helpers'
import type { Product, Category } from './types'

export default function ProductsSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null)
  const [stockAdjustQty, setStockAdjustQty] = useState('')
  const [stockAdjustLoading, setStockAdjustLoading] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  // Product form state
  const [pForm, setPForm] = useState({
    name: '', description: '', longDescription: '', price: '', comparePrice: '', categoryId: '',
    volume: '', stockQty: '', minStockAlert: '', isFeatured: false, isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products', search, categoryFilter],
    queryFn: () => {
      const params = new URLSearchParams({ all: 'true' })
      if (search) params.set('search', search)
      if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter)
      return fetch(`/api/products?${params}`).then(r => r.json()).then(d => d.data as Product[])
    },
  })

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data as Category[]),
  })

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setPForm({
        name: product.name,
        description: product.description || '',
        longDescription: product.longDescription || '',
        price: String(product.price),
        comparePrice: product.comparePrice ? String(product.comparePrice) : '',
        categoryId: product.categoryId,
        volume: product.volume || '',
        stockQty: String(product.stockQty),
        minStockAlert: String(product.minStockAlert),
        isFeatured: product.isFeatured,
        isActive: product.isActive,
      })
    } else {
      setEditingProduct(null)
      setPForm({ name: '', description: '', longDescription: '', price: '', comparePrice: '', categoryId: '', volume: '', stockQty: '0', minStockAlert: '10', isFeatured: false, isActive: true })
    }
    setProductDialogOpen(true)
  }

  const saveProduct = async () => {
    if (!pForm.name || !pForm.price || !pForm.categoryId) {
      toast.error('Nom, prix et catégorie sont requis')
      return
    }
    setSaving(true)
    try {
      const body = {
        name: pForm.name,
        description: pForm.description || undefined,
        longDescription: pForm.longDescription || undefined,
        price: parseFloat(pForm.price),
        comparePrice: pForm.comparePrice ? parseFloat(pForm.comparePrice) : null,
        categoryId: pForm.categoryId,
        volume: pForm.volume || null,
        stockQty: parseInt(pForm.stockQty) || 0,
        minStockAlert: parseInt(pForm.minStockAlert) || 10,
        isFeatured: pForm.isFeatured,
        isActive: pForm.isActive,
        image: editingProduct?.image || null,
      }

      let res: Response
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      const data = await res.json()
      if (data.success) {
        toast.success(editingProduct ? 'Produit modifié' : 'Produit créé')
        setProductDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async () => {
    if (!deletingProduct) return
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Produit supprimé')
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setDeleteDialogOpen(false)
      setDeletingProduct(null)
    }
  }

  const toggleProductActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive, inStock: !product.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(product.isActive ? 'Produit désactivé' : 'Produit activé')
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleStockAdjust = async () => {
    if (!stockAdjustProduct) return
    const qty = parseInt(stockAdjustQty)
    if (isNaN(qty) || qty < 0) { toast.error('Quantité invalide'); return }
    setStockAdjustLoading(true)
    try {
      const res = await fetch(`/api/products/${stockAdjustProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQty: qty, inStock: qty > 0 }),
      })
      if (res.ok) {
        toast.success(`Stock mis à jour: ${qty} unités`)
        setStockAdjustProduct(null)
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setStockAdjustLoading(false)
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(product.isFeatured ? 'Produit retiré des vedettes' : 'Produit mis en vedette')
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!products) return
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const deleteSelectedProducts = async () => {
    if (selectedProducts.size === 0) return
    try {
      await Promise.all(
        [...selectedProducts].map(id => fetch(`/api/products/${id}`, { method: 'DELETE' }))
      )
      toast.success(`${selectedProducts.size} produit(s) supprimé(s)`)
      setSelectedProducts(new Set())
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const exportSelectedCSV = () => {
    if (!products || selectedProducts.size === 0) return
    const selected = products.filter(p => selectedProducts.has(p.id))
    const headers = ['Nom', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Vedette']
    const rows = selected.map(p => [
      p.name,
      p.category?.name || '',
      String(p.price),
      String(p.stockQty),
      p.isActive ? 'Actif' : 'Inactif',
      p.isFeatured ? 'Oui' : 'Non',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `produits-congoclean-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Fichier CSV téléchargé')
  }

  // Category management
  const saveCategory = async () => {
    if (!newCategoryName.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      if (editingCategory) {
        const slug = newCategorySlug || newCategoryName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, slug }),
        })
        const data = await res.json()
        if (data.success) { toast.success('Catégorie modifiée'); setCategoryDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['categories'] }) }
        else toast.error(data.error || 'Erreur')
      } else {
        const slug = newCategorySlug || newCategoryName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName, slug }),
        })
        const data = await res.json()
        if (data.success) { toast.success('Catégorie créée'); setCategoryDialogOpen(false); queryClient.invalidateQueries({ queryKey: ['categories'] }) }
        else toast.error(data.error || 'Erreur')
      }
    } catch { toast.error('Erreur serveur') }
    finally { setSaving(false) }
  }

  const deleteCategory = async () => {
    if (!deletingCategory) return
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Catégorie supprimée'); queryClient.invalidateQueries({ queryKey: ['categories'] }) }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur serveur') }
    finally { setDeleteCategoryDialogOpen(false); setDeletingCategory(null) }
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h3 className="text-xl font-semibold text-gray-900">Produits</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryManager(!showCategoryManager)}>
            <Filter className="h-4 w-4 mr-1" />Catégories
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openProductDialog()}>
            <Plus className="h-4 w-4 mr-1" />Ajouter
          </Button>
        </div>
      </div>

      {/* Category Manager */}
      {showCategoryManager && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gestion des Catégories</CardTitle>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setEditingCategory(null); setNewCategoryName(''); setNewCategorySlug(''); setCategoryDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-1" />Nouvelle Catégorie
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {catsLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-2">
                {categories?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.slug} · {c._count.products} produit(s)</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(c); setNewCategoryName(c.name); setNewCategorySlug(c.slug); setCategoryDialogOpen(true) }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => { setDeletingCategory(c); setDeleteCategoryDialogOpen(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!categories || categories.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">Aucune catégorie</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          {productsLoading ? (
            <div className="p-6 space-y-4"><Skeleton className="h-10 w-full" />{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50/90 to-gray-50/60">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProducts.size === products.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Vedette</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, i) => (
                    <TableRow key={p.id} className={`${!p.isActive ? 'opacity-50' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} ${selectedProducts.has(p.id) ? 'bg-emerald-50/50' : ''} hover:bg-emerald-50/30 transition-colors duration-150`}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(p.id)}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-gray-200/60">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-emerald-300" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          {p.volume && <p className="text-xs text-muted-foreground">{p.volume}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.category?.name}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatPrice(p.price)}</TableCell>
                      <TableCell className="text-right">
                        <button
                          className={`text-sm font-medium hover:underline cursor-pointer ${p.stockQty < p.minStockAlert ? 'text-red-600 font-bold' : 'text-gray-900'}`}
                          onClick={() => { setStockAdjustProduct(p); setStockAdjustQty(String(p.stockQty)) }}
                        >
                          {p.stockQty}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleFeatured(p)}
                          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${p.isFeatured ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${p.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}>
                            {p.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          {p.isFeatured && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">★</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProductDialog(p)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleProductActive(p)}>
                            {p.isActive ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4 opacity-40" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => { setDeletingProduct(p); setDeleteDialogOpen(true) }}>
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
              <p className="text-muted-foreground">Aucun produit trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProducts.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl">
          <span className="text-sm font-medium">{selectedProducts.size} produit(s) sélectionné(s)</span>
          <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200 hover:bg-red-900/50" onClick={deleteSelectedProducts}>
            <Trash2 className="h-4 w-4 mr-1" />
            Supprimer la sélection
          </Button>
          <Button size="sm" variant="ghost" className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-900/50" onClick={exportSelectedCSV}>
            <FileDown className="h-4 w-4 mr-1" />
            Exporter CSV
          </Button>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}</DialogTitle>
            <DialogDescription>Remplissez les informations du produit</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="sm:col-span-2 space-y-2">
              <Label>Image du produit</Label>
              <div className="relative group">
                {editingProduct?.image && (
                  <div className="mb-3 relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                    <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(prev => prev ? { ...prev, image: null } : prev)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadingImage(true)
                    try {
                      const formData = new FormData()
                      formData.append('image', file)
                      const res = await fetch('/api/upload', { method: 'POST', body: formData })
                      if (!res.ok) throw new Error('Upload failed')
                      const data = await res.json()
                      setEditingProduct(prev => prev ? { ...prev, image: data.data.url } : prev)
                    } catch {
                      toast.error('Erreur lors du téléchargement')
                    } finally {
                      setUploadingImage(false)
                    }
                  }}
                  disabled={uploadingImage}
                />
                {uploadingImage && <p className="text-xs text-gray-500 mt-1">Téléchargement en cours...</p>}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Nom *</Label>
              <Input value={pForm.name} onChange={e => setPForm({ ...pForm, name: e.target.value })} placeholder="Nom du produit" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Catégorie *</Label>
              <Select value={pForm.categoryId} onValueChange={v => setPForm({ ...pForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description</Label>
              <Input value={pForm.description} onChange={e => setPForm({ ...pForm, description: e.target.value })} placeholder="Description courte" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description Longue</Label>
              <Textarea value={pForm.longDescription} onChange={e => setPForm({ ...pForm, longDescription: e.target.value })} placeholder="Description détaillée" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Prix (FCFA) *</Label>
              <Input type="number" value={pForm.price} onChange={e => setPForm({ ...pForm, price: e.target.value })} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label>Prix Comparé (FCFA)</Label>
              <Input type="number" value={pForm.comparePrice} onChange={e => setPForm({ ...pForm, comparePrice: e.target.value })} placeholder="Optionnel" min="0" />
            </div>
            <div className="space-y-2">
              <Label>Volume</Label>
              <Input value={pForm.volume} onChange={e => setPForm({ ...pForm, volume: e.target.value })} placeholder="ex: 1L, 5L" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" value={pForm.stockQty} onChange={e => setPForm({ ...pForm, stockQty: e.target.value })} placeholder="0" min="0" />
            </div>
            <div className="space-y-2">
              <Label>Alerte Stock Min</Label>
              <Input type="number" value={pForm.minStockAlert} onChange={e => setPForm({ ...pForm, minStockAlert: e.target.value })} placeholder="10" min="0" />
            </div>
            <div className="flex items-center gap-8 pt-6">
              <div className="flex items-center gap-2">
                <Switch checked={pForm.isFeatured} onCheckedChange={v => setPForm({ ...pForm, isFeatured: v })} />
                <Label>En vedette</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={pForm.isActive} onCheckedChange={v => setPForm({ ...pForm, isActive: v })} />
                <Label>Actif</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveProduct} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingProduct ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletingProduct?.name}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteProduct}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={newCategoryName} onChange={e => { setNewCategoryName(e.target.value); if (!editingCategory) setNewCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim()) }} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={newCategorySlug} onChange={e => setNewCategorySlug(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveCategory} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}{editingCategory ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deletingCategory?.name}&quot; ? Les catégories avec des produits ne peuvent pas être supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteCategory}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!stockAdjustProduct} onOpenChange={() => setStockAdjustProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
            <DialogDescription>{stockAdjustProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quantité en stock</Label>
              <Input
                type="number"
                value={stockAdjustQty}
                onChange={(e) => setStockAdjustQty(e.target.value)}
                min="0"
              />
            </div>
            <div className="flex gap-2">
              {["+10", "+50", "+100", "-10", "Reset"].map(btn => (
                <Button key={btn} variant="outline" size="sm" onClick={() => {
                  if (btn === 'Reset') setStockAdjustQty(String(stockAdjustProduct?.stockQty || 0))
                  else setStockAdjustQty(String(Math.max(0, parseInt(stockAdjustQty || '0') + parseInt(btn))))
                }}>{btn}</Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockAdjustProduct(null)}>Annuler</Button>
            <Button onClick={handleStockAdjust} disabled={stockAdjustLoading}>
              {stockAdjustLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}