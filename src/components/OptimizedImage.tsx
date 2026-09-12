'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  fallbackSrc?: string
}

// Check if a URL is a Cloudinary URL
function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

// Generate a Cloudinary optimized URL with transformation parameters
function getCloudinaryOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  if (!isCloudinaryUrl(url)) return url

  const { width, height, quality = 80 } = options

  try {
    // Insert transformation parameters into the Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud}/image/upload/v{ver}/{public_id}.{fmt}
    // Becomes: https://res.cloudinary.com/{cloud}/image/upload/w_{w},h_{h},q_{q},f_auto/v{ver}/{public_id}.{fmt}
    const transforms: string[] = []

    if (width) transforms.push(`w_${width}`)
    if (height) transforms.push(`h_${height}`)
    transforms.push(`q_${quality}`)
    transforms.push('f_auto') // Auto format (WebP when supported)

    if (width || height) transforms.push('c_limit') // Don't upscale

    const transformStr = transforms.join(',')

    return url.replace('/image/upload/', `/image/upload/${transformStr}/`)
  } catch {
    return url
  }
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 80,
  fallbackSrc = '/placeholder-product.png',
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
  const [hasError, setHasError] = useState(false)

  // Optimize Cloudinary URLs
  const optimizedSrc = isCloudinaryUrl(imgSrc)
    ? getCloudinaryOptimizedUrl(imgSrc, { width, height, quality })
    : imgSrc

  // For Cloudinary images, we can use Next.js Image with remote patterns
  // For local images, use as-is
  const isRemote = optimizedSrc.startsWith('http')

  if (!optimizedSrc || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className || ''}`}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.91-5.91a2.25 2.25 0 013.18 0l5.91 5.91M16.5 12.75l1.5-1.5a2.25 2.25 0 013.18 0l1.5 1.5M2.25 18V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12A2.25 2.25 0 0119.5 20.25h-15A2.25 2.25 0 012.25 18z"
          />
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      priority={priority}
      fill={fill}
      sizes={sizes}
      quality={quality}
      unoptimized={isRemote} // Cloudinary already optimizes; skip Next.js optimization for remote
      onError={() => {
        if (!hasError) {
          setHasError(true)
          setImgSrc(fallbackSrc)
        }
      }}
    />
  )
}
