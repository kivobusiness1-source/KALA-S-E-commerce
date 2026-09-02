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

const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const updateOrderSchema = z.object({
  status: z.enum(validStatuses as [string, ...string[]], {
    errorMap: () => ({ message: `Status must be one of: ${validStatuses.join(', ')}` }),
  }).optional(),
  assignedToId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { name: true, image: true, volume: true } } } },
        assignedBy: { select: { id: true, name: true, email: true, role: true } },
        deliverer: { select: { id: true, name: true, phone: true, zone: true } },
      },
    })

    if (!order) return err('Order not found', 404)

    // Livreur: can only see orders assigned to them
    if (admin.role === 'livreur' && order.assignedToId !== admin.id) {
      return err('Order not found', 404)
    }

    return ok(order)
  } catch (error) {
    console.error('Order GET error:', error)
    return err('Failed to fetch order', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const body = await request.json()
    const parsed = updateOrderSchema.parse(body)

    const existingOrder = await db.order.findUnique({ where: { id } })
    if (!existingOrder) return err('Order not found', 404)

    // Livreur: can only update their own assigned orders
    if (admin.role === 'livreur' && existingOrder.assignedToId !== admin.id) {
      return err('Accès refusé', 403)
    }

    // Staff: cannot set status to 'delivered'
    if (admin.role === 'staff' && parsed.status === 'delivered') {
      return err('Le staff ne peut pas marquer une commande comme livrée', 403)
    }

    // Only super_admin/admin can reassign orders
    const updateData: Record<string, unknown> = {}
    if (parsed.status) {
      updateData.status = parsed.status
    }
    if (parsed.assignedToId !== undefined) {
      if (admin.role === 'super_admin' || admin.role === 'admin') {
        updateData.assignedToId = parsed.assignedToId
      }
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        assignedBy: { select: { id: true, name: true, email: true, role: true } },
        deliverer: { select: { id: true, name: true, phone: true, zone: true } },
      },
    })

    // If cancelled, restore stock
    if (parsed.status === 'cancelled' && existingOrder.status !== 'cancelled') {
      for (const item of existingOrder.items) {
        await db.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity }, inStock: true },
        })
      }
    }

    const details = []
    if (parsed.status) details.push(`status: ${existingOrder.status} → ${parsed.status}`)
    if (parsed.assignedToId !== undefined) details.push(`assigned to: ${parsed.assignedToId || 'none'}`)

    await logActivity(
      admin.id,
      'UPDATE_ORDER',
      `Order ${existingOrder.orderNumber}: ${details.join(', ')}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.errors.map(e => e.message).join(', '), 400)
    }
    console.error('Order PUT error:', error)
    return err('Failed to update order', 500)
  }
}
