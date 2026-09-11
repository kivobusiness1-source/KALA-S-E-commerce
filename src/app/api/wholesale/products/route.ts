import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ─── GET: Public - List active wholesale products ───

const listQuerySchema = z.object({
  search: z.string().optional(),
  all: z.enum(['true', 'false']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = listQuerySchema.parse(Object.fromEntries(searchParams))

    const admin = await getAdmin(request)
    const isAdmin = !!admin

    const where: Record<string, unknown> = {}

    if (!isAdmin || query.all !== 'true') {
      where.isActive = true
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ]
    }

    const products = await db.wholesaleProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return ok(products)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('WholesaleProducts GET error:', error)
    return err('Failed to fetch wholesale products', 500)
  }
}

// ─── POST: Admin only - Create wholesale product ───

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  lotSize: z.number().int().positive('Lot size must be positive'),
  lotUnit: z.string().min(1, 'Lot unit is required'),
  pricePerLot: z.number().positive('Price per lot must be positive'),
  comparePrice: z.number().positive().nullable().optional(),
  image: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  minLots: z.number().int().min(1).optional().default(5),
  stockLots: z.number().int().min(0).optional().default(0),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const body = await request.json()
    const data = createProductSchema.parse(body)

    const product = await db.wholesaleProduct.create({ data })

    await logActivity(
      admin.id,
      'CREATE_WHOLESALE_PRODUCT',
      `Created wholesale product: ${product.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(product, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('WholesaleProducts POST error:', error)
    return err('Failed to create wholesale product', 500)
  }
}
