'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate } from './helpers'
import type { StockHistoryEntry, Product } from './types'

export default function StockHistorySection() {
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
                          <span className={`text-sm font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
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
              className={page === p ? 'bg-[#1a1a1a] hover:bg-[#1a1a1a]/90 text-white' : ''}
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