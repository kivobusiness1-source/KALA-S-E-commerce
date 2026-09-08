import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────

function ok(data: unknown, status = 200) {
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

    // ── Fetch recent referrals (last 10) ────────────────
    const recentReferrals = await db.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        customer: { select: { name: true } },
        order: { select: { totalAmount: true, orderNumber: true } },
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
      orderNumber: r.order?.orderNumber ?? null,
    }))

    // ── Fetch recent payouts (last 5) ───────────────────
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

    // Group commissions by month
    const monthlyMap = new Map<string, number>()
    for (const ref of allReferrals) {
      const d = ref.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + ref.commission)
    }

    // Sort by month ascending and build array
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
    })
  } catch (error) {
    console.error('Affiliate stats error:', error)
    return err('Internal server error', 500)
  }
}
