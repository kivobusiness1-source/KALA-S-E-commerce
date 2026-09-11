'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Handshake,
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Power,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  CalendarDays,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Affiliate, Commission, AffiliatePayout, CommissionStatus, AffiliateProductTrack } from './types'

// ── Helpers ──────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  validated: 'Validée',
  paid: 'Payée',
  cancelled: 'Annulée',
}

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  validated: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paid: 'bg-sky-100 text-sky-700 border-sky-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Complété',
  failed: 'Échoué',
}

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
}

// ── Partners List Component ──────────────────────────────

function PartnersList({ onSelectPartner }: { onSelectPartner: (id: string) => void }) {
  const [partners, setPartners] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const PER_PAGE = 20

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '', email: '', phone: '', code: '', company: '', commissionRate: '5', password: '',
  })
  const [createLoading, setCreateLoading] = useState(false)

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/partners?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchPartners() }, [fetchPartners])

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.code || !createForm.password) {
      toast.error('Nom, email, code et mot de passe sont requis')
      return
    }
    try {
      setCreateLoading(true)
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          commissionRate: parseFloat(createForm.commissionRate) || 5,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Partenaire créé avec succès')
        setCreateOpen(false)
        setCreateForm({ name: '', email: '', phone: '', code: '', company: '', commissionRate: '5', password: '' })
        fetchPartners()
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleActive = async (partner: Affiliate) => {
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partner.id, isActive: !partner.isActive }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(partner.isActive ? 'Partenaire désactivé' : 'Partenaire activé')
        fetchPartners()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Liste des partenaires</h3>
          <p className="text-sm text-gray-500">{total} partenaire{total > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 w-[220px] h-9 text-sm"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5 bg-[#1a1a1a] hover:bg-[#333] text-white">
            <Plus className="w-4 h-4" />
            Créer
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : partners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead className="text-right">Taux</TableHead>
                    <TableHead className="text-right">Gains totaux</TableHead>
                    <TableHead className="text-right">En attente</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-xs text-gray-500">{p.email}</TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{p.code}</code>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{p.company || '—'}</TableCell>
                      <TableCell className="text-right text-sm">{p.commissionRate}%</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-emerald-600">{formatFCFA(p.totalEarnings)}</TableCell>
                      <TableCell className="text-right text-sm text-orange-600">{formatFCFA(p.pendingEarnings)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                          {p.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onSelectPartner(p.id)} title="Voir détails">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(p)} title={p.isActive ? 'Désactiver' : 'Activer'}>
                            <Power className={`w-4 h-4 ${p.isActive ? 'text-orange-500' : 'text-emerald-500'}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Handshake className="w-10 h-10 mb-2" />
              <p className="text-sm">Aucun partenaire trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} / {totalPages}</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Partner Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un partenaire</DialogTitle>
            <DialogDescription>Ajoutez un nouveau partenaire au programme d&apos;affiliation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nom *</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nom complet" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Code partenaire *</Label>
                <Input value={createForm.code} onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="KALA-XXX" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taux (%)</Label>
                <Input type="number" value={createForm.commissionRate} onChange={(e) => setCreateForm((f) => ({ ...f, commissionRate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Téléphone</Label>
                <Input value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+242..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entreprise</Label>
                <Input value={createForm.company} onChange={(e) => setCreateForm((f) => ({ ...f, company: e.target.value }))} placeholder="Société" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mot de passe *</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 caractères" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createLoading} className="bg-[#1a1a1a] hover:bg-[#333] text-white">
              {createLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Partner Detail Component ─────────────────────────────

function PartnerDetail({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const [partner, setPartner] = useState<Affiliate | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([])
  const [loading, setLoading] = useState(true)
  const [commissionPage, setCommissionPage] = useState(1)
  const [commissionTotal, setCommissionTotal] = useState(0)
  const [commissionTotalPages, setCommissionTotalPages] = useState(1)
  const COMMISSIONS_PER_PAGE = 20

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '', commissionRate: '5', bankInfo: '', isActive: true })
  const [editLoading, setEditLoading] = useState(false)

  // Payout dialog
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'mobile_money', reference: '' })
  const [payoutLoading, setPayoutLoading] = useState(false)

  // Commission breakdown
  const [breakdown, setBreakdown] = useState({ pending: 0, validated: 0, paid: 0, cancelled: 0 })

  // Product tracking
  const [productTracks, setProductTracks] = useState<AffiliateProductTrack[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)

  const fetchProductTracks = useCallback(async () => {
    try {
      setTracksLoading(true)
      const res = await fetch(`/api/admin/partner-products?affiliateId=${partnerId}`)
      if (res.ok) {
        const data = await res.json()
        setProductTracks(data.data || [])
      }
    } catch {
      // silent
    } finally {
      setTracksLoading(false)
    }
  }, [partnerId])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [partnerRes, commRes, payoutRes] = await Promise.all([
        fetch(`/api/admin/partners?id=${partnerId}`),
        fetch(`/api/commissions?affiliateId=${partnerId}&page=${commissionPage}&limit=${COMMISSIONS_PER_PAGE}`),
        fetch(`/api/admin/partners?payouts=1&affiliateId=${partnerId}`),
      ])

      if (partnerRes.ok) {
        const pData = await partnerRes.json()
        setPartner(pData.partner || null)
        if (pData.partner) {
          setEditForm({
            name: pData.partner.name,
            email: pData.partner.email,
            phone: pData.partner.phone || '',
            company: pData.partner.company || '',
            commissionRate: String(pData.partner.commissionRate),
            bankInfo: pData.partner.bankInfo || '',
            isActive: pData.partner.isActive,
          })
        }
      }

      if (commRes.ok) {
        const cData = await commRes.json()
        setCommissions(cData.data?.commissions || [])
        setCommissionTotal(cData.data?.total || 0)
        setCommissionTotalPages(cData.data?.totalPages || 1)
        // Compute breakdown from summary
        const summary = cData.data?.summary || []
        const bd = { pending: 0, validated: 0, paid: 0, cancelled: 0 }
        for (const s of summary) {
          if (s.status in bd) bd[s.status as keyof typeof bd] = s.total
        }
        setBreakdown(bd)
      }

      if (payoutRes.ok) {
        const payData = await payoutRes.json()
        setPayouts(payData.payouts || [])
      }
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [partnerId, commissionPage])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchProductTracks() }, [fetchProductTracks])

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true)
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: partnerId,
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          company: editForm.company,
          commissionRate: parseFloat(editForm.commissionRate) || 5,
          bankInfo: editForm.bankInfo,
          isActive: editForm.isActive,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Partenaire mis à jour')
        setEditing(false)
        fetchData()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setEditLoading(false)
    }
  }

  const handleCommissionAction = async (commissionId: string, status: CommissionStatus) => {
    try {
      const res = await fetch('/api/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commissionId, status }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Commission ${COMMISSION_STATUS_LABELS[status]}`)
        fetchData()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  const handleCreatePayout = async () => {
    const amount = parseFloat(payoutForm.amount)
    if (!amount || amount <= 0) {
      toast.error('Montant invalide')
      return
    }
    try {
      setPayoutLoading(true)
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: partnerId,
          action: 'createPayout',
          payoutAmount: amount,
          payoutMethod: payoutForm.method,
          payoutReference: payoutForm.reference,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Paiement créé avec succès')
        setPayoutOpen(false)
        setPayoutForm({ amount: '', method: 'mobile_money', reference: '' })
        fetchData()
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setPayoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Partenaire introuvable</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Retour</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="gap-1.5 text-gray-600">
        <ArrowLeft className="w-4 h-4" />
        Retour à la liste
      </Button>

      {/* Partner Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Handshake className="w-5 h-5 text-emerald-600" />
              {partner.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={partner.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>
                {partner.isActive ? 'Actif' : 'Inactif'}
              </Badge>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveEdit} disabled={editLoading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <Save className="w-3.5 h-3.5" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Nom</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Téléphone</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Entreprise</Label>
                <Input value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Taux de commission (%)</Label>
                <Input type="number" step="0.5" value={editForm.commissionRate} onChange={(e) => setEditForm((f) => ({ ...f, commissionRate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Infos bancaires</Label>
                <Input value={editForm.bankInfo} onChange={(e) => setEditForm((f) => ({ ...f, bankInfo: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
                <Switch checked={editForm.isActive} onCheckedChange={(v) => setEditForm((f) => ({ ...f, isActive: v }))} />
                <Label className="text-sm">{editForm.isActive ? 'Partenaire actif' : 'Partenaire inactif'}</Label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Code :</span> <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{partner.code}</code></div>
              <div><span className="text-gray-500">Email :</span> {partner.email}</div>
              <div><span className="text-gray-500">Téléphone :</span> {partner.phone || '—'}</div>
              <div><span className="text-gray-500">Entreprise :</span> {partner.company || '—'}</div>
              <div><span className="text-gray-500">Taux :</span> <strong>{partner.commissionRate}%</strong></div>
              <div><span className="text-gray-500">Infos bancaires :</span> {partner.bankInfo || '—'}</div>
              <div><span className="text-gray-500">Inscrit le :</span> {formatDate(partner.createdAt)}</div>
              <div><span className="text-gray-500">Filleuls :</span> {partner.totalReferrals}</div>
              <div><span className="text-gray-500">Commandes :</span> {partner.totalOrders}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Commission totale</p>
            <p className="text-lg font-bold text-gray-900">{formatFCFA(partner.totalEarnings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-yellow-600 font-medium flex items-center gap-1 mb-1"><Clock className="w-3 h-3" /> En attente</p>
            <p className="text-lg font-bold text-yellow-600">{formatFCFA(breakdown.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3" /> Validée</p>
            <p className="text-lg font-bold text-emerald-600">{formatFCFA(breakdown.validated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-sky-600 font-medium flex items-center gap-1 mb-1"><Wallet className="w-3 h-3" /> Payée</p>
            <p className="text-lg font-bold text-sky-600">{formatFCFA(breakdown.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mb-1"><XCircle className="w-3 h-3" /> Annulée</p>
            <p className="text-lg font-bold text-red-600">{formatFCFA(breakdown.cancelled)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Suivi par produit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-4 h-4 text-amber-600" />
            Suivi par produit
          </CardTitle>
          <CardDescription>Tracking des commissions échelonnées (1er mois / mois 2+)</CardDescription>
        </CardHeader>
        <CardContent>
          {tracksLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : productTracks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">1er mois (FCFA/unité)</TableHead>
                    <TableHead className="text-right">Mois 2+ (FCFA/unité)</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead className="text-right">Mois actuel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productTracks.map((t) => {
                    const p = t.product
                    const m1 = p?.commissionMonth1PerUnit ?? p?.commissionPerUnit ?? null
                    const m2Plus = p?.commissionMonth2PlusPerUnit ?? p?.commissionPerUnit ?? null
                    const isEmailTrack = t.customerId.startsWith('email:')
                    const customerLabel = isEmailTrack ? t.customerId.replace('email:', '') : t.customerId
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p?.image ? (
                              <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{p?.name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-[120px] truncate" title={customerLabel}>
                          {customerLabel}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {m1 !== null ? formatFCFA(m1) : <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {m2Plus !== null ? formatFCFA(m2Plus) : <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(t.firstCommissionAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200">
                            Mois {t.currentMonth ?? 1}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <CalendarDays className="w-6 h-6 mb-1.5" />
              <p className="text-sm">Aucun suivi par produit</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Commissions
              </CardTitle>
              <CardDescription>{commissionTotal} commission{commissionTotal > 1 ? 's' : ''}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Vente</TableHead>
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{c.order?.orderNumber || '—'}</TableCell>
                      <TableCell className="text-sm max-w-[120px] truncate">
                        {c.productName}
                        {c.variantName && <span className="text-gray-400 ml-1">({c.variantName})</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">{c.quantity}</TableCell>
                      <TableCell className="text-right text-sm">{formatFCFA(c.totalSaleAmount)}</TableCell>
                      <TableCell>
                        {c.commissionMonth === 1 ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">Mois 1</Badge>
                        ) : c.commissionMonth && c.commissionMonth >= 2 ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-emerald-200">Mois 2+</Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-emerald-600">{formatFCFA(c.commissionTotal)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${COMMISSION_STATUS_COLORS[c.status] || ''}`}>
                          {COMMISSION_STATUS_LABELS[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(c.id, 'validated')} title="Valider" className="h-7 w-7 p-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(c.id, 'cancelled')} title="Annuler" className="h-7 w-7 p-0">
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                          {c.status === 'validated' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(c.id, 'paid')} title="Marquer payée" className="h-7 w-7 p-0">
                                <Wallet className="w-3.5 h-3.5 text-sky-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(c.id, 'cancelled')} title="Annuler" className="h-7 w-7 p-0">
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {commissionTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-gray-500">Page {commissionPage} / {commissionTotalPages}</p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={commissionPage <= 1} onClick={() => setCommissionPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={commissionPage >= commissionTotalPages} onClick={() => setCommissionPage((p) => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <CreditCard className="w-6 h-6 mb-1.5" />
              <p className="text-sm">Aucune commission</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="w-4 h-4 text-sky-600" />
                Historique des paiements
              </CardTitle>
              <CardDescription>{payouts.length} paiement{payouts.length > 1 ? 's' : ''}</CardDescription>
            </div>
            <Button onClick={() => setPayoutOpen(true)} size="sm" className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white">
              <DollarSign className="w-4 h-4" />
              Créer un paiement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-sky-600">{formatFCFA(p.amount)}</TableCell>
                      <TableCell className="text-sm">{p.method}</TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">{p.reference || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PAYOUT_STATUS_COLORS[p.status] || ''}`}>
                          {PAYOUT_STATUS_LABELS[p.status] || p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <Wallet className="w-6 h-6 mb-1.5" />
              <p className="text-sm">Aucun paiement effectué</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Payout Dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un paiement</DialogTitle>
            <DialogDescription>Versement de commission pour {partner.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Montant (FCFA) *</Label>
              <Input type="number" value={payoutForm.amount} onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))} placeholder="Ex: 25000" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Méthode</Label>
              <Select value={payoutForm.method} onValueChange={(v) => setPayoutForm((f) => ({ ...f, method: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Référence</Label>
              <Input value={payoutForm.reference} onChange={(e) => setPayoutForm((f) => ({ ...f, reference: e.target.value }))} placeholder="N° de transaction" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>Annuler</Button>
            <Button onClick={handleCreatePayout} disabled={payoutLoading} className="bg-sky-600 hover:bg-sky-700 text-white">
              {payoutLoading && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Créer le paiement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Main Section Component ───────────────────────────────

export default function PartnersSection() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)

  if (selectedPartnerId) {
    return <PartnerDetail partnerId={selectedPartnerId} onBack={() => setSelectedPartnerId(null)} />
  }

  return <PartnersList onSelectPartner={setSelectedPartnerId} />
}
