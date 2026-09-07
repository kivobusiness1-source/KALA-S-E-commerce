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

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1, 'Slug is required').max(200),
  description: z.string().max(5000).optional(),
  image: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().optional(),
})

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return ok(categories)
  } catch (error) {
    console.error('Categories GET error:', error)
    return err('Failed to fetch categories', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const body = await request.json()
    const data = createCategorySchema.parse(body)

    const category = await db.category.create({ data })

    await logActivity(admin.id, 'CREATE_CATEGORY', `Created category: ${category.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(category, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Categories POST error:', error)
    return err('Failed to create category', 500)
  }
}
