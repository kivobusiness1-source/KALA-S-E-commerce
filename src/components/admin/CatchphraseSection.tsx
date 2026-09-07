'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Megaphone, Plus, Edit, Trash2, Type, ChevronUp, ChevronDown, Power, PowerOff, Video, Upload, X, RefreshCw, Play, ExternalLink, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  { value: 'hero', label: 'Bannière principale', description: 'Sous-titre de la section héro de la page d\'accueil' },
  { value: 'promo_bar', label: 'Barre promotionnelle', description: 'Texte défilant en haut de la page' },
  { value: 'product_page', label: 'Page produit', description: 'Texte affiché sur la page de détail des produits' },
  { value: 'footer', label: 'Pied de page', description: 'Slogan dans le footer du site' },
]

function PositionBadge({ position }: { position: string }) {
  switch (position) {
    case 'hero':
      return <Badge className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90">Bannière</Badge>
    case 'promo_bar':
      return <Badge className="bg-[#c8a951] text-white hover:bg-[#c8a951]/90">Promo</Badge>
    case 'product_page':
      return <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200">Produit</Badge>
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

// Helper to detect YouTube/Vimeo URLs and extract embed URL
function getEmbedUrl(url: string): string | null {
  if (!url) return null
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

function isExternalVideo(url: string): boolean {
  return !!getEmbedUrl(url)
}

function isDirectVideo(url: string): boolean {
  if (!url) return false
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

export default function CatchphraseSection() {
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Catchphrase | null>(null)
  const [deletingItem, setDeletingItem] = useState<Catchphrase | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [positionFilter, setPositionFilter] = useState('all')

  // Hero video state
  const [heroVideoUrl, setHeroVideoUrl] = useState('')
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(false)
  const [heroVideoUploading, setHeroVideoUploading] = useState(false)
  const [heroVideoSaving, setHeroVideoSaving] = useState(false)
  const [heroVideoLoaded, setHeroVideoLoaded] = useState(false)

  const { data: catchphrases, isLoading } = useQuery({
    queryKey: ['admin-catchphrases'],
    queryFn: () => fetch('/api/catchphrases?all=true').then(r => r.json()).then(d => d.data as Catchphrase[]),
  })

  // Fetch hero video settings
  useEffect(() => {
    const fetchVideoSettings = async () => {
      try {
        const res = await fetch('/api/site-settings')
        if (res.ok) {
          const data = await res.json()
          const settings = data.data || data.settings || data
          if (settings.hero_video_url) setHeroVideoUrl(settings.hero_video_url)
          if (settings.hero_video_enabled === 'true') setHeroVideoEnabled(true)
          setHeroVideoLoaded(true)
        }
      } catch { /* ignore */ }
    }
    fetchVideoSettings()
  }, [])

  // Sort by position then sortOrder
  const sortedCatchphrases = useMemo(() => {
    if (!catchphrases) return []
    const filtered = positionFilter === 'all'
      ? catchphrases
      : catchphrases.filter(c => c.position === positionFilter)
    return [...filtered].sort((a, b) => {
      if (a.position !== b.position) return a.position.localeCompare(b.position)
      return a.sortOrder - b.sortOrder
    })
  }, [catchphrases, positionFilter])

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

  const handleReorder = async (item: Catchphrase, direction: 'up' | 'down') => {
    if (!catchphrases) return
    const samePosition = catchphrases
      .filter(c => c.position === item.position)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    
    const currentIndex = samePosition.findIndex(c => c.id === item.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= samePosition.length) return
    
    const targetItem = samePosition[targetIndex]
    
    try {
      await Promise.all([
        fetch(`/api/catchphrases/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetItem.sortOrder }),
        }),
        fetch(`/api/catchphrases/${targetItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: item.sortOrder }),
        }),
      ])
      queryClient.invalidateQueries({ queryKey: ['admin-catchphrases'] })
      toast.success('Ordre mis à jour')
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const saveHeroVideo = async () => {
    setHeroVideoSaving(true)
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'hero_video_url', value: heroVideoUrl },
            { key: 'hero_video_enabled', value: heroVideoEnabled ? 'true' : 'false' },
          ],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Vidéo hero sauvegardée')
        queryClient.invalidateQueries({ queryKey: ['site-settings'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setHeroVideoSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="catchphrases">
        <TabsList>
          <TabsTrigger value="catchphrases" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Megaphone className="h-3.5 w-3.5" />
            Phrases publicitaires
          </TabsTrigger>
          <TabsTrigger value="hero-video" className="gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-teal-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">
            <Video className="h-3.5 w-3.5" />
            Vidéo Hero
          </TabsTrigger>
        </TabsList>

        {/* ─── Phrases publicitaires Tab ─── */}
        <TabsContent value="catchphrases" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-gray-900">{catchphrases?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Inactives</p>
                <p className="text-2xl font-bold text-gray-900">{(catchphrases?.length ?? 0) - totalActive}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Positions</p>
                <p className="text-2xl font-bold text-gray-900">{POSITIONS.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Position explanation */}
          <Card className="bg-gray-50/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Positions disponibles</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POSITIONS.map(p => (
                  <div key={p.value} className="flex items-start gap-2">
                    <PositionBadge position={p.value} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Phrases publicitaires</h3>
              <p className="text-sm text-muted-foreground">Gérer les textes promotionnels du site</p>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Toutes les positions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les positions</SelectItem>
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : sortedCatchphrases.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Texte</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden sm:table-cell">Ordre</TableHead>
                        <TableHead className="hidden md:table-cell">Créé le</TableHead>
                        <TableHead className="w-36">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCatchphrases.map((c, i) => (
                        <TableRow key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <button
                                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                                onClick={() => handleReorder(c, 'up')}
                                disabled={i === 0 || (i > 0 && sortedCatchphrases[i - 1].position !== c.position)}
                                title="Monter"
                              >
                                <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                              </button>
                              <button
                                className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                                onClick={() => handleReorder(c, 'down')}
                                disabled={i === sortedCatchphrases.length - 1 || (i < sortedCatchphrases.length - 1 && sortedCatchphrases[i + 1].position !== c.position)}
                                title="Descendre"
                              >
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                              </button>
                            </div>
                          </TableCell>
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
                                className={`h-8 w-8 ${c.isActive ? 'text-gray-500 hover:text-orange-600' : 'text-orange-500 hover:text-orange-700'}`}
                                onClick={() => handleToggle(c)}
                                title={c.isActive ? 'Désactiver' : 'Activer'}
                              >
                                {c.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              </Button>
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
        </TabsContent>

        {/* ─── Vidéo Hero Tab ─── */}
        <TabsContent value="hero-video" className="space-y-6 mt-6">
          <Card className="shadow-md shadow-gray-200/50 border-gray-200/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Video className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Vidéo Hero (Page d&apos;accueil)</CardTitle>
                  <CardDescription>Vidéo présentant la société, affichée dans la section hero de la page principale.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Activer la vidéo hero</p>
                    <p className="text-sm text-muted-foreground">Remplace l&apos;image hero par une vidéo sur la page d&apos;accueil</p>
                  </div>
                  <Switch checked={heroVideoEnabled} onCheckedChange={setHeroVideoEnabled} />
                </div>

                {/* Video preview */}
                {heroVideoUrl ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Aperçu de la vidéo</Label>
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video">
                      {isExternalVideo(heroVideoUrl) ? (
                        <iframe
                          src={getEmbedUrl(heroVideoUrl)!}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title="Vidéo hero preview"
                        />
                      ) : isDirectVideo(heroVideoUrl) ? (
                        <video
                          src={heroVideoUrl}
                          className="w-full h-full object-cover"
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Video className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Format de vidéo non reconnu</p>
                            <p className="text-xs text-gray-400 mt-1">URLs supportées: YouTube, Vimeo, MP4, WebM</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Play className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[400px]">{heroVideoUrl}</span>
                      {isExternalVideo(heroVideoUrl) && (
                        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                          <Youtube className="h-3 w-3 mr-1" />
                          {heroVideoUrl.includes('youtube') || heroVideoUrl.includes('youtu.be') ? 'YouTube' : 'Vimeo'}
                        </Badge>
                      )}
                      {isDirectVideo(heroVideoUrl) && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-xs">
                          Direct
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setHeroVideoUrl('')}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Retirer la vidéo
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                    <div className="text-center">
                      <Video className="h-16 w-16 mx-auto text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400 font-medium">Aucune vidéo hero configurée</p>
                      <p className="text-xs text-gray-300 mt-1">Uploadez un fichier ou collez un lien YouTube/Vimeo</p>
                    </div>
                  </div>
                )}

                {/* Upload section */}
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* File upload */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Uploader un fichier vidéo</Label>
                      <label className="flex cursor-pointer">
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm font-medium text-gray-600 hover:text-emerald-700">
                          {heroVideoUploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {heroVideoUploading ? 'Upload en cours...' : 'Choisir un fichier vidéo'}
                        </div>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setHeroVideoUploading(true)
                            try {
                              const formData = new FormData()
                              formData.append('file', file)
                              const res = await fetch('/api/upload', { method: 'POST', body: formData })
                              const data = await res.json()
                              if (data.data?.url) {
                                setHeroVideoUrl(data.data.url)
                                toast.success('Vidéo uploadée avec succès')
                              } else {
                                toast.error(data.error || 'Erreur lors de l\'upload')
                              }
                            } catch {
                              toast.error('Erreur de connexion')
                            } finally {
                              setHeroVideoUploading(false)
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">MP4, WebM, OGG — Max 50 MB</p>
                    </div>

                    {/* URL input */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Ou coller une URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={isExternalVideo(heroVideoUrl) || isDirectVideo(heroVideoUrl) ? heroVideoUrl : ''}
                          onChange={(e) => setHeroVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... ou URL .mp4"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Youtube className="h-3 w-3 text-red-500" />
                          YouTube
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <ExternalLink className="h-3 w-3 text-blue-500" />
                          Vimeo
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Video className="h-3 w-3 text-gray-500" />
                          MP4/WebM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info box */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                  <p className="text-sm font-medium text-emerald-800 mb-1">💡 Conseil</p>
                  <p className="text-xs text-emerald-600 leading-relaxed">
                    Pour une meilleure expérience utilisateur, utilisez des vidéos courtes (30-60 secondes) qui présentent votre entreprise. 
                    Les vidéos YouTube/Vimeo sont recommandées pour les vidéos longues car elles se chargent plus rapidement. 
                    Les fichiers MP4/WebM uploadés sont idéaux pour les clips courts en boucle.
                  </p>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={saveHeroVideo}
                    disabled={heroVideoSaving}
                  >
                    {heroVideoSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sauvegarder la vidéo hero
                  </Button>
                  {heroVideoEnabled && heroVideoUrl && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Play className="h-3 w-3 mr-1" />
                      La vidéo sera visible sur la page d&apos;accueil
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <Label htmlFor="cp-sort">Ordre d&apos;affichage</Label>
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
          <Button onClick={onSubmit} disabled={loading} className="bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white">
            {loading ? 'Enregistrement...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
