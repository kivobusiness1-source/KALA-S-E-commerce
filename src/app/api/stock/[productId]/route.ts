import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const stockAdjustSchema = z.object({
  change: z.number().int().describe('Positive for entry, negative for exit'),
  reason: z.string().optional(),
  newMinAlert: z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const session = await getSession(request)
    if (!session) {
      return err('Non autorisé', 401)
    }

    const { productId } = await params
    const body = await request.json()
    const data = stockAdjustSchema.parse(body)

    // Find product
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return err('Produit non trouvé', 404)

    const previousQty = product.stockQty
    const newQty = Math.max(0, previousQty + data.change)

    // Update product stock
    const updateData: Record<string, unknown> = {
      stockQty: newQty,
      inStock: newQty > 0,
    }
    if (data.newMinAlert !== undefined) {
      updateData.minStockAlert = data.newMinAlert
    }

    await db.product.update({
      where: { id: productId },
      data: updateData,
    })

    // Create stock history record
    await db.stockHistory.create({
      data: {
        productId,
        previousQty,
        newQty,
        changeReason: data.reason || (data.change > 0 ? 'Entrée de stock' : 'Sortie de stock'),
        adminId: session.id,
      },
    })

    // Log activity
    const changeType = data.change > 0 ? 'STOCK_IN' : 'STOCK_OUT'
    await logActivity(
      session.id,
      changeType,
      `${product.name}: ${previousQty} → ${newQty} (${data.change > 0 ? '+' : ''}${data.change}) ${data.reason || ''}`.trim(),
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({ previousQty, newQty, change: data.change })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map(e => e.message).join(', '), 400)
    }
    console.error('Stock adjust error:', error)
    return err('Erreur serveur', 500)
  }
}
