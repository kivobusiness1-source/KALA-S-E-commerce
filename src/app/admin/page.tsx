'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminStore } from '@/stores/admin-store'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Mail,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Send,
  RefreshCw,
  MoreVertical,
  Users,
  Menu,
  Download,
  Inbox,
  FileDown,
  Printer,
  History,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie, Label as PieLabel } from 'recharts'

// ==================== TYPES ====================

type Section = 'dashboard' | 'products' | 'orders' | 'messages' | 'contact' | 'emails' | 'settings' | 'stock-history'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  price: number
  comparePrice: number | null
  categoryId: string
  image: string | null
  images: string
  volume: string | null
  isActive: boolean
  isFeatured: boolean
  inStock: boolean
  stockQty: number
  minStockAlert: number
  createdAt: string
  category: { id: string; name: string; slug: string }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  city: string
  status: string
  totalAmount: number
  notes: string | null
  createdAt: string
  items: OrderItem[]
}

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product?: { name: string; image: string | null; volume: string | null }
}

interface Conversation {
  id: string
  sessionId: string
  customerName: string | null
  customerEmail: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
  latestMessage: {
    id: string
    content: string
    senderType: string
    createdAt: string
  } | null
  unreadCount: number
}

interface ConversationDetail {
  id: string
  sessionId: string
  customerName: string | null
  customerEmail: string | null
  isRead: boolean
  messages: {
    id: string
    content: string
    senderType: string
    isAdminRead: boolean
    createdAt: string
  }[]
}

interface EmailSubscriber {
  id: string
  email: string
  name: string | null
  source: string
  isActive: boolean
  createdAt: string
}

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
}

interface StatsData {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  recentOrders: Order[]
  lowStockProducts: (Product & { category: { id: string; name: string; slug: string } })[]
  unreadMessages: number
  totalEmails: number
  ordersByStatus: Record<string, number>
  recentActivity: {
    id: string
    action: string
    details: string | null
    createdAt: string
  }[]
  unreadContactCount: number
  pendingOrdersCount: number
}

// ==================== HELPERS ====================

function formatPrice(price: number): string {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr })
}

function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: fr })
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const statusDotColors: Record<string, string> = {
  pending: 'bg-amber-400',
  confirmed: 'bg-blue-400',
  processing: 'bg-purple-400',
  shipped: 'bg-cyan-400',
  delivered: 'bg-emerald-400',
  cancelled: 'bg-red-400',
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316']

const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6']

const CATEGORY_PIE_DATA = [
  { name: 'Savon Liquide', value: 45, fill: PIE_COLORS[0] },
  { name: 'Détergent', value: 35, fill: PIE_COLORS[1] },
  { name: 'Eau de Javel', value: 20, fill: PIE_COLORS[2] },
]

const CATEGORY_PIE_CONFIG = {
  'Savon Liquide': { label: 'Savon Liquide', color: PIE_COLORS[0] },
  'Détergent': { label: 'Détergent', color: PIE_COLORS[1] },
  'Eau de Javel': { label: 'Eau de Javel', color: PIE_COLORS[2] },
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`${statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200'} flex items-center gap-1.5`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColors[status] || 'bg-gray-400'}`} />
      {statusLabels[status] || status}
    </Badge>
  )
}

// ==================== MAIN COMPONENT ====================

export default function AdminPage() {
  const { admin, isAuthenticated, isLoading, setAdmin, logout } = useAdminStore()
  const queryClient = useQueryClient()
  const [section, setSection] = useState<Section>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setAdmin(data.data)
        } else {
          setAdmin(null)
        }
      })
      .catch(() => setAdmin(null))
  }, [setAdmin])

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setAdmin(data.data)
        toast.success('Connexion réussie !')
      } else {
        toast.error(data.error || 'Erreur de connexion')
      }
    } catch {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    logout()
    setSection('dashboard')
    toast.success('Déconnecté')
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">CongoClean</CardTitle>
            <CardDescription>Administration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@congosoap.cg"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loginLoading}>
                {loginLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Se connecter
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin panel
  const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: 'products', label: 'Produits', icon: <Package className="h-5 w-5" /> },
    { key: 'orders', label: 'Commandes', icon: <ShoppingCart className="h-5 w-5" /> },
    { key: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { key: 'contact', label: 'Contact', icon: <Inbox className="h-5 w-5" /> },
    { key: 'emails', label: 'Emails', icon: <Mail className="h-5 w-5" /> },
    { key: 'settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> },
    { key: 'stock-history', label: 'Historique Stock', icon: <History className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          [data-printable], [data-printable] * { visibility: visible !important; }
          [data-printable] { position: absolute; left: 0; top: 0; width: 100%; }
        }
      ` }} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-lg leading-tight truncate">CongoClean</h1>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setSection(item.key)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium transition-colors border-l-4 ${section === item.key ? 'border-l-emerald-500 bg-emerald-50 text-emerald-700 [&>svg]:text-emerald-600' : 'border-l-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <NavBadge itemKey={item.key} activeSection={section} />
              </button>
            ))}
          </nav>

          {/* User / Logout */}
          <div className="border-t border-gray-100 px-3 py-4 space-y-1">
            <div className="px-3 py-2 text-sm text-muted-foreground truncate">
              {admin?.name}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find(n => n.key === section)?.label}
          </h2>
          <div className="flex-1" />
          {admin && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-semibold text-xs">
                {admin.name?.charAt(0).toUpperCase()}
              </div>
              <span>{admin.name}</span>
            </div>
          )}
        </header>

        {/* Section content */}
        <div className="p-4 sm:p-6">
          {section === 'dashboard' && <DashboardSection />}
          {section === 'products' && <ProductsSection />}
          {section === 'orders' && <OrdersSection />}
          {section === 'messages' && <MessagesSection />}
          {section === 'contact' && <ContactSection />}
          {section === 'emails' && <EmailsSection />}
          {section === 'settings' && <SettingsSection />}
          {section === 'stock-history' && <StockHistorySection />}
        </div>
      </main>
    </div>
  )
}

