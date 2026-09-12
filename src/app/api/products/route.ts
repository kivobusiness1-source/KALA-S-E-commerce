import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const querySchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().max(200).optional(),
  featured: z.enum(['true', 'false']).optional(),
  all: z.enum(['true', 'false']).optional(),
  slug: z.string().max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const admin = await getAdmin(request)
    const isAdmin = !!admin

    const where: Prisma.ProductWhereInput = {}

    // Only filter by isActive for non-admin or if 'all' is not set
    if (!isAdmin || query.all !== 'true') {
      where.isActive = true
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.featured === 'true') {
      where.isFeatured = true
    }

    if (query.slug) {
      where.slug = query.slug
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average ratings for all products
    const productIds = products.map(p => p.id)
    const ratingAggregates = productIds.length > 0
      ? await db.review.groupBy({
          by: ['productId'],
          where: { productId: { in: productIds }, isApproved: true },
          _avg: { rating: true },
          _count: { id: true },
        })
      : []

    const ratingMap = new Map(ratingAggregates.map(r => [r.productId, { avg: r._avg.rating || 0, count: r._count.id }]))

    const productsWithRatings = products.map(p => {
      const r = ratingMap.get(p.id)
      return {
        ...p,
        averageRating: r ? Math.round(r.avg * 10) / 10 : 0,
        reviewCount: r ? r.count : 0,
      }
    })

    // If querying by slug, return single product or 404
    if (query.slug) {
      if (productsWithRatings.length === 0) {
        return err('Product not found', 404)
      }
      return ok(productsWithRatings[0])
    }

    return ok(productsWithRatings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('Products GET error:', error)
    return err('Failed to fetch products', 500)
  }
}

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional(),
  longDescription: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  image: z.string().max(500).optional().nullable(),
  images: z.string().max(5000).optional(),
  volume: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  inStock: z.boolean().optional().default(true),
  stockQty: z.number().int().min(0).optional().default(0),
  minStockAlert: z.number().int().min(0).optional().default(10),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const body = await request.json()
    const data = createProductSchema.parse(body)

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const product = await db.product.create({
      data: {
        ...data,
        slug,
        images: data.images || '[]',
      },
      include: { category: true },
    })

    await logActivity(admin.id, 'CREATE_PRODUCT', `Created product: ${product.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(product, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Products POST error:', error)
    return err('Failed to create product', 500)
  }
}
