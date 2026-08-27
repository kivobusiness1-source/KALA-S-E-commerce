'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'

export function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 2000
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

/**
 * CountUp - Sophisticated counter with easing and French number formatting
 * Uses requestAnimationFrame for smooth 60fps animation
 */
export function CountUp({ target, duration = 2000, prefix = '', suffix = '' }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const animationRef = useRef<number | null>(null)

  // French number formatting: spaces as thousands separator
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }, [])

  useEffect(() => {
    if (!isInView) return

    const startTime = performance.now()
    const from = 0
    const to = target

    // Ease-out cubic for smooth deceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const currentValue = Math.round(from + (to - from) * easedProgress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isInView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  )
}

/**
 * MarqueeText - Horizontal scrolling marquee for text
 * Uses CSS animation with translateX for seamless looping
 */
export function MarqueeText({ children, speed = 30, className = '' }: { children: React.ReactNode; speed?: number; className?: string }) {
  // Calculate duration based on speed (lower speed = faster scroll)
  const animationDuration = `${speed}s`

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div
        className="inline-block animate-[marquee-scroll_var(--marquee-duration)_linear_infinite]"
        style={{ '--marquee-duration': animationDuration } as React.CSSProperties}
      >
        <span className="inline-block">{children}</span>
        <span className="inline-block mx-8">{children}</span>
        <span className="inline-block">{children}</span>
        <span className="inline-block mx-8">{children}</span>
      </div>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

/**
 * PulseDot - Simple pulsing dot indicator
 */
export function PulseDot({ color = 'emerald' }: { color?: string }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    rose: 'bg-rose-500',
  }
  const pingClasses: Record<string, string> = {
    emerald: 'bg-emerald-400',
    teal: 'bg-teal-400',
    amber: 'bg-amber-400',
    cyan: 'bg-cyan-400',
    rose: 'bg-rose-400',
  }

  return (
    <span className="relative inline-flex">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${pingClasses[color] || pingClasses.emerald}`} />
      <span className={`relative inline-flex w-2 h-2 rounded-full ${colorClasses[color] || colorClasses.emerald}`} />
    </span>
  )
}

export function TypingEffect({ phrases }: { phrases: string[] }) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const phrase = phrases[currentPhraseIndex]
    if (!isDeleting) {
      if (currentText.length < phrase.length) {
        const timeout = setTimeout(() => {
          setCurrentText(phrase.slice(0, currentText.length + 1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(true)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setIsDeleting(false)
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
        }, 50)
        return () => clearTimeout(timeout)
      }
    }
  }, [currentText, isDeleting, currentPhraseIndex, phrases])

  return (
    <span className="text-emerald-300 font-bold text-xl">
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
