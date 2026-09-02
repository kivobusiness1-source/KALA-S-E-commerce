'use client'

import { useRef, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from './helpers'
import type { ProductType } from './types'

interface FlashSaleSectionProps {
  products: ProductType[] | undefined
  onAddToCart: (product: ProductType) => void
  onViewProduct: (product: ProductType) => void
}

function getDiscountPercent(price: number, comparePrice: number): number {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function FlashSaleSection({ products, onAddToCart, onViewProduct }: FlashSaleSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const discountedProducts = (products || []).filter(
    (p) => p.comparePrice && p.comparePrice > p.price
  )

  // Auto-scroll effect with proper cleanup
  useEffect(() => {
    const container = scrollRef.current
    if (!container || discountedProducts.length === 0) return
    if (window.innerWidth < 768) return

    let scrollDirection = 1
    let isPaused = false
    let animationId: number

    const autoScroll = () => {
      if (isPaused) {
        animationId = requestAnimationFrame(autoScroll)
        return
      }
      const { scrollLeft, scrollWidth, clientWidth } = container
      const maxScroll = scrollWidth - clientWidth
      if (scrollLeft >= maxScroll - 2) scrollDirection = -1
      else if (scrollLeft <= 2) scrollDirection = 1
      container.scrollLeft += scrollDirection * 0.5
      animationId = requestAnimationFrame(autoScroll)
    }

    const onMouseEnter = () => { isPaused = true }
    const onMouseLeave = () => { isPaused = false }
    const onTouchStart = () => { isPaused = true }
    const onTouchEnd = () => { isPaused = false }

    container.addEventListener('mouseenter', onMouseEnter)
    container.addEventListener('mouseleave', onMouseLeave)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchend', onTouchEnd)
    animationId = requestAnimationFrame(autoScroll)

    return () => {
      cancelAnimationFrame(animationId)
      container.removeEventListener('mouseenter', onMouseEnter)
      container.removeEventListener('mouseleave', onMouseLeave)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [discountedProducts.length])

  if (discountedProducts.length === 0) return null

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Promotions</h2>
            <p className="text-sm text-[#555555] mt-1">Offres limitees</p>
          </div>
        </div>

        {/* Horizontal scrollable product cards */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {discountedProducts.map((product) => {
              const discount = getDiscountPercent(product.price, product.comparePrice!)

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-64 sm:w-72 snap-start"
                >
                  <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden group hover:shadow-sm transition-shadow duration-200 shadow-sm">
                    {/* Product image area */}
                    <div className="relative h-44 overflow-hidden bg-[#f5f5f5]">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        </div>
                      )}

                      {/* Discount badge */}
                      <div className="absolute top-3 left-3 bg-[#dc2626] text-white text-[11px] font-medium px-2 py-0.5 rounded">
                        -{discount}%
                      </div>

                      {/* Quick view overlay */}
                      <button
                        onClick={() => onViewProduct(product)}
                        className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <span className="bg-white/90 text-[#1a1a1a] text-xs font-medium px-4 py-2 rounded-lg border border-[#e5e5e5]">
                          Voir les details
                        </span>
                      </button>
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <h3 className="text-[#1a1a1a] font-medium text-sm mb-1 truncate">
                        {product.name}
                      </h3>
                      {product.volume && (
                        <p className="text-[#888888] text-xs mb-2">{product.volume}</p>
                      )}

                      {/* Stock indicator */}
                      {!product.inStock && (
                        <p className="text-xs text-[#dc2626] font-medium mb-2">Rupture de stock</p>
                      )}
                      {product.inStock && product.stockQty > 0 && product.stockQty <= (product.minStockAlert || 10) && (
                        <p className="text-xs text-[#888888] mb-2">Derniers exemplaires</p>
                      )}

                      {/* Prices */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-[#1a1a1a]">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-[#888888] line-through">
                          {formatPrice(product.comparePrice!)}
                        </span>
                      </div>

                      {/* Add to cart button */}
                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={!product.inStock}
                        className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#333] text-white text-sm font-semibold rounded-lg transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4 inline-block mr-1.5" />
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hide scrollbar */}
      <style>{`
        div[style*="scrollbarWidth"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
