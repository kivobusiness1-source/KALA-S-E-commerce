import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'

// DELETE /api/orders/[id]/notes/[noteId] - Delete a note

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getSession(_request)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    const { id, noteId } = await params

    const note = await db.orderNote.findFirst({
      where: { id: noteId, orderId: id },
    })

    if (!note) {
      return NextResponse.json({ success: false, error: 'Note introuvable' }, { status: 404 })
    }

    await db.orderNote.delete({ where: { id: noteId } })

    await logActivity(session.id, 'delete_order_note', `Note supprimée de la commande ${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete order note error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
