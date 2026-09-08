'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
} from 'lucide-react'
import { toast } from 'sonner'

interface MonthlyEarning {
  month: string
  amount: number
}

interface Referral {
  id: string
  customerName: string
  orderAmount: number
  commission: number
  status: 'pending' | 'paid' | 'cancelled'
  date: string
}

interface Payout {
  id: string
  amount: number
  method: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  date: string
}

interface AffiliateStats {
  monthlyEarnings: MonthlyEarning[]
  recentReferrals: Referral[]
  recentPayouts: Payout[]
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  cancelled: 'Annulé',
  processing: 'En cours',
  completed: 'Complété',
  failed: 'Échoué',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-700 border-orange-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  processing: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
}

export function AffiliateDashboard() {
  const { affiliate, logout, isLoading } = useAffiliateAuthStore()
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const res = await fetch('/api/affiliate-stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        // Use empty defaults
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

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
          title: 'KALA\'S - Produits d\'Hygiène',
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

  // Default monthly earnings if API hasn't returned yet
  const monthlyEarnings = stats?.monthlyEarnings || []
  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.amount), 1)

  const recentReferrals = stats?.recentReferrals || []
  const recentPayouts = stats?.recentPayouts || []

  return (
    <div className="space-y-6">
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
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-gray-500 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </Button>
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

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Gains totaux</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatFCFA(affiliate.totalEarnings)}
            </p>
          </CardContent>
        </Card>

        {/* Pending Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">En attente</p>
            <p className="text-lg font-bold text-orange-600">
              {formatFCFA(affiliate.pendingEarnings)}
            </p>
          </CardContent>
        </Card>

        {/* Paid Earnings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Gains payés</p>
            <p className="text-lg font-bold text-sky-600">
              {formatFCFA(affiliate.paidEarnings)}
            </p>
          </CardContent>
        </Card>

        {/* Commission Rate */}
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

        {/* Referrals */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Filleuls</p>
            <p className="text-lg font-bold text-rose-600">
              {affiliate.totalReferrals}
            </p>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Commandes</p>
            <p className="text-lg font-bold text-amber-600">
              {affiliate.totalOrders}
            </p>
          </CardContent>
        </Card>
      </div>

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
              {monthlyEarnings.map((entry) => {
                const pct = Math.max((entry.amount / maxEarning) * 100, 2)
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
                      {formatFCFA(entry.amount)}
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
                        {ref.date}
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
                        {payout.date}
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
  )
}
