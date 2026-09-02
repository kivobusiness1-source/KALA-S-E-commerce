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

const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().min(1),
})

const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional().default('Pointe-Noire'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const query = listOrdersQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {}

    // Role-based filtering
    if (admin.role === 'livreur') {
      // Livreur: only see orders assigned to them via assignedToId
      where.assignedToId = admin.id
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customerName: { contains: query.search } },
        { customerEmail: { contains: query.search } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true, image: true, volume: true } } } },
          assignedBy: { select: { id: true, name: true, email: true, role: true } },
          deliverer: { select: { id: true, name: true, phone: true, zone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.order.count({ where }),
    ])

    return ok({ orders, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('Orders GET error:', error)
    return err('Failed to fetch orders', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // Validate all products exist and have enough stock
    const products = await db.product.findMany({
      where: { id: { in: data.items.map(i => i.productId) } },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of data.items) {
      const product = productMap.get(item.productId)
      if (!product) return err(`Product not found: ${item.productId}`, 400)
      if (!product.isActive) return err(`Product is not available: ${product.name}`, 400)
      if (!product.inStock || product.stockQty < item.quantity) {
        return err(`Insufficient stock for: ${product.name} (available: ${product.stockQty})`, 400)
      }
    }

    // Generate order number
    const count = await db.order.count()
    const orderNumber = `CGC-${String(count + 1).padStart(6, '0')}`

    let totalAmount = 0
    const orderItems = data.items.map(item => {
      const product = productMap.get(item.productId)!
      const unitPrice = product.price
      const totalPrice = unitPrice * item.quantity
      totalAmount += totalPrice
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      }
    })

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address,
        city: data.city,
        totalAmount,
        notes: data.notes,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    })

    // Deduct stock
    for (const item of data.items) {
      const product = productMap.get(item.productId)!
      const newStock = product.stockQty - item.quantity
      await db.product.update({
        where: { id: product.id },
        data: {
          stockQty: newStock,
          inStock: newStock > 0,
        },
      })
    }

    // Award loyalty points: 1 point per 1000 FCFA spent
    const earnedPoints = Math.floor(totalAmount / 1000)
    if (earnedPoints > 0) {
      await db.loyaltyPoint.create({
        data: {
          email: data.customerEmail,
          points: earnedPoints,
          orderId: order.id,
          description: `Commande ${orderNumber} — ${earnedPoints} points gagnés`,
        },
      })
    }

    return ok({ ...order, earnedPoints }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Orders POST error:', error)
    return err('Failed to create order', 500)
  }
}