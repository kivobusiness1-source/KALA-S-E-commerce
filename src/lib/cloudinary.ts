import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
})

export { cloudinary }

// ── Upload folder structure on Cloudinary ────────────────────
// kala/             ← root folder
//   products/       ← product images
//   categories/     ← category images
//   hero/           ← hero/banner images
//   wholesale/      ← wholesale product images
//   videos/         ← video files

export type CloudinaryFolder = 'products' | 'categories' | 'hero' | 'wholesale' | 'videos' | 'general'

const BASE_FOLDER = 'kala'

export function getCloudinaryFolder(folder: CloudinaryFolder = 'general'): string {
  return `${BASE_FOLDER}/${folder}`
}

// ── Upload a buffer to Cloudinary ────────────────────────────
export interface UploadResult {
  url: string          // Full Cloudinary URL
  secureUrl: string    // HTTPS URL
  publicId: string     // Cloudinary public ID (for delete/transform)
  width: number
  height: number
  format: string
  bytes: number
  resourceType: 'image' | 'video'
}

export async function uploadBuffer(
  buffer: Buffer,
  options: {
    filename: string
    folder?: CloudinaryFolder
    resourceType?: 'image' | 'video'
    maxWidth?: number   // Auto-resize images wider than this
    maxHeight?: number
  }
): Promise<UploadResult> {
  const {
    filename,
    folder = 'general',
    resourceType = 'image',
    maxWidth = 2000,
    maxHeight = 2000,
  } = options

  const cloudFolder = getCloudinaryFolder(folder)

  // Generate a unique public_id from the filename
  const publicId = `${cloudFolder}/${filename.replace(/\.[^.]+$/, '')}`

  const result = await new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: cloudFolder,
        resource_type: resourceType,
        // Auto-transform: limit dimensions for optimization
        transformation: resourceType === 'image'
          ? [{ width: maxWidth, height: maxHeight, crop: 'limit' }]
          : undefined,
        // Quality optimization
        quality: 'auto',
        fetch_format: 'auto',
        // Overwrite if same public_id exists
        overwrite: true,
        // Tags for organization
        tags: ['kala', folder],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
          return
        }
        if (!result) {
          reject(new Error('Cloudinary upload returned no result'))
          return
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type as 'image' | 'video',
        })
      }
    )

    uploadStream.end(buffer)
  })

  return result
}

// ── Delete a file from Cloudinary ────────────────────────────
export async function deleteFromCloudinary(
  publicIdOrUrl: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> {
  try {
    // If it's a URL, extract the public_id
    let publicId = publicIdOrUrl
    if (publicIdOrUrl.startsWith('http')) {
      // Parse URL: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
      const urlObj = new URL(publicIdOrUrl)
      const pathParts = urlObj.pathname.split('/')
      // Find the index after 'upload' and version
      const uploadIdx = pathParts.indexOf('upload')
      if (uploadIdx >= 0 && uploadIdx + 2 < pathParts.length) {
        // Skip 'upload', version (v1234567), then join the rest
        const afterUpload = pathParts.slice(uploadIdx + 2)
        // Remove the file extension from the last part
        const lastPart = afterUpload[afterUpload.length - 1]
        afterUpload[afterUpload.length - 1] = lastPart.replace(/\.[^.]+$/, '')
        publicId = afterUpload.join('/')
      }
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    return result.result === 'ok'
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

// ── Generate optimized URL for display ───────────────────────
export interface TransformOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'pad'
  quality?: string | number
  format?: string
  blur?: number
  radius?: number | string
}

export function getOptimizedUrl(
  publicIdOrUrl: string,
  options: TransformOptions = {}
): string {
  // If it's not a Cloudinary URL, return as-is (local/external)
  if (!publicIdOrUrl.includes('cloudinary') && !publicIdOrUrl.startsWith('kala/')) {
    return publicIdOrUrl
  }

  // If it's a full URL, we need to extract the public_id
  let publicId = publicIdOrUrl
  if (publicIdOrUrl.startsWith('http')) {
    try {
      const urlObj = new URL(publicIdOrUrl)
      const pathParts = urlObj.pathname.split('/')
      const uploadIdx = pathParts.indexOf('upload')
      if (uploadIdx >= 0 && uploadIdx + 2 < pathParts.length) {
        const afterUpload = pathParts.slice(uploadIdx + 2)
        const lastPart = afterUpload[afterUpload.length - 1]
        afterUpload[afterUpload.length - 1] = lastPart.replace(/\.[^.]+$/, '')
        publicId = afterUpload.join('/')
      }
    } catch {
      return publicIdOrUrl
    }
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    blur,
    radius,
  } = options

  const transformation: Record<string, unknown> = { quality, fetch_format: format }
  if (width) transformation.width = width
  if (height) transformation.height = height
  if (width || height) transformation.crop = crop
  if (blur) transformation.effect = `blur:${blur}`
  if (radius !== undefined) transformation.radius = radius

  return cloudinary.url(publicId, {
    transformation,
    secure: true,
    sign_url: false,
  }) || publicIdOrUrl
}

// ── Check if a URL is a Cloudinary URL ───────────────────────
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('cloudinary')
}

// ── Check if Cloudinary is configured ────────────────────────
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
