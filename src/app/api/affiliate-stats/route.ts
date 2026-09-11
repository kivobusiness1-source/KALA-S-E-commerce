import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const COOKIE_NAME = 'affiliate_token'

// ── Session validation ───────────────────────────────────

async function validateAffiliateSession(token: string) {
  const session = await db.affiliateSession.findUnique({
    where: { token },
    include: { affiliate: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.affiliateSession.delete({ where: { id: session.id } })
    return null
  }
  if (!session.affiliate.isActive) return null

  return session.affiliate
}

// ── GET handler ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    // Require affiliate auth
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) return err('Not authenticated', 401)

    const affiliate = await validateAffiliateSession(token)
    if (!affiliate) return err('Session expired or invalid', 401)

    const { searchParams } = new URL(request.url)

    // ── Commission breakdown: total by status ────────────
    const commissionBreakdown = await db.commission.groupBy({
      by: ['status'],
      where: { affiliateId: affiliate.id },
      _sum: { commissionTotal: true },
      _count: true,
    })

    const commissionByStatus = {
      pending: { count: 0, total: 0 },
      validated: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    }

    for (const row of commissionBreakdown) {
      const s = row.status as keyof typeof commissionByStatus
      if (commissionByStatus[s]) {
        commissionByStatus[s].count = row._count
        commissionByStatus[s].total = row._sum.commissionTotal ?? 0
      }
    }

    // ── All commissions (for dashboard) ─────────────────
    // Support pagination: page & limit params
    const allMode = searchParams.get('allCommissions') === '1'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const commissionTake = allMode ? 500 : 20 // max 500 for "all" mode

    const recentCommissions = await db.commission.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        order: { select: { orderNumber: true, status: true } },
        product: { select: { name: true, image: true } },
        variant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: allMode ? 0 : (page - 1) * limit,
      take: commissionTake,
    })

    const totalCommissions = allMode ? recentCommissions.length : await db.commission.count({
      where: { affiliateId: affiliate.id },
    })

    // ── Sales summary ───────────────────────────────────
    const orderStats = await db.order.aggregate({
      where: { affiliateId: affiliate.id },
      _count: true,
      _sum: { totalAmount: true },
    })

    const productSoldResult = await db.orderItem.aggregate({
      where: {
        affiliateCode: affiliate.code,
        totalUnits: { not: null },
      },
      _sum: { totalUnits: true },
    })

    // ── Recent referrals (last 10) ──────────────────────
    const recentReferrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const formattedReferrals = recentReferrals.map((r) => ({
      id: r.id,
      customerName: r.customer.name,
      orderAmount: r.orderAmount,
      commission: r.commission,
      status: r.status,
      date: r.createdAt,
      orderId: r.orderId,
    }))

    // ── Recent payouts (last 5) ─────────────────────────
    const recentPayouts = await db.affiliatePayout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // ── Monthly earnings (group by month for chart) ─────
    const allReferrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id, status: { in: ['earned', 'paid'] } },
      select: { commission: true, createdAt: true },
    })

    const monthlyMap = new Map<string, number>()
    for (const ref of allReferrals) {
      const d = ref.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + ref.commission)
    }

    const allCommissionsForMonthly = await db.commission.findMany({
      where: {
        affiliateId: affiliate.id,
        status: { in: ['validated', 'paid'] },
      },
      select: { commissionTotal: true, createdAt: true },
    })

    for (const c of allCommissionsForMonthly) {
      const d = c.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + c.commissionTotal)
    }

    const monthlyEarnings = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, earnings]) => ({ month, earnings: Math.round(earnings * 100) / 100 }))

    // ── Build response ──────────────────────────────────
    return ok({
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      totalReferrals: affiliate.totalReferrals,
      totalOrders: affiliate.totalOrders,
      commissionRate: affiliate.commissionRate,
      recentReferrals: formattedReferrals,
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        reference: p.reference,
        status: p.status,
        notes: p.notes,
        date: p.createdAt,
      })),
      monthlyEarnings,
      code: affiliate.code,
      commissionBreakdown: commissionByStatus,
      recentCommissions: recentCommissions.map((c) => ({
        id: c.id,
        orderNumber: c.order.orderNumber,
        orderStatus: c.order.status,
        productName: c.productName,
        variantName: c.variantName,
        quantity: c.quantity,
        totalSaleAmount: c.totalSaleAmount,
        commissionPerUnit: c.commissionPerUnit,
        commissionTotal: c.commissionTotal,
        commissionMonth: c.commissionMonth,
        status: c.status,
        createdAt: c.createdAt,
        validatedAt: c.validatedAt,
        paidAt: c.paidAt,
      })),
      salesSummary: {
        totalOrders: orderStats._count,
        totalRevenue: orderStats._sum.totalAmount ?? 0,
        totalProductsSold: productSoldResult._sum.totalUnits ?? 0,
      },
      totalCommissions,
    })
  } catch (error) {
    console.error('Affiliate stats error:', error)
    return err('Internal server error', 500)
  }
}
