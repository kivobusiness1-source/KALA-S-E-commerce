'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAffiliateAuthStore } from '@/stores/affiliate-auth-store'
import {
  Users,
  DollarSign,
  Copy,
  Share2,
  TrendingUp,
  LogOut,
  Clock,
  CheckCircle2,
  ShoppingCart,
  Percent,
  BarChart3,
  Wallet,
  Loader2,
  CalendarDays,
  Package,
  CreditCard,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowDownToLine,
  Smartphone,
  Building2,
  Timer,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────

interface MonthlyEarning {
  month: string
  earnings: number
}

interface CommissionRow {
  id: string
  orderNumber: string
  orderStatus: string
  productName: string
  variantName: string | null
  quantity: number
  totalSaleAmount: number
  commissionPerUnit: number
  commissionTotal: number
  commissionMonth: number | null
  status: string
  createdAt: string
  validatedAt: string | null
  paidAt: string | null
}

interface CommissionBreakdown {
  pending: { count: number; total: number }
  validated: { count: number; total: number }
  paid: { count: number; total: number }
  cancelled: { count: number; total: number }
}

interface SalesSummary {
  totalOrders: number
  totalRevenue: number
  totalProductsSold: number
}

interface Referral {
  id: string
  customerName: string
  orderAmount: number
  commission: number
  status: string
  date: string
}

interface Payout {
  id: string
  amount: number
  method: string
  status: string
  date: string
}

interface FundTransferRequestRow {
  id: string
  amount: number
  method: string
  phoneNumber: string | null
  bankInfo: string | null
  status: string
  scheduledAt: string
  processedAt: string | null
  rejectionReason: string | null
  notes: string | null
  createdAt: string
}

interface AffiliateStats {
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  totalOrders: number
  commissionRate: number
  recentReferrals: Referral[]
  recentPayouts: Payout[]
  monthlyEarnings: MonthlyEarning[]
  code: string
  commissionBreakdown: CommissionBreakdown
  recentCommissions: CommissionRow[]
  salesSummary: SalesSummary
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all'

// ── Helpers ──────────────────────────────────────────────

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getPeriodDates(period: PeriodFilter): { from?: Date; to: Date } {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  switch (period) {
    case 'today': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      return { from, to }
    }
    case 'week': {
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0)
      return { from, to }
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      return { from, to }
    }
    default:
      return { to }
  }
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

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  cancelled: 'Annulé',
  processing: 'En cours',
  completed: 'Complété',
  failed: 'Échoué',
  validated: 'Validée',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  processing: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  validated: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

// ── Component ────────────────────────────────────────────

interface AffiliateDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogout?: () => void
}

