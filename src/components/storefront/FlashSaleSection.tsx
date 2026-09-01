'use client'

import { useRef, useEffect } from 'react'
import { ShoppingCart, Eye } from 'lucide-react'
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
    <section className="py-14 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">Promotions</h2>
            <p className="text-sm text-[#64748b] mt-1">Offres limitees</p>
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
                  <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden group hover:shadow-md transition-shadow duration-200">
                    {/* Product image area */}
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                      )}

                      {/* Discount badge */}
                      <div className="absolute top-3 left-3 bg-[#1a1a2e] text-white text-[11px] font-medium px-2 py-0.5 rounded">
                        -{discount}%
                      </div>

                      {/* Quick view overlay */}
                      <button
                        onClick={() => onViewProduct(product)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-150 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Eye className="w-5 h-5 text-[#1a1a2e]" />
                        </div>
                      </button>
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <h3 className="text-[#1a1a2e] font-medium text-sm mb-1 truncate">
                        {product.name}
                      </h3>
                      {product.volume && (
                        <p className="text-[#64748b] text-xs mb-3">{product.volume}</p>
                      )}

                      {/* Prices */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-[#1a1a2e]">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-sm text-[#64748b] line-through">
                          {formatPrice(product.comparePrice!)}
                        </span>
                      </div>

                      {/* Add to cart button */}
                      <button
                        onClick={() => onAddToCart(product)}
                        className="w-full py-2.5 bg-[#c8a951] hover:bg-[#c8a951]/90 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors duration-150"
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
