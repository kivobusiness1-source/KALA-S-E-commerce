import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { validateSession } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)

    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)

    const formData = await request.formData()
    const file = formData.get('image')

    if (!file || !(file instanceof File)) {
      return err('Fichier image requis')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return err('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.')
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return err('Fichier trop volumineux. Maximum 5 Mo.')
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

    // Ensure directory exists
    await mkdir(uploadsDir, { recursive: true })

    // Write file
    const filePath = path.join(uploadsDir, filename)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const url = `/uploads/${filename}`

    return ok({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return err('Erreur lors du téléchargement', 500)
  }
}
