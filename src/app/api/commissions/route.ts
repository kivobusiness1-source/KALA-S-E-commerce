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

// ── GET: List commissions (admin only) ─────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  affiliateId: z.string().optional(),
  status: z.enum(['pending', 'validated', 'paid', 'cancelled'] as [string, ...string[]]).optional(),
  productId: z.string().optional(),
  dateFrom: z.string().optional(), // ISO date
  dateTo: z.string().optional(),   // ISO date
  orderId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return err('Access denied', 403)
    }

    const { searchParams } = new URL(request.url)
    const query = listQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {}

    if (query.affiliateId) where.affiliateId = query.affiliateId
    if (query.status) where.status = query.status
    if (query.productId) where.productId = query.productId
    if (query.orderId) where.orderId = query.orderId

    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {}
      if (query.dateFrom) createdAt.gte = new Date(query.dateFrom)
      if (query.dateTo) createdAt.lte = new Date(query.dateTo)
      where.createdAt = createdAt
    }

    const [commissions, total] = await Promise.all([
      db.commission.findMany({
        where,
        include: {
          affiliate: { select: { id: true, name: true, code: true, email: true } },
          order: { select: { id: true, orderNumber: true, status: true } },
          orderItem: { select: { id: true, productName: true, variantName: true, quantity: true } },
          product: { select: { id: true, name: true, image: true } },
          variant: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.commission.count({ where }),
    ])

    // Summary stats grouped by status
    const statusCounts = await db.commission.groupBy({
      by: ['status'],
      where: query.affiliateId ? { affiliateId: query.affiliateId } : {},
      _sum: { commissionTotal: true },
      _count: true,
    })

    return ok({
      commissions,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      summary: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
        total: s._sum.commissionTotal ?? 0,
      })),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('Commissions GET error:', error)
    return err('Failed to fetch commissions', 500)
  }
}

// ── PUT: Update commission status (admin only) ─────────────

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['validated', 'paid', 'cancelled'] as [string, ...string[]]),
  notes: z.string().max(1000).optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return err('Access denied. Only admins can update commission status.', 403)
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const commission = await db.commission.findUnique({
      where: { id: data.id },
      include: { affiliate: true },
    })

    if (!commission) return err('Commission not found', 404)

    // ── Validate status transitions ─────────────────────────
    // pending → validated or cancelled
    // validated → paid or cancelled
    // paid → cannot change
    // cancelled → cannot change
    const currentStatus = commission.status

    if (currentStatus === 'pending') {
      if (data.status !== 'validated' && data.status !== 'cancelled') {
        return err(
          `Cannot change commission from "${currentStatus}" to "${data.status}". Allowed: validated, cancelled`,
          400,
        )
      }
    } else if (currentStatus === 'validated') {
      if (data.status !== 'paid' && data.status !== 'cancelled') {
        return err(
          `Cannot change commission from "${currentStatus}" to "${data.status}". Allowed: paid, cancelled`,
          400,
        )
      }
    } else if (currentStatus === 'paid') {
      return err('Cannot change a paid commission status', 400)
    } else if (currentStatus === 'cancelled') {
      return err('Cannot change a cancelled commission status', 400)
    }

    // ── Build update data ───────────────────────────────────
    const updateData: Record<string, unknown> = {
      status: data.status,
      notes: data.notes ?? commission.notes,
    }

    if (data.status === 'validated') {
      updateData.validatedAt = new Date()
    }

    if (data.status === 'paid') {
      updateData.paidAt = new Date()
    }

    // ── Apply within transaction (for affiliate earnings) ───
    const result = await db.$transaction(async (tx) => {
      const updated = await tx.commission.update({
        where: { id: data.id },
        data: updateData,
        include: {
          affiliate: { select: { id: true, name: true, code: true } },
          order: { select: { id: true, orderNumber: true } },
          product: { select: { id: true, name: true } },
        },
      })

      // When marking as "validated": move from pendingEarnings → paidEarnings
      if (data.status === 'validated') {
        await tx.affiliate.update({
          where: { id: commission.affiliateId },
          data: {
            pendingEarnings: { decrement: commission.commissionTotal },
            paidEarnings: { increment: commission.commissionTotal },
            totalEarnings: { increment: commission.commissionTotal },
          },
        })
      }

      // When marking as "cancelled": reverse the commission
      if (data.status === 'cancelled') {
        if (currentStatus === 'pending') {
          // Was in pending — remove from pendingEarnings
          await tx.affiliate.update({
            where: { id: commission.affiliateId },
            data: {
              pendingEarnings: { decrement: commission.commissionTotal },
            },
          })
        } else if (currentStatus === 'validated') {
          // Was validated — remove from paidEarnings
          await tx.affiliate.update({
            where: { id: commission.affiliateId },
            data: {
              paidEarnings: { decrement: commission.commissionTotal },
              totalEarnings: { decrement: commission.commissionTotal },
            },
          })
        }
      }

      // When marking as "paid": no earnings change needed
      // (already moved to paidEarnings during validation step)

      return updated
    })

    // Log activity
    await logActivity(
      admin.id,
      'UPDATE_COMMISSION',
      `Commission ${data.id}: ${currentStatus} → ${data.status} (${commission.commissionTotal} FCFA, affiliate: ${commission.affiliateCode})`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map(e => e.message).join(', '), 400)
    }
    console.error('Commission PUT error:', error)
    return err('Failed to update commission', 500)
  }
}
