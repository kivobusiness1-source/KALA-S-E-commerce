import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  text: z.string().min(1).max(200).optional(),
  position: z.enum(['hero', 'promo_bar', 'product_page', 'footer']).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSession()
    if (!session || (session.role !== 'super_admin' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 })
    }
    const cp = await db.catchphrase.update({ where: { id }, data: validated.data })
    await logActivity(session.adminId, 'update_catchphrase', `Phrase modifiée: ${cp.text.slice(0, 50)}`)
    return NextResponse.json({ success: true, data: cp })
  } catch (error) {
    console.error('Update catchphrase error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await validateSession()
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    const { id } = await params
    await db.catchphrase.delete({ where: { id } })
    await logActivity(session.adminId, 'delete_catchphrase', 'Phrase supprimée')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete catchphrase error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
