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

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().nullable(),
  categoryId: z.string().optional(),
  image: z.string().optional().nullable(),
  images: z.string().optional(),
  volume: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  inStock: z.boolean().optional(),
  stockQty: z.number().int().min(0).optional(),
  minStockAlert: z.number().int().min(0).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await getAdmin(request)
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product || (!admin && !product.isActive)) {
      return err('Product not found', 404)
    }

    return ok(product)
  } catch (error) {
    console.error('Product GET error:', error)
    return err('Failed to fetch product', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const body = await request.json()
    const data = updateProductSchema.parse(body)

    // Log stock history if stock quantity changed
    if (data.stockQty !== undefined) {
      const prevProduct = await db.product.findUnique({ where: { id }, select: { stockQty: true } })
      if (prevProduct && prevProduct.stockQty !== data.stockQty) {
        await db.stockHistory.create({
          data: {
            productId: id,
            previousQty: prevProduct.stockQty,
            newQty: data.stockQty,
            changeReason: body.changeReason || 'Ajustement manuel',
            adminId: admin.id,
          },
        })
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true },
    })

    await logActivity(admin.id, 'UPDATE_PRODUCT', `Updated product: ${product.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Product PUT error:', error)
    return err('Failed to update product', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { id } = await params
    const product = await db.product.findUnique({ where: { id } })
    if (!product) return err('Product not found', 404)

    await db.product.delete({ where: { id } })

    await logActivity(admin.id, 'DELETE_PRODUCT', `Deleted product: ${product.name}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok({ id })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return err('Failed to delete product', 500)
  }
}
