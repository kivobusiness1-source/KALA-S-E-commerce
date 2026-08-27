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

const updateCategorySchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    const category = await db.category.update({
      where: { id },
      data,
    })

    await logActivity(admin.id, 'UPDATE_CATEGORY', `Updated category: ${category.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Category PUT error:', error)
    return err('Failed to update category', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const category = await db.category.findUnique({ where: { id } })
    if (!category) return err('Category not found', 404)

    // Check if category has products
    const productCount = await db.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return err(`Cannot delete category with ${productCount} product(s). Move or delete products first.`, 400)
    }

    await db.category.delete({ where: { id } })

    await logActivity(admin.id, 'DELETE_CATEGORY', `Deleted category: ${category.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok({ id })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return err('Failed to delete category', 500)
  }
}
