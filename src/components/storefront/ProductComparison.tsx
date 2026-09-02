'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompareArrows, X, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatPrice, getCategoryInitial } from './helpers'
import type { ProductType } from './types'

interface ProductComparisonProps {
  comparisonIds: string[]
  products: ProductType[] | undefined
  onToggleComparison: (id: string) => void
  onClearComparison: () => void
}

export function ProductComparison({
  comparisonIds,
  products,
  onToggleComparison,
  onClearComparison,
}: ProductComparisonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const comparedProducts = (products || []).filter((p) => comparisonIds.includes(p.id))

  const handleViewComparison = () => {
    if (comparedProducts.length >= 2) {
      setDialogOpen(true)
    }
  }

  const handleRemove = (id: string) => {
    onToggleComparison(id)
  }

  return (
    <>
      {/* Floating comparison bar */}
      <AnimatePresence>
        {comparedProducts.length >= 2 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 z-40 px-4"
          >
            <div className="max-w-3xl mx-auto bg-white border border-[#e5e5e5] shadow-lg rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-x-auto flex-1 min-w-0">
                <GitCompareArrows className="w-5 h-5 text-[#1a1a1a] shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  {comparedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleRemove(product.id)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-[#e5e5e5] rounded-full pl-1.5 pr-2.5 py-0.5 text-xs text-[#1a1a1a] font-medium transition-colors shrink-0 group"
                      title={`Retirer ${product.name}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-[9px] font-bold">
                        {getCategoryInitial(product.category?.slug || '')}
                      </span>
                      <span className="truncate max-w-20">{product.name}</span>
                      <X className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearComparison}
                  className="text-[#888888] hover:text-[#dc2626] text-xs h-8"
                >
                  Tout retirer
                </Button>
                <Button
                  onClick={handleViewComparison}
                  className="bg-[#1a1a1a] hover:bg-[#333] text-white font-medium text-sm h-8 px-4"
                >
                  Voir la comparaison ({comparedProducts.length})
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="w-5 h-5 text-[#1a1a1a]" />
              Comparaison de produits
            </DialogTitle>
            <DialogDescription>
              Comparez les caracteristiques de {comparedProducts.length} produit(s) cote a cote
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] px-6 pb-6">
            <div className="mt-4 overflow-x-auto">
              {/* Header row with product images and names */}
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-semibold text-[#888888] p-3 w-36 align-top">Caracteristique</th>
                    {comparedProducts.map((product) => (
                      <th key={product.id} className="text-center p-3 align-top min-w-[180px]">
                        <div className="h-28 rounded-xl overflow-hidden bg-gray-100 mb-2 mx-auto max-w-[160px]">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <span className="text-3xl font-bold text-gray-400">{getCategoryInitial(product.category?.slug || '')}</span>
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-[#1a1a1a] text-sm line-clamp-2">{product.name}</p>
                        <p className="text-lg font-bold text-[#1a1a1a] mt-1">{formatPrice(product.price)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Prix */}
                  <tr className="border-t border-[#e5e5e5]">
                    <td className="text-sm text-[#555555] font-medium p-3">Prix</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-center p-3">
                        <span className="text-sm font-semibold text-[#1a1a1a]">{formatPrice(product.price)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <>
                            <br />
                            <span className="text-xs text-[#888888] line-through">{formatPrice(product.comparePrice)}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Volume */}
                  <tr className="border-t border-[#e5e5e5] bg-gray-50/50">
                    <td className="text-sm text-[#555555] font-medium p-3">Volume</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-center p-3">
                        {product.volume ? (
                          <Badge variant="secondary" className="text-xs">{product.volume}</Badge>
                        ) : (
                          <span className="text-xs text-[#888888]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Categorie */}
                  <tr className="border-t border-[#e5e5e5]">
                    <td className="text-sm text-[#555555] font-medium p-3">Categorie</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-center p-3">
                        {product.category ? (
                          <Badge variant="outline" className="text-xs text-[#1a1a1a] border-[#e5e5e5] bg-gray-50">{product.category.name}</Badge>
                        ) : (
                          <span className="text-xs text-[#888888]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Stock */}
                  <tr className="border-t border-[#e5e5e5] bg-gray-50/50">
                    <td className="text-sm text-[#555555] font-medium p-3">Disponibilite</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-center p-3">
                        {product.inStock ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#1a1a1a]">
                            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                            En stock
                            {product.stockQty <= 10 && product.stockQty > 0 && (
                              <span className="text-[#888888]">({product.stockQty} restants)</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#dc2626]">
                            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                            Rupture
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Description */}
                  <tr className="border-t border-[#e5e5e5]">
                    <td className="text-sm text-[#555555] font-medium p-3 align-top">Description</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-left p-3 text-xs text-[#555555] leading-relaxed">
                        {product.description || product.longDescription || (
                          <span className="text-[#888888] italic">Aucune description</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Vedette */}
                  <tr className="border-t border-[#e5e5e5] bg-gray-50/50">
                    <td className="text-sm text-[#555555] font-medium p-3">Vedette</td>
                    {comparedProducts.map((product) => (
                      <td key={product.id} className="text-center p-3">
                        {product.isFeatured ? (
                          <Badge className="bg-[#1a1a1a] text-white text-xs">Vedette</Badge>
                        ) : (
                          <span className="text-xs text-[#888888]">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
