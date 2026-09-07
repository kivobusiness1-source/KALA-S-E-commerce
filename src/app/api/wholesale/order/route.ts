import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/auth'
import { randomInt } from 'crypto'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

// ─── Helpers ───

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'GRO-'
  for (let i = 0; i < 6; i++) {
    result += chars[randomInt(0, chars.length)]
  }
  return result
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars[randomInt(0, chars.length)]
  }
  return result
}

// ─── Validation ───

const orderItemSchema = z.object({
  wholesaleProductId: z.string().min(1, 'Product ID is required'),
  lotsQuantity: z.number().int().positive('Lots quantity must be positive'),
})

const createWholesaleOrderSchema = z.object({
  // Customer info
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: z.string().email('Invalid email address').max(254),
  customerPhone: z.string().min(1, 'Phone number is required').max(20),
  companyName: z.string().max(200).nullable().optional(),
  nif: z.string().max(50).nullable().optional(),
  stat: z.string().max(50).nullable().optional(),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().max(200).optional().default('Brazzaville'),
  quartier: z.string().max(200).nullable().optional(),
  // Order items
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  // Payment
  paymentMethodId: z.string().nullable().optional(),
  // Delivery
  deliveryAddress: z.string().max(500).nullable().optional(),
  deliveryZone: z.string().max(200).nullable().optional(),
  // Notes
  notes: z.string().max(5000).nullable().optional(),
})

// ─── POST: Public - Place a wholesale order ───

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`wholesale-order:${clientIp}`, 5, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const body = await request.json()
    const data = createWholesaleOrderSchema.parse(body)

    // Validate payment method if provided
    if (data.paymentMethodId) {
      const paymentMethod = await db.wholesalePaymentMethod.findUnique({
        where: { id: data.paymentMethodId },
      })
      if (!paymentMethod || !paymentMethod.isActive) {
        return err('Invalid or inactive payment method', 400)
      }
    }

    // Validate all products exist and check min lots
    const productIds = data.items.map(i => i.wholesaleProductId)
    const products = await db.wholesaleProduct.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of data.items) {
      const product = productMap.get(item.wholesaleProductId)
      if (!product) return err(`Product not found: ${item.wholesaleProductId}`, 400)
      if (!product.isActive) return err(`Product is not available: ${product.name}`, 400)
      if (item.lotsQuantity < product.minLots) {
        return err(`Minimum ${product.minLots} lots required for ${product.name}, got ${item.lotsQuantity}`, 400)
      }
      if (product.stockLots > 0 && item.lotsQuantity > product.stockLots) {
        return err(`Insufficient stock for ${product.name}: ${product.stockLots} lots available, ${item.lotsQuantity} requested`, 400)
      }
    }

    // Generate unique order number and tracking code
    let orderNumber = generateOrderNumber()
    let trackingCode = generateTrackingCode()

    // Ensure uniqueness (very unlikely collision, but safe)
    let existingOrder = await db.wholesaleOrder.findFirst({
      where: { OR: [{ orderNumber }, { trackingCode }] },
    })
    while (existingOrder) {
      orderNumber = generateOrderNumber()
      trackingCode = generateTrackingCode()
      existingOrder = await db.wholesaleOrder.findFirst({
        where: { OR: [{ orderNumber }, { trackingCode }] },
      })
    }

    // Calculate total and build order items
    let totalAmount = 0
    const orderItems = data.items.map(item => {
      const product = productMap.get(item.wholesaleProductId)!
      const pricePerLot = product.pricePerLot
      const totalPrice = pricePerLot * item.lotsQuantity
      totalAmount += totalPrice
      return {
        wholesaleProductId: product.id,
        productName: product.name,
        lotsQuantity: item.lotsQuantity,
        lotSize: product.lotSize,
        lotUnit: product.lotUnit,
        totalUnits: item.lotsQuantity * product.lotSize,
        pricePerLot,
        totalPrice,
      }
    })

    // Create the order with items
    const order = await db.wholesaleOrder.create({
      data: {
        orderNumber,
        trackingCode,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        companyName: data.companyName,
        nif: data.nif,
        stat: data.stat,
        address: data.address,
        city: data.city,
        quartier: data.quartier,
        totalAmount,
        notes: data.notes,
        paymentMethodId: data.paymentMethodId,
        deliveryAddress: data.deliveryAddress,
        deliveryZone: data.deliveryZone,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    })

    // Deduct stock for products that track stock
    for (const item of data.items) {
      const product = productMap.get(item.wholesaleProductId)!
      if (product.stockLots > 0) {
        await db.wholesaleProduct.update({
          where: { id: product.id },
          data: { stockLots: { decrement: item.lotsQuantity } },
        })
      }
    }

    // Create a system note
    await db.wholesaleOrderNote.create({
      data: {
        orderId: order.id,
        content: `Commande créée. Montant total: ${totalAmount.toLocaleString()} FCFA`,
        senderType: 'system',
      },
    })

    return ok({
      order,
      trackingCode,
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('WholesaleOrder POST error:', error)
    return err('Failed to create wholesale order', 500)
  }
}