// ==================== NAV BADGE ====================

function NavBadge({ itemKey, activeSection }: { itemKey: Section; activeSection: Section }) {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()).then(d => d.data as StatsData),
    enabled: true,
    refetchInterval: 30000,
  })
  
  let count = 0
  if (itemKey === 'messages') count = stats?.unreadMessages ?? 0
  else if (itemKey === 'contact') count = stats?.unreadContactCount ?? 0
  else if (itemKey === 'orders') count = stats?.pendingOrdersCount ?? 0

  if (count === 0) return null
  return (
    <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold ${activeSection === itemKey ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
      {count}
    </span>
  )
}

// ==================== DASHBOARD SECTION ====================

function DashboardSection() {
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
        <h2 className="text-xl font-bold text-gray-900">Tableau de Bord</h2>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package className="h-5 w-5" />} label="Total Produits" value={stats.totalProducts} color="emerald" borderColor="border-t-emerald-500" />
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Commandes" value={stats.totalOrders} color="blue" borderColor="border-t-blue-500" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Revenu Total" value={formatPrice(stats.totalRevenue)} color="amber" borderColor="border-t-amber-500" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Clients Uniques" value={stats.totalCustomers} color="purple" borderColor="border-t-purple-500" />
      </div>

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

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.recentActivity.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">{a.details || a.action}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value, color, borderColor }: { icon: React.ReactNode; label: string; value: string | number; color: string; borderColor: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <Card className={`border-t-4 ${borderColor}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.emerald}`}>
            {icon}
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

// ==================== PRODUCTS SECTION ====================

