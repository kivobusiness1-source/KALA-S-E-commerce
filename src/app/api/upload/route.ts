import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises'
import { join } from 'path'

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function ensureDir() {
  try { await mkdir(UPLOADS_DIR, { recursive: true }) } catch { /* exists */ }
}

async function cleanupOldFiles() {
  try {
    const files = await readdir(UPLOADS_DIR)
    if (files.length > 200) {
      const withStats = await Promise.all(
        files.map(async (f) => ({ name: f, mtime: (await stat(join(UPLOADS_DIR, f))).mtimeMs }))
      )
      withStats.sort((a, b) => b.mtime - a.mtime)
      for (const old of withStats.slice(200)) {
        try { await unlink(join(UPLOADS_DIR, old.name)) } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    const session = await validateSession(token)
    if (!session) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorise' }, { status: 400 })
    }

    await ensureDir()

    const ext = file.name.split('.').pop() || 'png'
    const suffix = Math.random().toString(36).slice(2, 8)
    const filename = `${Date.now()}-${suffix}.${ext}`
    const filepath = join(UPLOADS_DIR, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    cleanupOldFiles()

    return NextResponse.json({
      data: { url: `/uploads/${filename}`, filename },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
  }
}
