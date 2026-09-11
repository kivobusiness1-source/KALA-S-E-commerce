import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ──────────────────────────────────────────────

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

// ── GET handler (Public — no auth required) ──────────────

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
      return err('Affiliate code is required. Use ?code=KALA-MARIAM', 400)
    }

    // Look up affiliate by code
    const affiliate = await db.affiliate.findUnique({
      where: { code },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        commissionRate: true,
      },
    })

    if (!affiliate || !affiliate.isActive) {
      return NextResponse.json({ valid: false })
    }

    // Return affiliate name, code, and isActive status (public endpoint for checkout)
    return NextResponse.json({
      valid: true,
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        isActive: affiliate.isActive,
        commissionRate: affiliate.commissionRate,
      },
    })
  } catch (error) {
    console.error('Affiliate validate error:', error)
    return err('Internal server error', 500)
  }
}
