import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

const noteSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(2000, 'Message trop long'),
})

// GET /api/orders/[id]/notes - Get all notes for an order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    const notes = await db.orderNote.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        senderType: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    console.error('Get order notes error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/orders/[id]/notes - Add a note/reply to an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await validateSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Verify order exists
    const order = await db.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const validated = noteSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 })
    }

    const note = await db.orderNote.create({
      data: {
        orderId: id,
        content: validated.data.content,
        senderType: 'admin',
      },
    })

    await logActivity(session.adminId, 'order_reply', `Réponse ajoutée à la commande ${order.orderNumber}`)

    // Update order timestamp
    await db.order.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: note.id,
        content: note.content,
        senderType: note.senderType,
        createdAt: note.createdAt,
      },
    })
  } catch (error) {
    console.error('Add order note error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
