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

// ─── GET: Public - Get single wholesale product ───

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.wholesaleProduct.findUnique({ where: { id } })

    if (!product) return err('Product not found', 404)
    if (!product.isActive) return err('Product not available', 404)

    return ok(product)
  } catch (error) {
    console.error('WholesaleProduct GET error:', error)
    return err('Failed to fetch wholesale product', 500)
  }
}

// ─── PUT: Admin only - Update wholesale product ───

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  lotSize: z.number().int().positive().optional(),
  lotUnit: z.string().min(1).optional(),
  pricePerLot: z.number().positive().optional(),
  comparePrice: z.number().positive().nullable().optional(),
  image: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  minLots: z.number().int().min(1).optional(),
  stockLots: z.number().int().min(0).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const body = await request.json()
    const data = updateProductSchema.parse(body)

    const existing = await db.wholesaleProduct.findUnique({ where: { id } })
    if (!existing) return err('Product not found', 404)

    const product = await db.wholesaleProduct.update({
      where: { id },
      data,
    })

    await logActivity(
      admin.id,
      'UPDATE_WHOLESALE_PRODUCT',
      `Updated wholesale product: ${product.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('WholesaleProduct PUT error:', error)
    return err('Failed to update wholesale product', 500)
  }
}

// ─── DELETE: Admin only - Delete wholesale product ───

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const existing = await db.wholesaleProduct.findUnique({ where: { id } })
    if (!existing) return err('Product not found', 404)

    await db.wholesaleProduct.delete({ where: { id } })

    await logActivity(
      admin.id,
      'DELETE_WHOLESALE_PRODUCT',
      `Deleted wholesale product: ${existing.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({ message: 'Product deleted' })
  } catch (error) {
    console.error('WholesaleProduct DELETE error:', error)
    return err('Failed to delete wholesale product', 500)
  }
}
