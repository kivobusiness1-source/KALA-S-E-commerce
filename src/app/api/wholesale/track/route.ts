import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

// ─── POST: Public - Track order by trackingCode ───

const trackSchema = z.object({
  trackingCode: z.string().min(1, 'Tracking code is required'),
})

// Status timeline mapping
const statusTimeline: Record<string, { label: string; step: number }> = {
  pending: { label: 'En attente', step: 1 },
  confirmed: { label: 'Confirmée', step: 2 },
  processing: { label: 'En préparation', step: 3 },
  ready: { label: 'Prête', step: 4 },
  shipped: { label: 'Expédiée', step: 5 },
  delivered: { label: 'Livrée', step: 6 },
  cancelled: { label: 'Annulée', step: 0 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = trackSchema.safeParse(body)
    if (!parsed.success) {
      return err(parsed.error.issues[0].message, 400)
    }

    const order = await db.wholesaleOrder.findUnique({
      where: { trackingCode: parsed.data.trackingCode },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            lotsQuantity: true,
            lotSize: true,
            lotUnit: true,
            totalUnits: true,
            pricePerLot: true,
            totalPrice: true,
          },
        },
        orderNotes: {
          select: {
            id: true,
            content: true,
            senderType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        paymentMethod: {
          select: {
            id: true,
            name: true,
            icon: true,
            isCash: true,
          },
        },
      },
    })

    if (!order) return err('Order not found. Please check your tracking code.', 404)

    // Build status timeline
    const currentStatus = statusTimeline[order.status] || { label: order.status, step: 0 }
    const timeline = Object.entries(statusTimeline)
      .filter(([, v]) => v.step > 0 && v.step <= (order.status === 'cancelled' ? 0 : currentStatus.step))
      .map(([key, v]) => ({
        status: key,
        label: v.label,
        step: v.step,
        completed: v.step <= currentStatus.step && order.status !== 'cancelled',
      }))
      .sort((a, b) => a.step - b.step)

    return ok({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        trackingCode: order.trackingCode,
        customerName: order.customerName,
        status: order.status,
        statusLabel: currentStatus.label,
        totalAmount: order.totalAmount,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      items: order.items,
      timeline,
      notes: order.orderNotes.filter(n => n.senderType !== 'system' || order.status === 'cancelled'),
      paymentMethod: order.paymentMethod,
    })
  } catch (error) {
    console.error('WholesaleTrack POST error:', error)
    return err('Failed to track order', 500)
  }
}
