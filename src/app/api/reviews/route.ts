import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, hasAdminRole } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { name: true },
        },
      },
    })

    return ok(reviews)
  } catch (error) {
    console.error('Reviews GET error:', error)
    return err('Erreur serveur', 500)
  }
}
