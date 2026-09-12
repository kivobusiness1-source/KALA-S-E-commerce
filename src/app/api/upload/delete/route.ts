import { NextRequest, NextResponse } from 'next/server'
import { validateSession, hasAdminRole } from '@/lib/auth'
import { deleteFromCloudinary, isCloudinaryUrl, isCloudinaryConfigured } from '@/lib/cloudinary'
import { unlink } from 'fs/promises'
import path from 'path'

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin auth
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé', 403)

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const publicId = searchParams.get('publicId')

    if (!url && !publicId) {
      return err('Paramètre "url" ou "publicId" requis', 400)
    }

    // Delete from Cloudinary
    if (isCloudinaryConfigured()) {
      const target = publicId || url!
      if (isCloudinaryUrl(target) || target.startsWith('kala/')) {
        // Detect resource type from URL
        const isVideo = target.includes('/video/') || target.includes('resource_type=video')
        const deleted = await deleteFromCloudinary(target, isVideo ? 'video' : 'image')

        if (deleted) {
          return NextResponse.json({ success: true, message: 'Fichier supprimé de Cloudinary' })
        }
        return err('Échec de la suppression Cloudinary', 500)
      }
    }

    // Delete from local filesystem (fallback)
    if (url && url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', url)
      try {
        await unlink(filePath)
        return NextResponse.json({ success: true, message: 'Fichier local supprimé' })
      } catch {
        return err('Fichier local introuvable', 404)
      }
    }

    return err('Aucune action de suppression applicable', 400)
  } catch (error) {
    console.error('Upload DELETE error:', error)
    return err('Erreur serveur', 500)
  }
}
