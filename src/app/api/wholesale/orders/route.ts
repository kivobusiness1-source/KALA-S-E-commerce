import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ─── GET: Admin only - List all wholesale orders ───

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
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
      where.assignedToId = admin.id
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { trackingCode: { contains: query.search } },
        { customerName: { contains: query.search } },
        { customerEmail: { contains: query.search } },
        { companyName: { contains: query.search } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.wholesaleOrder.findMany({
        where,
        include: {
          items: true,
          paymentMethod: { select: { id: true, name: true, icon: true, isCash: true } },
          assignedBy: { select: { id: true, name: true, email: true, role: true } },
          deliverer: { select: { id: true, name: true, phone: true, zone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.wholesaleOrder.count({ where }),
    ])

    return ok({
      orders,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('WholesaleOrders GET error:', error)
    return err('Failed to fetch wholesale orders', 500)
  }
}
