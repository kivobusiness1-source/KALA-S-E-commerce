'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie, Label as PieLabel } from 'recharts'
import { useAdminStore } from '@/stores/admin-store'
import { formatPrice, statusLabels, CHART_COLORS, CATEGORY_PIE_DATA, CATEGORY_PIE_CONFIG, StatusBadge } from './helpers'
import ActivityTimeline from './ActivityTimeline'
import type { StatsData } from './types'

function StatCard({ icon, label, value, color, borderColor }: { icon: React.ReactNode; label: string; value: string | number; color: string; borderColor: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  const iconBgClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10',
    teal: 'bg-teal-500/10',
    amber: 'bg-amber-500/10',
    rose: 'bg-rose-500/10',
  }
  return (
    <Card className={`border-t-4 ${borderColor} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ease-out`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`absolute -inset-2 rounded-xl ${iconBgClasses[color] || iconBgClasses.emerald} blur-sm`} />
            <div className={`relative w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.emerald}`}>
              {icon}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold text-gray-900 truncate">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-6"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-lg" /><div className="flex-1"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-7 w-16" /></div></div></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full rounded" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-[250px] w-full rounded" /></CardContent></Card>
      </div>
    </div>
  )
}

export default function DashboardSection() {
  const { admin } = useAdminStore()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()).then(d => d.data as StatsData),
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return <p className="text-muted-foreground">Impossible de charger les statistiques.</p>
  }

  const chartData = Object.entries(stats.ordersByStatus).map(([status, count]) => ({
    status: statusLabels[status] || status,
    count,
    fill: CHART_COLORS[Object.keys(stats.ordersByStatus).indexOf(status) % CHART_COLORS.length],
  }))

  const chartConfig = chartData.reduce((acc, item, i) => {
    acc[item.status] = { label: item.status, color: CHART_COLORS[i % CHART_COLORS.length] }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="flex items-center">
        <div className="w-1 h-6 bg-emerald-500 rounded-full mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tableau de Bord</h2>
          {admin?.name && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Bienvenue, {admin.name} ! &mdash; {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package className="h-5 w-5" />} label="Total Produits" value={stats.totalProducts} color="emerald" borderColor="border-t-emerald-500" />
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Commandes" value={stats.totalOrders} color="teal" borderColor="border-t-teal-500" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Revenu Total" value={formatPrice(stats.totalRevenue)} color="amber" borderColor="border-t-amber-500" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Clients Uniques" value={stats.totalCustomers} color="rose" borderColor="border-t-rose-500" />
      </div>

      {/* Revenue progress bar */}
      <Card className="border-t-4 border-t-amber-500">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Objectif: 500 000 FCFA</p>
            <p className="text-sm text-muted-foreground">{Math.min(100, Math.round((stats.totalRevenue / 500000) * 100))}%</p>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((stats.totalRevenue / 500000) * 100))}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commandes par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" width={90} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category distribution PieChart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={CATEGORY_PIE_CONFIG} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={CATEGORY_PIE_DATA}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {CATEGORY_PIE_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                  <PieLabel
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-base font-bold">3</tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">Catégories</tspan>
                          </text>
                        )
                      }
                      return null
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              {CATEGORY_PIE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center"><div className="w-1 h-6 bg-emerald-500 rounded-full mr-3" />Commandes Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm">{o.customerName}</TableCell>
                      <TableCell className="text-sm">{formatPrice(o.totalAmount)}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune commande</p>
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full mr-1" />
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertes de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {stats.lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 shrink-0 ml-2">
                      {p.stockQty} en stock
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Tous les produits ont un stock suffisant
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernière activité - Real Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dernière activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline />
        </CardContent>
      </Card>
    </div>
  )
}