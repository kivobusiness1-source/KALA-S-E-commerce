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
  }),
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
      },
    })

    if (!order) return err('Order not found', 404)

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
    const { status } = updateOrderSchema.parse(body)

    const existingOrder = await db.order.findUnique({ where: { id } })
    if (!existingOrder) return err('Order not found', 404)

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    })

    // If cancelled, restore stock
    if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
      for (const item of existingOrder.items) {
        await db.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity }, inStock: true },
        })
      }
    }

    await logActivity(
      admin.id,
      'UPDATE_ORDER_STATUS',
      `Order ${existingOrder.orderNumber} status changed: ${existingOrder.status} → ${status}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Order PUT error:', error)
    return err('Failed to update order', 500)
  }
}
