import { NextRequest, NextResponse } from 'next/server'
import { validateSession, checkRateLimit, hasAdminRole } from '@/lib/auth'
import { uploadBuffer, isCloudinaryConfigured, type CloudinaryFolder } from '@/lib/cloudinary'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// ── Allowed upload types ────────────────────────────────────
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB

// ── Map upload context to Cloudinary folder ────────────────
function inferFolder(filename: string, mime: string): CloudinaryFolder {
  if (mime.startsWith('video/')) return 'videos'
  // Admin UI can pass a "folder" field in the form data
  // Default to 'products' as most uploads are product images
  return 'products'
}

// ── Magic-byte sniffing (fallback for missing / non-standard MIME) ──
function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png'
  }
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'image/gif'
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

function sniffVideoType(buf: Buffer): string | null {
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii')
    return brand.startsWith('qt') ? 'video/quicktime' : 'video/mp4'
  }
  if (buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return 'video/webm'
  }
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS') return 'video/ogg'
  return null
}

export async function POST(request: NextRequest) {
  try {
    // ── Admin auth (uploads come from the admin panel) ──────
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    // ── Rate limit: 30 uploads / 5 min / IP ─────────────────
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`upload:${clientIp}`, 30, 5 * 60 * 1000)) {
      return err('Trop de requêtes. Veuillez réessayer plus tard.', 429)
    }

    // ── Parse multipart form ────────────────────────────────
    const formData = await request.formData()
    // The admin UI sends images under "image" and videos under "file".
    const fileEntry = formData.get('image') ?? formData.get('file')
    // Optional folder hint from the admin UI
    const folderHint = formData.get('folder') as string | null

    if (!fileEntry || typeof fileEntry === 'string') {
      console.warn('[upload] rejected: no file field in form')
      return err('Aucun fichier fourni (champs acceptés : "image" ou "file")', 400)
    }

    // File validation
    const file = fileEntry as File
    if (typeof file.arrayBuffer !== 'function') {
      console.warn('[upload] rejected: entry is not a File')
      return err('Fichier invalide', 400)
    }
    if (file.size === 0) {
      console.warn('[upload] rejected: empty file', { name: file.name })
      return err('Le fichier est vide', 400)
    }

    const bytes = Buffer.from(await file.arrayBuffer())

    // ── Detect the real type: MIME first, magic bytes as fallback ──
    let mime = (file.type || '').toLowerCase()
    if (mime === 'image/jpg') mime = 'image/jpeg' // non-standard but common

    let isImage = mime in ALLOWED_IMAGE_TYPES
    let isVideo = mime in ALLOWED_VIDEO_TYPES

    if (!isImage && !isVideo) {
      // MIME missing or unsupported → sniff the actual bytes
      const sniffed = sniffImageType(bytes) ?? sniffVideoType(bytes)
      if (sniffed) {
        mime = sniffed
        isImage = mime in ALLOWED_IMAGE_TYPES
        isVideo = mime in ALLOWED_VIDEO_TYPES
      }
    }

    if (!isImage && !isVideo) {
      console.warn('[upload] rejected: unsupported type', {
        declaredMime: file.type,
        size: file.size,
        name: file.name?.slice(0, 80),
      })
      return err(
        `Type de fichier non supporté (${file.type || 'inconnu'}). Images acceptées : JPEG, PNG, WebP, GIF — Vidéos acceptées : MP4, WebM, OGG, MOV`,
        400,
      )
    }

    // ── Validate size ───────────────────────────────────────
    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    const kindLabel = isImage ? 'image' : 'vidéo'
    if (file.size > maxBytes) {
      console.warn('[upload] rejected: too large', { mime, size: file.size })
      return err(
        `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Maximum pour une ${kindLabel} : ${maxBytes / (1024 * 1024)} Mo`,
        400,
      )
    }

    // ── Generate safe unique filename ───────────────────────
    const ext = (isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES)[mime]
    const random = crypto.randomBytes(6).toString('hex')
    const filename = `${Date.now()}-${random}${ext}`

    // ── Determine Cloudinary folder ────────────────────────
    const cloudinaryFolder: CloudinaryFolder = folderHint && ['products', 'categories', 'hero', 'wholesale', 'videos', 'general'].includes(folderHint)
      ? folderHint as CloudinaryFolder
      : inferFolder(filename, mime)

    // ── Upload to Cloudinary (preferred) or local filesystem ──
    const useCloudinary = isCloudinaryConfigured()

    if (useCloudinary) {
      // ── Cloudinary upload ───────────────────────────────
      try {
        const result = await uploadBuffer(bytes, {
          filename,
          folder: cloudinaryFolder,
          resourceType: isImage ? 'image' : 'video',
        })

        console.log(`[upload] Cloudinary OK: ${result.secureUrl} (${result.bytes} bytes, ${result.width}x${result.height})`)

        return NextResponse.json({
          success: true,
          data: {
            url: result.secureUrl,
            filename,
            size: result.bytes,
            type: mime,
            width: result.width,
            height: result.height,
            publicId: result.publicId,
            storage: 'cloudinary',
          },
        })
      } catch (cloudErr) {
        console.error('[upload] Cloudinary failed, falling back to local:', cloudErr)
        // Fall through to local upload as fallback
      }
    }

    // ── Local filesystem upload (fallback / default) ──────
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, filename), bytes)

    const url = `/uploads/${filename}`
    console.log(`[upload] Local OK: ${url} (${file.size} bytes)`)

    return NextResponse.json({
      success: true,
      data: {
        url,
        filename,
        size: file.size,
        type: mime,
        storage: 'local',
      },
    })
  } catch (error) {
    console.error('Upload POST error:', error)
    return err('Erreur serveur lors du téléchargement du fichier', 500)
  }
}
