import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ────────────────────────────────────────────────────────
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const COOKIE_NAME = 'customer_token'
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// ── GET Handler ────────────────────────────────────────────────────
// Returns the authenticated customer's orders with items.
// Query params: ?page=1&limit=10&status=pending
export async function GET(request: NextRequest) {
  try {
    // ── Authenticate via cookie ──
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return err('Non authentifié', 401)
    }

    const session = await db.customerSession.findUnique({
      where: { token },
      include: { customer: true },
    })

    if (!session) {
      return err('Session invalide', 401)
    }

    if (session.expiresAt < new Date()) {
      await db.customerSession.delete({ where: { id: session.id } })
      return err('Session expirée', 401)
    }

    if (!session.customer.isActive) {
      return err('Votre compte a été désactivé', 403)
    }

    const customerId = session.customer.id

    // ── Parse query params ──
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10) || DEFAULT_PAGE)
    const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT)
    const statusFilter = searchParams.get('status') || undefined

    // ── Build where clause ──
    const where: Record<string, unknown> = { customerId }
    if (statusFilter) {
      where.status = statusFilter
    }

    // ── Count total ──
    const total = await db.order.count({ where })

    // ── Fetch orders with items ──
    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                price: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        deliverer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // ── Return paginated response ──
    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Customer orders error:', error)
    return err('Erreur interne du serveur', 500)
  }
}
