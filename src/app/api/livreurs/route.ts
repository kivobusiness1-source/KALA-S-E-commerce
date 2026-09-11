import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'

const delivererSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(8, 'Téléphone invalide'),
  email: z.string().email('Email invalide').optional().nullable(),
  zone: z.string().optional().nullable(),
  vehicle: z.string().optional().nullable(),
})

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// GET /api/livreurs - List all deliverers
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    if (!hasAdminRole(session, ['super_admin', 'admin'])) return NextResponse.json({ success: false, error: 'Accès refusé pour votre rôle' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const where = activeOnly ? { isActive: true } : {}
    const livreurs = await db.deliverer.findMany({
      where,
      include: { _count: { select: { orders: { where: { status: { in: ['shipped', 'processing'] } } } } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: livreurs })
  } catch (error) {
    console.error('Get livreurs error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/livreurs - Create deliverer
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'super_admin' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = delivererSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 })
    }

    const existing = await db.deliverer.findUnique({ where: { phone: validated.data.phone } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Ce numéro de téléphone existe déjà' }, { status: 409 })
    }

    const livreur = await db.deliverer.create({ data: validated.data })
    await logActivity(session.id, 'create_deliverer', `Livreur créé: ${livreur.name} (${livreur.phone})`)

    return NextResponse.json({ success: true, data: livreur }, { status: 201 })
  } catch (error) {
    console.error('Create livreur error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
