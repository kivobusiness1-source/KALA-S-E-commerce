import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for video support

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
])

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
])

const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES])

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Unauthorized', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Unauthorized', 401)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const image = formData.get('image') as File | null

    const uploadFile = file || image
    if (!uploadFile) return err('No file provided')

    if (!ALLOWED_TYPES.has(uploadFile.type)) {
      return err(`File type not allowed. Allowed: images (jpeg, png, gif, webp, svg) and videos (mp4, webm, ogg, mov)`)
    }

    if (uploadFile.size > MAX_FILE_SIZE) {
      return err(`File too large. Max size: 50MB`)
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const ext = uploadFile.name.split('.').pop() || 'bin'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const filename = `${timestamp}-${random}.${ext}`

    const filePath = path.join(uploadsDir, filename)
    const buffer = Buffer.from(await uploadFile.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/uploads/${filename}`
    const isVideo = ALLOWED_VIDEO_TYPES.has(uploadFile.type)

    return ok({
      url,
      filename,
      type: uploadFile.type,
      size: uploadFile.size,
      isVideo,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return err('Upload failed', 500)
  }
}
