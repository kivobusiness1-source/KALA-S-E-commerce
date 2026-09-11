import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const updateReviewSchema = z.object({
  isApproved: z.boolean(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const body = await request.json()
    const { isApproved } = updateReviewSchema.parse(body)

    const review = await db.review.update({
      where: { id },
      data: { isApproved },
    })

    await logActivity(
      admin.id,
      'MODERATE_REVIEW',
      `${isApproved ? 'Approuvé' : 'Rejeté'} l'avis ${id}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(review)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Données invalides', 400)
    }
    console.error('Review PUT error:', error)
    return err('Erreur serveur', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params

    await db.review.delete({ where: { id } })

    await logActivity(
      admin.id,
      'DELETE_REVIEW',
      `Supprimé l'avis ${id}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(null)
  } catch (error) {
    console.error('Review DELETE error:', error)
    return err('Erreur serveur', 500)
  }
}