function ProductsSection() {
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
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p, i) => (
                    <TableRow key={p.id} className={`${!p.isActive ? 'opacity-50' : ''} ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <TableCell>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-gray-400" />
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

// ==================== ORDERS SECTION ====================

function OrdersSection() {
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
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: Order) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-medium">{o.orderNumber}</TableCell>
                      <TableCell className="text-sm font-medium">{o.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{o.customerEmail}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatPrice(o.totalAmount)}</TableCell>
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
                  ))}
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
              <DialogHeader>
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

// ==================== MESSAGES SECTION ====================

function MessagesSection() {
  const queryClient = useQueryClient()
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetch('/api/messages').then(r => r.json()).then(d => d.data as Conversation[]),
    refetchInterval: 5000,
  })

  const { data: convDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['conversation', selectedConvId],
    queryFn: () => fetch(`/api/messages/${selectedConvId}`).then(r => r.json()).then(d => d.data as ConversationDetail),
    enabled: !!selectedConvId,
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    if (convDetail?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [convDetail?.messages?.length])

  const selectConversation = (id: string) => {
    setSelectedConvId(id)
    setReplyText('')
  }

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConvId) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${selectedConvId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setReplyText('')
        queryClient.invalidateQueries({ queryKey: ['conversation', selectedConvId] })
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSending(false)
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Conversation supprimée')
        if (selectedConvId === id) setSelectedConvId(null)
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Conversations list */}
      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col ${selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm">Conversations</h3>
          <p className="text-xs text-muted-foreground">{conversations?.length ?? 0} conversation(s)</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-3 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : conversations && conversations.length > 0 ? (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConvId === conv.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium truncate ${!conv.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {conv.customerName || conv.customerEmail || 'Anonyme'}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatRelative(conv.updatedAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.latestMessage?.content || 'Aucun message'}</p>
                {conv.unreadCount > 0 && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-bold">
                    {conv.unreadCount} nouveau(x)
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Messages panel */}
      <div className={`flex-1 flex flex-col ${!selectedConvId ? 'hidden sm:flex' : 'flex'}`}>
        {selectedConvId && convDetail ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{convDetail.customerName || convDetail.customerEmail || 'Anonyme'}</p>
                <p className="text-xs text-muted-foreground">{convDetail.customerEmail}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteConversation(selectedConvId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {detailLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className={`h-12 w-3/4 ${i % 2 === 0 ? 'ml-auto' : ''}`} />)}</div>
              ) : convDetail.messages.length > 0 ? (
                <div className="space-y-3">
                  {convDetail.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${msg.senderType === 'admin' ? 'border-l-2 border-emerald-400' : ''}`}>
                        <p className={`text-xs mb-1 ${msg.senderType === 'admin' ? 'text-right' : ''} text-gray-400`}>
                          {msg.senderType === 'admin' ? 'Vous' : 'Client'}
                        </p>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.senderType === 'admin' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'}`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-emerald-100' : 'text-gray-400'}`}>
                            {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun message</p>
              )}
            </ScrollArea>

            {/* Reply input */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrire une réponse..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  disabled={sending}
                />
                <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={sendReply} disabled={sending || !replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== CONTACT SECTION ====================

function ContactSection() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingRead, setMarkingRead] = useState<string | null>(null)
  const limit = 20

  const { data: contactData, isLoading } = useQuery({
    queryKey: ['contact-submissions', search, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search) params.set('search', search)
      return fetch(`/api/contact?${params}`).then(r => r.json()).then(d => d.data)
    },
  })

  const submissions = contactData?.submissions ?? []
  const totalPages = contactData?.totalPages ?? 1

  const openDetail = (submission: ContactSubmission) => {
    setSelectedContact(submission)
    setDetailOpen(true)
    if (!submission.isRead) {
      markAsRead(submission.id)
    }
  }

  const markAsRead = async (id: string) => {
    setMarkingRead(id)
    try {
      await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, isRead: true })
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setMarkingRead(null)
    }
  }

  const deleteContact = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/contact?id=${deletingId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Soumission supprimée')
        queryClient.invalidateQueries({ queryKey: ['contact-submissions'] })
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

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-900">Soumissions de Contact</h3>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {contactData?.total ?? 0} soumission(s)
          </Badge>
        </div>
        <div className="flex-1" />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Sujet</TableHead>
                    <TableHead className="hidden lg:table-cell">Message</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Lu</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s: ContactSubmission) => (
                    <TableRow
                      key={s.id}
                      className={`cursor-pointer hover:bg-gray-50 ${!s.isRead ? 'bg-emerald-50/50' : ''}`}
                      onClick={() => openDetail(s)}
                    >
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{s.subject || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{s.message}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={s.isRead ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                          {s.isRead ? 'Lu' : 'Non lu'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          {!s.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead(s.id)}
                              disabled={markingRead === s.id}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => { setDeletingId(s.id); setDeleteDialogOpen(true) }}
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
              <Inbox className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucune soumission de contact</p>
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContact.subject || 'Soumission de Contact'}</DialogTitle>
                <DialogDescription>De {selectedContact.name} ({selectedContact.email})</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selectedContact.phone && (
                  <p><span className="text-muted-foreground">Téléphone:</span> {selectedContact.phone}</p>
                )}
                <Separator />
                <p className="whitespace-pre-wrap leading-relaxed">{selectedContact.message}</p>
                <Separator />
                <p className="text-xs text-muted-foreground">Reçu le {formatDate(selectedContact.createdAt)}</p>
              </div>
              <DialogFooter>
                {!selectedContact.isRead && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markAsRead(selectedContact.id)} disabled={markingRead === selectedContact.id}>
                    <Check className="h-4 w-4 mr-1" />Marquer comme lu
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette soumission ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={deleteContact}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ==================== EMAILS SECTION ====================

function EmailsSection() {
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
    a.download = `abonnes-congoclean-${format(new Date(), 'yyyy-MM-dd')}.csv`
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

// ==================== SETTINGS SECTION ====================

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

function SettingsSection() {
  const queryClient = useQueryClient()
  const { admin: currentAdmin } = useAdminStore()
  const isSuperAdmin = currentAdmin?.role === 'super_admin'

  // Site settings state
  const [form, setForm] = useState<Record<string, string>>({
    site_name: '', site_tagline: '', site_description: '',
    contact_phone: '', contact_email: '', contact_address: '',
    whatsapp_number: '', currency: '', free_shipping_threshold: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Admin users state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [creatingAdmin, setCreatingAdmin] = useState(false)

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPw, setChangingPw] = useState(false)

  // Promo banner state
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [promoText, setPromoText] = useState('Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567')
  const [promoSaving, setPromoSaving] = useState(false)

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setChangingPw(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Mot de passe modifié avec succès')
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setChangingPw(false)
    }
  }

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => fetch('/api/site-settings').then(r => r.json()).then(d => d.data as Record<string, string>),
  })

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetch('/api/admin/users').then(r => r.json()).then(d => d.data as AdminUser[]),
    enabled: isSuperAdmin,
  })

  useEffect(() => {
    if (settings) {
      setForm(prev => ({
        ...prev,
        site_name: settings.site_name || '',
        site_tagline: settings.site_tagline || '',
        site_description: settings.site_description || '',
        contact_phone: settings.contact_phone || '',
        contact_email: settings.contact_email || '',
        contact_address: settings.contact_address || '',
        whatsapp_number: settings.whatsapp_number || '',
        currency: settings.currency || 'FCFA',
        free_shipping_threshold: settings.free_shipping_threshold || '',
      }))
      setPromoEnabled(settings.promo_banner_enabled === 'true')
      setPromoText(settings.promo_banner_text || 'Livraison gratuite à Pointe-Noire ! Commandez maintenant et recevez vos produits en 24-48h. Appelez le +242 06 123 4567')
      setLoading(false)
    }
  }, [settings])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settingsArray = Object.entries(form).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Paramètres sauvegardés')
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setSaving(false)
    }
  }

  const createAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('Tous les champs sont requis')
      return
    }
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (newAdmin.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setCreatingAdmin(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdmin.email, name: newAdmin.name, password: newAdmin.password }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Administrateur créé')
        setAdminDialogOpen(false)
        setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' })
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setCreatingAdmin(false)
    }
  }

  const savePromoBanner = async () => {
    setPromoSaving(true)
    try {
      const res = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'promo_banner_enabled', value: promoEnabled ? 'true' : 'false' },
            { key: 'promo_banner_text', value: promoText },
          ],
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bannière promotionnelle sauvegardée')
        queryClient.invalidateQueries({ queryKey: ['site-settings'] })
      } else {
        toast.error(data.error || 'Erreur')
      }
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setPromoSaving(false)
    }
  }

  const fields = [
    { key: 'site_name', label: 'Nom du site', placeholder: 'CongoClean' },
    { key: 'site_tagline', label: 'Slogan', placeholder: 'Produits d\'hygiène de qualité' },
    { key: 'site_description', label: 'Description', placeholder: 'Description du site', multiline: true },
    { key: 'contact_phone', label: 'Téléphone', placeholder: '+242 06 123 4567' },
    { key: 'contact_email', label: 'Email', placeholder: 'contact@congosoap.cg' },
    { key: 'contact_address', label: 'Adresse', placeholder: 'Pointe-Noire, Congo-Brazzaville' },
    { key: 'whatsapp_number', label: 'WhatsApp', placeholder: '+242 06 123 4567' },
    { key: 'currency', label: 'Devise', placeholder: 'FCFA' },
    { key: 'free_shipping_threshold', label: 'Seuil livraison gratuite', placeholder: '50000', type: 'number' },
  ]

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du Site</CardTitle>
            <CardDescription>Configurez les informations générales de votre site.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {fields.map(f => (
                  <div key={f.key} className="space-y-2">
                    <Label>{f.label}</Label>
                    {f.multiline ? (
                      <Textarea
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={f.type || 'text'}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                ))}
                <div className="pt-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveSettings} disabled={saving}>
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sauvegarder
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promotional Banner */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Bannière Promotionnelle</CardTitle>
            <CardDescription>Gérez la bannière promotionnelle affichée sur le site.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activer la bannière</Label>
                <Switch checked={promoEnabled} onCheckedChange={setPromoEnabled} />
              </div>
              <div className="space-y-2">
                <Label>Message promotionnel</Label>
                <Textarea
                  value={promoText}
                  onChange={e => setPromoText(e.target.value)}
                  placeholder="Message de la bannière promotionnelle"
                  rows={3}
                />
              </div>
              <div className="pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePromoBanner} disabled={promoSaving}>
                  {promoSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin User Management */}
      {isSuperAdmin && (
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des Administrateurs</CardTitle>
                  <CardDescription>Gérez les comptes administrateurs du site.</CardDescription>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAdminDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : admins && admins.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="hidden sm:table-cell">Date de création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map(a => (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm font-medium">{a.email}</TableCell>
                          <TableCell className="text-sm">{a.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={a.role === 'super_admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}
                            >
                              {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(a.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun administrateur trouvé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Password Change */}
      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>Modifiez votre mot de passe de connexion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe (min. 8 caractères)</Label>
                <Input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Retapez le nouveau mot de passe"
                />
              </div>
              <div className="pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleChangePassword} disabled={changingPw}>
                  {changingPw ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Changer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Administrateur</DialogTitle>
            <DialogDescription>Créez un nouveau compte administrateur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={newAdmin.name}
                onChange={e => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom complet"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@congosoap.cg"
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe *</Label>
              <Input
                type="password"
                value={newAdmin.password}
                onChange={e => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le mot de passe *</Label>
              <Input
                type="password"
                value={newAdmin.confirmPassword}
                onChange={e => setNewAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Retapez le mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={createAdmin} disabled={creatingAdmin}>
              {creatingAdmin ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== STOCK HISTORY SECTION ====================

interface StockHistoryEntry {
  id: string
  productId: string
  previousQty: number
  newQty: number
  changeReason: string | null
  adminId: string | null
  createdAt: string
  product: { name: string } | null
  admin: { name: string; email: string } | null
}

function StockHistorySection() {
  const [page, setPage] = useState(1)
  const [productFilter, setProductFilter] = useState('all')
  const limit = 20

  const { data: products } = useQuery({
    queryKey: ['stock-history-products'],
    queryFn: () => fetch('/api/products?all=true').then(r => r.json()).then(d => d.data as Product[]),
  })

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['stock-history', page, productFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (productFilter !== 'all') params.set('productId', productFilter)
      return fetch(`/api/stock-history?${params}`).then(r => r.json())
    },
  })

  const entries: StockHistoryEntry[] = historyData?.data ?? []
  const totalPages = historyData?.pagination?.pages ?? 1

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h3 className="text-xl font-semibold text-gray-900">Historique du Stock</h3>
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={productFilter} onValueChange={v => { setProductFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tous les produits" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les produits</SelectItem>
              {products?.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Avant</TableHead>
                    <TableHead className="text-right">Après</TableHead>
                    <TableHead className="text-right">Variation</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, i) => {
                    const diff = entry.newQty - entry.previousQty
                    return (
                      <TableRow key={entry.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(entry.createdAt)}</TableCell>
                        <TableCell className="text-sm font-medium">{entry.product?.name || entry.productId}</TableCell>
                        <TableCell className="text-right text-sm">{entry.previousQty}</TableCell>
                        <TableCell className="text-right text-sm">{entry.newQty}</TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {diff > 0 ? `+${diff}` : String(diff)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{entry.changeReason || '—'}</TableCell>
                        <TableCell className="text-sm">{entry.admin?.name || 'Système'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">Aucun historique de stock</p>
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Button
              key={p}
              variant={page === p ? 'default' : 'outline'}
              size="sm"
              className={page === p ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
