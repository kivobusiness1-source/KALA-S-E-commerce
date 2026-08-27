'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, Eye, Flame, Clock } from 'lucide-react'
import { FadeInSection } from './AnimatedComponents'
import type { ProductType } from './types'

interface FlashSaleSectionProps {
  products: ProductType[] | undefined
  onAddToCart: (product: ProductType) => void
  onViewProduct: (product: ProductType) => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price)
}

function getDiscountPercent(price: number, comparePrice: number): number {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

const categoryGradients: Record<string, string> = {
  default: 'from-rose-500 to-amber-500',
}

function getGradientForCategory(product: ProductType): string {
  const name = (product.category?.name || '').toLowerCase()
  if (name.includes('savon')) return 'from-emerald-400 to-teal-500'
  if (name.includes('dét')) return 'from-cyan-400 to-teal-500'
  if (name.includes('javel')) return 'from-amber-400 to-rose-500'
  return categoryGradients.default
}

export function FlashSaleSection({ products, onAddToCart, onViewProduct }: FlashSaleSectionProps) {
  const discountedProducts = (products || []).filter(
    (p) => p.comparePrice && p.comparePrice > p.price
  )

  // Don't render if no discounted products
  if (discountedProducts.length === 0) return null

  return (
    <section className="py-14 sm:py-18 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <FadeInSection>
          {/* Section header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Ventes Flash
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">Offres limitées — ne manquez pas</p>
              </div>
            </div>
            <CountdownTimer />
          </div>
        </FadeInSection>

        {/* Horizontal scrollable product cards */}
        <FadeInSection>
          <div className="relative">
            {/* Left fade */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />

            <div
              ref={(el) => {
                if (el) setupAutoScroll(el)
              }}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {discountedProducts.map((product, index) => {
                const discount = getDiscountPercent(product.price, product.comparePrice!)
                const gradient = getGradientForCategory(product)

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex-shrink-0 w-64 sm:w-72 snap-start"
                  >
                    <div className="bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-700/50 overflow-hidden group hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                      {/* Product image area */}
                      <div className="relative h-44 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-28 h-28 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                              <ShoppingCart className="w-8 h-8 text-white/80" />
                            </div>
                          )}
                        </div>

                        {/* Discount badge */}
                        <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          -{discount}%
                        </div>

                        {/* Quick view overlay */}
                        <button
                          onClick={() => onViewProduct(product)}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <Eye className="w-5 h-5 text-gray-800" />
                          </div>
                        </button>
                      </div>

                      {/* Product info */}
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm mb-1 truncate group-hover:text-amber-300 transition-colors">
                          {product.name}
                        </h3>
                        {product.volume && (
                          <p className="text-gray-500 text-xs mb-3">{product.volume}</p>
                        )}

                        {/* Prices */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-amber-400">
                            {formatPrice(product.price)} FCFA
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(product.comparePrice!)} FCFA
                          </span>
                        </div>

                        {/* Savings callout */}
                        <p className="text-emerald-400 text-xs font-medium mb-3">
                          Vous économisez {formatPrice(product.comparePrice! - product.price)} FCFA
                        </p>

                        {/* Add to cart button */}
                        <button
                          onClick={() => onAddToCart(product)}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Ajouter au panier
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Hide scrollbar globally for this section */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 34, seconds: 56 })

  useEffect(() => {
    let h = 2 + Math.floor(Math.random() * 4)
    let m = Math.floor(Math.random() * 60)
    let s = Math.floor(Math.random() * 60)

    setTimeLeft({ hours: h, minutes: m, seconds: s })

    const interval = setInterval(() => {
      s--
      if (s < 0) {
        s = 59
        m--
      }
      if (m < 0) {
        m = 59
        h--
      }
      if (h < 0) {
        // Reset with new random time
        h = 1 + Math.floor(Math.random() * 5)
        m = Math.floor(Math.random() * 60)
        s = Math.floor(Math.random() * 60)
      }
      setTimeLeft({ hours: h, minutes: m, seconds: s })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-amber-400" />
      <span className="text-gray-400 text-sm mr-1">Se termine dans</span>
      <div className="flex gap-1.5">
        {[
          { value: pad(timeLeft.hours), label: 'h' },
          { value: pad(timeLeft.minutes), label: 'm' },
          { value: pad(timeLeft.seconds), label: 's' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 min-w-[42px] text-center">
              <span className="text-white font-bold text-sm font-mono tabular-nums">
                {item.value}
              </span>
            </div>
            <span className="text-gray-600 text-[10px] mt-0.5">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function setupAutoScroll(container: HTMLDivElement) {
  // Auto-scroll on desktop only
  if (window.innerWidth < 768) return

  let scrollDirection = 1
  let animationId: number
  let isPaused = false

  const autoScroll = () => {
    if (isPaused) {
      animationId = requestAnimationFrame(autoScroll)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = container
    const maxScroll = scrollWidth - clientWidth

    if (scrollLeft >= maxScroll - 2) {
      scrollDirection = -1
    } else if (scrollLeft <= 2) {
      scrollDirection = 1
    }

    container.scrollLeft += scrollDirection * 0.5
    animationId = requestAnimationFrame(autoScroll)
  }

  // Pause on hover/touch
  container.addEventListener('mouseenter', () => { isPaused = true })
  container.addEventListener('mouseleave', () => { isPaused = false })
  container.addEventListener('touchstart', () => { isPaused = true }, { passive: true })
  container.addEventListener('touchend', () => { isPaused = false })

  animationId = requestAnimationFrame(autoScroll)
}