export function AffiliateDashboard({ open, onOpenChange, onLogout }: AffiliateDashboardProps) {
  const { affiliate, logout, isLoading } = useAffiliateAuthStore()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [commissionPage, setCommissionPage] = useState(1)
  const COMMISSIONS_PER_PAGE = 20

  // All commissions (fetched from stats) – client-side pagination & period filter
  const [allCommissions, setAllCommissions] = useState<CommissionRow[]>([])

  // Fund transfer state
  const [transferRequests, setTransferRequests] = useState<FundTransferRequestRow[]>([])
  const [transferLoading, setTransferLoading] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferMethod, setTransferMethod] = useState<'mobile_money' | 'bank_transfer' | 'cash'>('mobile_money')
  const [transferPhone, setTransferPhone] = useState('')
  const [transferBankInfo, setTransferBankInfo] = useState('')
  const [transferSubmitting, setTransferSubmitting] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const res = await fetch('/api/affiliate-stats?allCommissions=1')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        setAllCommissions(data.recentCommissions || [])
      }
    } catch {
      // Use empty defaults
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Fetch transfer requests
  const fetchTransferRequests = useCallback(async () => {
    try {
      setTransferLoading(true)
      const res = await fetch('/api/affiliate-transfer')
      if (res.ok) {
        const data = await res.json()
        setTransferRequests(data.transfers || [])
      }
    } catch {
      // silent
    } finally {
      setTransferLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchTransferRequests()
    }
  }, [open, fetchTransferRequests])

  // Countdown timer for scheduled transfers (force re-render every second)
  const [countdownTick, setCountdownTick] = useState(0)
  useEffect(() => {
    const hasScheduled = transferRequests.some((t) => t.status === 'scheduled' || t.status === 'pending')
    if (!hasScheduled) return
    const interval = setInterval(() => setCountdownTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [transferRequests, countdownTick])

  const affiliateLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${affiliate?.code || ''}`
    : ''

  const handleCopyCode = async () => {
    if (!affiliate?.code) return
    try {
      await navigator.clipboard.writeText(affiliate.code)
      setCopied(true)
      toast.success('Code copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const handleCopyLink = async () => {
    if (!affiliateLink) return
    try {
      await navigator.clipboard.writeText(affiliateLink)
      toast.success('Lien copié !')
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const handleShare = async () => {
    if (!affiliateLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: "KALA'S - Produits d'Hygiène",
          text: `Commandez vos produits d'hygiène KALA'S avec mon code partenaire : ${affiliate?.code}`,
          url: affiliateLink,
        })
      } catch {
        // User cancelled share
      }
    } else {
      await handleCopyLink()
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    onLogout?.()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-gray-500">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  if (!affiliate) return null

  // ── Computed values ──────────────────────────────────────

  const monthlyEarnings = stats?.monthlyEarnings || []
  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.earnings), 1)
  const recentReferrals = stats?.recentReferrals || []
  const recentPayouts = stats?.recentPayouts || []
  const breakdown = stats?.commissionBreakdown || { pending: { count: 0, total: 0 }, validated: { count: 0, total: 0 }, paid: { count: 0, total: 0 }, cancelled: { count: 0, total: 0 } }
  const salesSummary = stats?.salesSummary || { totalOrders: 0, totalRevenue: 0, totalProductsSold: 0 }

  // Period-filtered commissions
  const periodCommissions = (() => {
    if (period === 'all') return allCommissions
    const { from, to } = getPeriodDates(period)
    return allCommissions.filter((c) => {
      const d = new Date(c.createdAt)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  })()

  // Period-filtered sales stats
  const periodSales = (() => {
    if (period === 'all') return salesSummary
    const { from } = getPeriodDates(period)
    const filtered = periodCommissions
    const totalRevenue = filtered.reduce((s, c) => s + c.totalSaleAmount, 0)
    const totalProducts = filtered.reduce((s, c) => s + c.quantity, 0)
    const orderSet = new Set(filtered.map((c) => c.orderNumber))
    return {
      totalOrders: orderSet.size,
      totalRevenue,
      totalProductsSold: totalProducts,
    }
  })()

  // Commission totals for the period
  const periodCommissionTotal = periodCommissions.reduce((s, c) => s + c.commissionTotal, 0)
  const periodPending = periodCommissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.commissionTotal, 0)
  const periodValidated = periodCommissions.filter((c) => c.status === 'validated').reduce((s, c) => s + c.commissionTotal, 0)
  const periodPaid = periodCommissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.commissionTotal, 0)
  const periodCancelled = periodCommissions.filter((c) => c.status === 'cancelled').reduce((s, c) => s + c.commissionTotal, 0)
  const soldeDisponible = periodValidated // validated but not yet paid

  // Paginated commissions
  const totalCommissionPages = Math.max(1, Math.ceil(periodCommissions.length / COMMISSIONS_PER_PAGE))
  const paginatedCommissions = periodCommissions.slice(
    (commissionPage - 1) * COMMISSIONS_PER_PAGE,
    commissionPage * COMMISSIONS_PER_PAGE
  )

  // ── Render ───────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 z-50 flex flex-col w-full h-full max-w-full sm:max-w-full translate-x-0 translate-y-0 rounded-none sm:rounded-none border-0 shadow-none p-0 overflow-y-auto bg-background">
        <DialogHeader className="px-6 pt-6 pb-0 sr-only">
          <DialogTitle>Espace Partenaire</DialogTitle>
        </DialogHeader>
    <div className="w-full max-w-6xl mx-auto space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">Espace Partenaire</h2>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenue, <span className="font-medium text-gray-700">{affiliate.name}</span>
            {affiliate.company && (
              <span className="text-gray-400"> · {affiliate.company}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <Select value={period} onValueChange={(v) => { setPeriod(v as PeriodFilter); setCommissionPage(1) }}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <CalendarDays className="w-4 h-4 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-gray-500 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>

      {/* Affiliate Code Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                Votre Code Partenaire
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-[#1a1a1a] tracking-wider">
                {affiliate.code}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Partagez ce code avec vos filleuls pour gagner des commissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2 bg-white hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copié !' : 'Copier'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 bg-white hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4" />
                Lien
              </Button>
              <Button
                size="sm"
                onClick={handleShare}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Gains totaux</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatFCFA(stats?.totalEarnings ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">En attente</p>
            <p className="text-lg font-bold text-orange-600">
              {formatFCFA(stats?.pendingEarnings ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Gains payés</p>
            <p className="text-lg font-bold text-sky-600">
              {formatFCFA(stats?.paidEarnings ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Percent className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Commission</p>
            <p className="text-lg font-bold text-purple-600">
              {affiliate.commissionRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Filleuls</p>
            <p className="text-lg font-bold text-rose-600">
              {stats?.totalReferrals ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Commandes</p>
            <p className="text-lg font-bold text-amber-600">
              {stats?.totalOrders ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Aperçu / Ventes / Commissions */}
      <Tabs defaultValue="apercu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apercu" className="gap-1.5">
            <Eye className="w-4 h-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="ventes" className="gap-1.5">
            <ShoppingCart className="w-4 h-4" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="retraits" className="gap-1.5">
            <ArrowDownToLine className="w-4 h-4" />
            Retraits
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Aperçu ────────────────────────────────── */}
        <TabsContent value="apercu" className="space-y-6">
          {/* Commission Detail Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Détail des commissions
              </CardTitle>
              <CardDescription>Répartition par statut</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">Commission totale</p>
                  <p className="text-lg font-bold text-gray-900">{formatFCFA(periodCommissionTotal)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> En attente
                  </p>
                  <p className="text-lg font-bold text-yellow-600">{formatFCFA(periodPending)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validée
                  </p>
                  <p className="text-lg font-bold text-emerald-600">{formatFCFA(periodValidated)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-sky-600 font-medium flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Payée
                  </p>
                  <p className="text-lg font-bold text-sky-600">{formatFCFA(periodPaid)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Annulée
                  </p>
                  <p className="text-lg font-bold text-red-600">{formatFCFA(periodCancelled)}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Solde disponible (validée, non payée)</p>
                  <p className="text-xl font-bold text-emerald-600">{formatFCFA(soldeDisponible)}</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {breakdown.validated.count} commission{breakdown.validated.count > 1 ? 's' : ''} à payer
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Earnings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Gains mensuels
              </CardTitle>
              <CardDescription>Les 6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : monthlyEarnings.length > 0 ? (
                <div className="space-y-3">
                  {monthlyEarnings.slice(-6).map((entry) => {
                    const pct = Math.max((entry.earnings / maxEarning) * 100, 2)
                    return (
                      <div key={entry.month} className="flex items-center gap-3">
                        <span className="w-12 text-xs text-gray-500 font-medium shrink-0">
                          {entry.month}
                        </span>
                        <div className="flex-1 h-8 bg-gray-100 rounded-md overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-md transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-28 text-xs font-semibold text-right text-gray-700 shrink-0">
                          {formatFCFA(entry.earnings)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <TrendingUp className="w-8 h-8 mb-2" />
                  <p className="text-sm">Aucune donnée mensuelle disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Referrals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4 text-rose-500" />
                  Derniers filleuls
                </CardTitle>
                <CardDescription>Commandes via votre code partenaire</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : recentReferrals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReferrals.map((ref) => (
                        <TableRow key={ref.id}>
                          <TableCell className="font-medium text-sm max-w-[100px] truncate">
                            {ref.customerName}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatFCFA(ref.orderAmount)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-emerald-600 font-semibold">
                            {formatFCFA(ref.commission)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[ref.status] || ''}`}
                            >
                              {STATUS_LABELS[ref.status] || ref.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-400">
                            {formatDate(ref.date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                    <Users className="w-6 h-6 mb-1.5" />
                    <p className="text-sm">Aucun filleul pour le moment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payouts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="w-4 h-4 text-sky-500" />
                  Derniers paiements
                </CardTitle>
                <CardDescription>Vos versements de commissions</CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center justify-center h-24">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                  </div>
                ) : recentPayouts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="text-right text-sm font-semibold text-sky-600">
                            {formatFCFA(payout.amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {payout.method}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[payout.status] || ''}`}
                            >
                              {STATUS_LABELS[payout.status] || payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-400">
                            {formatDate(payout.date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-400">
                    <Wallet className="w-6 h-6 mb-1.5" />
                    <p className="text-sm">Aucun paiement pour le moment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: Ventes ────────────────────────────────── */}
        <TabsContent value="ventes" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total commandes</p>
                    <p className="text-2xl font-bold text-amber-700">{periodSales.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Produits vendus</p>
                    <p className="text-2xl font-bold text-emerald-700">{periodSales.totalProductsSold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Chiffre d&apos;affaires</p>
                    <p className="text-2xl font-bold text-sky-700">{formatFCFA(periodSales.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent sales table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Historique des ventes
              </CardTitle>
              <CardDescription>
                {periodCommissions.length} vente{periodCommissions.length > 1 ? 's' : ''} trouvée{periodCommissions.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : periodCommissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Commande</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Montant vente</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCommissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {c.orderNumber}
                          </TableCell>
                          <TableCell className="text-sm max-w-[160px] truncate">
                            {c.productName}
                            {c.variantName && <span className="text-gray-400 ml-1">({c.variantName})</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm">{c.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatFCFA(c.totalSaleAmount)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-emerald-600">
                            {formatFCFA(c.commissionTotal)}
                            {c.commissionMonth != null && (
                              <span className="ml-1.5 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] font-normal text-sky-700">
                                {c.commissionMonth === 1 ? '1er mois' : `Mois ${c.commissionMonth}`}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  {totalCommissionPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-gray-500">
                        Page {commissionPage} / {totalCommissionPages}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPage <= 1}
                          onClick={() => setCommissionPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPage >= totalCommissionPages}
                          onClick={() => setCommissionPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <ShoppingCart className="w-8 h-8 mb-2" />
                  <p className="text-sm">Aucune vente pour cette période</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Commissions ──────────────────────────── */}
        <TabsContent value="commissions" className="space-y-6">
          {/* Commission summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-gray-500 font-medium">En attente</p>
                </div>
                <p className="text-lg font-bold text-yellow-600">{formatFCFA(periodPending)}</p>
                <p className="text-[10px] text-gray-400">{periodCommissions.filter((c) => c.status === 'pending').length} commission(s)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-gray-500 font-medium">Validée</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{formatFCFA(periodValidated)}</p>
                <p className="text-[10px] text-gray-400">{periodCommissions.filter((c) => c.status === 'validated').length} commission(s)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-sky-600" />
                  <p className="text-xs text-gray-500 font-medium">Payée</p>
                </div>
                <p className="text-lg font-bold text-sky-600">{formatFCFA(periodPaid)}</p>
                <p className="text-[10px] text-gray-400">{periodCommissions.filter((c) => c.status === 'paid').length} commission(s)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-gray-500 font-medium">Annulée</p>
                </div>
                <p className="text-lg font-bold text-red-600">{formatFCFA(periodCancelled)}</p>
                <p className="text-[10px] text-gray-400">{periodCommissions.filter((c) => c.status === 'cancelled').length} commission(s)</p>
              </CardContent>
            </Card>
          </div>

          {/* Commissions History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Historique des commissions
              </CardTitle>
              <CardDescription>
                {periodCommissions.length} commission{periodCommissions.length > 1 ? 's' : ''} trouvée{periodCommissions.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : periodCommissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Commande</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Vente</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCommissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {c.orderNumber}
                          </TableCell>
                          <TableCell className="text-sm max-w-[140px] truncate">
                            {c.productName}
                            {c.variantName && <span className="text-gray-400 ml-1">({c.variantName})</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm">{c.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{formatFCFA(c.totalSaleAmount)}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-emerald-600">
                            {formatFCFA(c.commissionTotal)}
                            {c.commissionMonth != null && (
                              <span className="ml-1.5 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] font-normal text-sky-700">
                                {c.commissionMonth === 1 ? '1er mois' : `Mois ${c.commissionMonth}`}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${COMMISSION_STATUS_COLORS[c.status] || ''}`}
                            >
                              {COMMISSION_STATUS_LABELS[c.status] || c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Pagination */}
                  {totalCommissionPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-gray-500">
                        Page {commissionPage} / {totalCommissionPages} — {periodCommissions.length} résultat(s)
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPage <= 1}
                          onClick={() => setCommissionPage((p) => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={commissionPage >= totalCommissionPages}
                          onClick={() => setCommissionPage((p) => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <CreditCard className="w-8 h-8 mb-2" />
                  <p className="text-sm">Aucune commission pour cette période</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Retraits (Fund Transfers) ───────────── */}
        <TabsContent value="retraits" className="space-y-6">
          {/* Available balance card */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                    Solde disponible pour retrait
                  </p>
                  <p className="text-3xl font-bold text-[#1a1a1a]">
                    {formatFCFA(stats?.pendingEarnings ?? 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Les fonds seront transférés 2h après votre demande
                  </p>
                </div>
                <Button
                  onClick={() => setShowTransferForm(true)}
                  disabled={(stats?.pendingEarnings ?? 0) < 5000}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Demander un retrait
                </Button>
              </div>
              {(stats?.pendingEarnings ?? 0) < 5000 && (
                <div className="flex items-center gap-2 mt-3 text-xs text-orange-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Minimum de retrait : 5 000 FCFA</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer request form */}
          {showTransferForm && (
            <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ArrowDownToLine className="w-4 h-4 text-sky-600" />
                  Nouvelle demande de retrait
                </CardTitle>
                <CardDescription>Les fonds seront envoyés 2h après confirmation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Montant (FCFA)
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Ex: 10000"
                    min={5000}
                    max={stats?.pendingEarnings ?? 0}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Min: 5 000 FCFA · Max: {formatFCFA(stats?.pendingEarnings ?? 0)}
                  </p>
                </div>

                {/* Method */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Méthode de transfert
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                      { value: 'bank_transfer', label: 'Virement', icon: Building2 },
                      { value: 'cash', label: 'Espèces', icon: Wallet },
                    ] as const).map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setTransferMethod(m.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          transferMethod === m.value
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone number (for mobile money) */}
                {transferMethod === 'mobile_money' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={transferPhone}
                      onChange={(e) => setTransferPhone(e.target.value)}
                      placeholder="Ex: 06 123 4567"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                    />
                  </div>
                )}

                {/* Bank info (for bank transfer) */}
                {transferMethod === 'bank_transfer' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Informations bancaires
                    </label>
                    <textarea
                      value={transferBankInfo}
                      onChange={(e) => setTransferBankInfo(e.target.value)}
                      placeholder="Nom de la banque, numéro de compte, RIB..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white resize-none"
                    />
                  </div>
                )}

                {/* Timer notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Timer className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold">Délai de 2 heures</p>
                    <p>Vos fonds seront transférés automatiquement 2 heures après la confirmation de votre demande.</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={async () => {
                      const amount = parseFloat(transferAmount)
                      if (!amount || amount < 5000) {
                        toast.error('Le montant minimum est 5 000 FCFA')
                        return
                      }
                      if (amount > (stats?.pendingEarnings ?? 0)) {
                        toast.error('Le montant dépasse votre solde disponible')
                        return
                      }
                      if (transferMethod === 'mobile_money' && !transferPhone.trim()) {
                        toast.error('Veuillez entrer votre numéro de téléphone')
                        return
                      }
                      if (transferMethod === 'bank_transfer' && !transferBankInfo.trim()) {
                        toast.error('Veuillez entrer vos informations bancaires')
                        return
                      }

                      setTransferSubmitting(true)
                      try {
                        const res = await fetch('/api/affiliate-transfer', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            amount,
                            method: transferMethod,
                            phoneNumber: transferMethod === 'mobile_money' ? transferPhone : undefined,
                            bankInfo: transferMethod === 'bank_transfer' ? transferBankInfo : undefined,
                          }),
                        })
                        const data = await res.json()
                        if (res.ok && data.success) {
                          toast.success('Demande de retrait envoyée ! Transfert dans 2h.')
                          setShowTransferForm(false)
                          setTransferAmount('')
                          setTransferPhone('')
                          setTransferBankInfo('')
                          setTransferMethod('mobile_money')
                          fetchTransferRequests()
                          fetchStats()
                        } else {
                          toast.error(data.error || 'Erreur lors de la demande')
                        }
                      } catch {
                        toast.error('Erreur réseau. Veuillez réessayer.')
                      } finally {
                        setTransferSubmitting(false)
                      }
                    }}
                    disabled={transferSubmitting}
                    className="gap-2 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    {transferSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {transferSubmitting ? 'Envoi en cours...' : 'Confirmer la demande'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                    disabled={transferSubmitting}
                    className="border-gray-200"
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer requests history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-sky-600" />
                Historique des retraits
              </CardTitle>
              <CardDescription>
                {transferRequests.length} demande{transferRequests.length > 1 ? 's' : ''} de retrait
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transferLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : transferRequests.length > 0 ? (
                <div className="space-y-3">
                  {transferRequests.map((tr) => {
                    const scheduledDate = new Date(tr.scheduledAt)
                    const isScheduled = tr.status === 'scheduled'
                    const isPending = tr.status === 'pending'
                    const isCompleted = tr.status === 'completed'
                    const isFailed = tr.status === 'failed'
                    const isRejected = tr.status === 'rejected'
                    const isProcessing = tr.status === 'processing'

                    // Countdown for scheduled transfers
                    const remainingMs = isScheduled ? Math.max(0, scheduledDate.getTime() - Date.now()) : 0
                    const remainingH = Math.floor(remainingMs / 3600000)
                    const remainingM = Math.floor((remainingMs % 3600000) / 60000)
                    const remainingS = Math.floor((remainingMs % 60000) / 1000)

                    const transferStatusLabels: Record<string, string> = {
                      pending: 'En attente',
                      scheduled: 'Programmé',
                      processing: 'En cours',
                      completed: 'Transféré',
                      failed: 'Échoué',
                      rejected: 'Rejeté',
                    }
                    const transferStatusColors: Record<string, string> = {
                      pending: 'bg-orange-100 text-orange-700 border-orange-200',
                      scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
                      processing: 'bg-purple-100 text-purple-700 border-purple-200',
                      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      failed: 'bg-red-100 text-red-700 border-red-200',
                      rejected: 'bg-red-100 text-red-700 border-red-200',
                    }
                    const methodLabels: Record<string, string> = {
                      mobile_money: 'Mobile Money',
                      bank_transfer: 'Virement bancaire',
                      cash: 'Espèces',
                    }

                    return (
                      <div
                        key={tr.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : isFailed || isRejected
                              ? 'bg-red-50/50 border-red-200'
                              : isScheduled || isProcessing
                            ? 'bg-sky-50/50 border-sky-200'
                            : 'bg-orange-50/50 border-orange-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Left: amount + method */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isCompleted ? 'bg-emerald-100' : isFailed || isRejected ? 'bg-red-100' : 'bg-sky-100'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : isFailed || isRejected ? (
                                <XCircle className="w-5 h-5 text-red-600" />
                              ) : (
                                <Timer className="w-5 h-5 text-sky-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1a1a1a]">{formatFCFA(tr.amount)}</p>
                              <p className="text-xs text-gray-500">
                                {methodLabels[tr.method] || tr.method}
                                {tr.phoneNumber && ` · ${tr.phoneNumber}`}
                              </p>
                            </div>
                          </div>

                          {/* Right: status + timing */}
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-2 py-0.5 ${transferStatusColors[tr.status] || ''}`}
                            >
                              {transferStatusLabels[tr.status] || tr.status}
                            </Badge>

                            {(isScheduled || isPending) && remainingMs > 0 && (
                              <div className="flex items-center gap-1 text-xs font-mono text-sky-600 bg-sky-100 px-2 py-1 rounded-md">
                                <Timer className="w-3 h-3" />
                                {remainingH > 0 && `${remainingH}h `}{remainingM}m {remainingS}s
                              </div>
                            )}

                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatDate(tr.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Rejection reason */}
                        {isRejected && tr.rejectionReason && (
                          <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>Raison : {tr.rejectionReason}</span>
                          </div>
                        )}

                        {/* Failure notes */}
                        {isFailed && tr.notes && (
                          <div className="mt-2 text-xs text-red-600 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>{tr.notes}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <ArrowDownToLine className="w-8 h-8 mb-2" />
                  <p className="text-sm">Aucune demande de retrait pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Info Footer */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>
                Taux de commission : <strong className="text-gray-700">{affiliate.commissionRate}%</strong> sur chaque commande filleul
              </span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-4" />
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>
                Paiement minimum : <strong className="text-gray-700">5 000 FCFA</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      </DialogContent>
    </Dialog>
  )
}
