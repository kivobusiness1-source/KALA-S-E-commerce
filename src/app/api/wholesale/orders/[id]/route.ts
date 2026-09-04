import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ─── GET: Admin only - Get single wholesale order ───

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const order = await db.wholesaleOrder.findUnique({
      where: { id },
      include: {
        items: true,
        orderNotes: { orderBy: { createdAt: 'desc' } },
        paymentMethod: true,
        assignedBy: { select: { id: true, name: true, email: true, role: true } },
        deliverer: { select: { id: true, name: true, phone: true, zone: true } },
      },
    })

    if (!order) return err('Order not found', 404)

    // Livreur can only see orders assigned to them
    if (admin.role === 'livreur' && order.assignedToId !== admin.id) {
      return err('Order not found', 404)
    }

    return ok(order)
  } catch (error) {
    console.error('WholesaleOrder GET error:', error)
    return err('Failed to fetch wholesale order', 500)
  }
}

// ─── PUT: Admin only - Update wholesale order ───

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'ready', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  paymentRef: z.string().nullable().optional(),
  paymentProof: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  delivererId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryZone: z.string().nullable().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const body = await request.json()
    const data = updateOrderSchema.parse(body)

    const existingOrder = await db.wholesaleOrder.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!existingOrder) return err('Order not found', 404)

    // Livreur can only update their own assigned orders
    if (admin.role === 'livreur' && existingOrder.assignedToId !== admin.id) {
      return err('Accès refusé', 403)
    }

    // Staff cannot mark as delivered
    if (admin.role === 'staff' && data.status === 'delivered') {
      return err('Le staff ne peut pas marquer une commande comme livrée', 403)
    }

    const updateData: Record<string, unknown> = {}

    if (data.status) updateData.status = data.status
    if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus
    if (data.paymentRef !== undefined) updateData.paymentRef = data.paymentRef
    if (data.paymentProof !== undefined) updateData.paymentProof = data.paymentProof
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress
    if (data.deliveryZone !== undefined) updateData.deliveryZone = data.deliveryZone

    // Only super_admin/admin can reassign
    if (data.assignedToId !== undefined) {
      if (admin.role === 'super_admin' || admin.role === 'admin') {
        updateData.assignedToId = data.assignedToId
      }
    }

    // Only super_admin/admin can set deliverer
    if (data.delivererId !== undefined) {
      if (admin.role === 'super_admin' || admin.role === 'admin') {
        updateData.delivererId = data.delivererId
      }
    }

    const order = await db.wholesaleOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        orderNotes: { orderBy: { createdAt: 'desc' } },
        paymentMethod: true,
        assignedBy: { select: { id: true, name: true, email: true, role: true } },
        deliverer: { select: { id: true, name: true, phone: true, zone: true } },
      },
    })

    // If status changed, create a system note
    if (data.status && data.status !== existingOrder.status) {
      const statusLabels: Record<string, string> = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        processing: 'En préparation',
        ready: 'Prête',
        shipped: 'Expédiée',
        delivered: 'Livrée',
        cancelled: 'Annulée',
      }
      await db.wholesaleOrderNote.create({
        data: {
          orderId: id,
          content: `Statut changé: ${statusLabels[existingOrder.status] || existingOrder.status} → ${statusLabels[data.status] || data.status}`,
          senderType: 'system',
        },
      })
    }

    // If payment status changed to paid, create note
    if (data.paymentStatus === 'paid' && existingOrder.paymentStatus !== 'paid') {
      await db.wholesaleOrderNote.create({
        data: {
          orderId: id,
          content: 'Paiement confirmé',
          senderType: 'system',
        },
      })
    }

    const details: string[] = []
    if (data.status && data.status !== existingOrder.status) details.push(`status: ${existingOrder.status} → ${data.status}`)
    if (data.paymentStatus && data.paymentStatus !== existingOrder.paymentStatus) details.push(`payment: ${existingOrder.paymentStatus} → ${data.paymentStatus}`)
    if (data.assignedToId !== undefined) details.push(`assigned to: ${data.assignedToId || 'none'}`)

    await logActivity(
      admin.id,
      'UPDATE_WHOLESALE_ORDER',
      `Wholesale order ${existingOrder.orderNumber}: ${details.join(', ')}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map(e => e.message).join(', '), 400)
    }
    console.error('WholesaleOrder PUT error:', error)
    return err('Failed to update wholesale order', 500)
  }
}
