import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable(),
  zone: z.string().optional().nullable(),
  vehicle: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'super_admin' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 })
    }
    const livreur = await db.deliverer.update({ where: { id }, data: validated.data })
    await logActivity(session.id, 'update_deliverer', `Livreur modifié: ${livreur.name}`)
    return NextResponse.json({ success: true, data: livreur })
  } catch (error) {
    console.error('Update livreur error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    const { id } = await params
    const livreur = await db.deliverer.findUnique({ where: { id } })
    if (!livreur) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 })
    await db.deliverer.delete({ where: { id } })
    await logActivity(session.id, 'delete_deliverer', `Livreur supprimé: ${livreur.name}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete livreur error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
