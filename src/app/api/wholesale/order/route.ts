import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

// ─── Helpers ───

function generateOrderNumber(): string {
  const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
  return `GRO-${digits}`
}

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ─── Validation ───

const orderItemSchema = z.object({
  wholesaleProductId: z.string().min(1, 'Product ID is required'),
  lotsQuantity: z.number().int().positive('Lots quantity must be positive'),
})

const createWholesaleOrderSchema = z.object({
  // Customer info
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(1, 'Phone number is required'),
  companyName: z.string().nullable().optional(),
  nif: z.string().nullable().optional(),
  stat: z.string().nullable().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional().default('Brazzaville'),
  quartier: z.string().nullable().optional(),
  // Order items
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  // Payment
  paymentMethodId: z.string().nullable().optional(),
  // Delivery
  deliveryAddress: z.string().nullable().optional(),
  deliveryZone: z.string().nullable().optional(),
  // Notes
  notes: z.string().nullable().optional(),
})

// ─── POST: Public - Place a wholesale order ───

export async function POST(request: NextRequest) {
  try {
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
