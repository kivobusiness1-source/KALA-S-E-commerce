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

// ─── PUT: Admin only - Update payment method ───

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  accountInfo: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isCash: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const body = await request.json()
    const data = updatePaymentMethodSchema.parse(body)

    const existing = await db.wholesalePaymentMethod.findUnique({ where: { id } })
    if (!existing) return err('Payment method not found', 404)

    const method = await db.wholesalePaymentMethod.update({
      where: { id },
      data,
    })

    await logActivity(
      admin.id,
      'UPDATE_WHOLESALE_PAYMENT_METHOD',
      `Updated wholesale payment method: ${method.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(method)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('WholesalePaymentMethod PUT error:', error)
    return err('Failed to update payment method', 500)
  }
}

// ─── DELETE: Admin only - Delete payment method ───

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const existing = await db.wholesalePaymentMethod.findUnique({ where: { id } })
    if (!existing) return err('Payment method not found', 404)

    // Check if any orders use this payment method
    const ordersUsingMethod = await db.wholesaleOrder.count({
      where: { paymentMethodId: id },
    })

    if (ordersUsingMethod > 0) {
      // Soft delete: deactivate instead
      await db.wholesalePaymentMethod.update({
        where: { id },
        data: { isActive: false },
      })
      await logActivity(
        admin.id,
        'DEACTIVATE_WHOLESALE_PAYMENT_METHOD',
        `Deactivated wholesale payment method (has ${ordersUsingMethod} orders): ${existing.name}`,
        request.headers.get('x-forwarded-for') ?? undefined,
      )
      return ok({ message: 'Payment method deactivated (has associated orders)', deactivated: true })
    }

    await db.wholesalePaymentMethod.delete({ where: { id } })

    await logActivity(
      admin.id,
      'DELETE_WHOLESALE_PAYMENT_METHOD',
      `Deleted wholesale payment method: ${existing.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({ message: 'Payment method deleted' })
  } catch (error) {
    console.error('WholesalePaymentMethod DELETE error:', error)
    return err('Failed to delete payment method', 500)
  }
}
