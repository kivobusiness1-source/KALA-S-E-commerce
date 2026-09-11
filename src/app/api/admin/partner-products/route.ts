import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession } from '@/lib/auth'

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export async function GET(request: NextRequest) {
  try {
    // Admin auth check
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)

    const affiliateId = request.nextUrl.searchParams.get('affiliateId')
    if (!affiliateId) return err('affiliateId requis', 400)

    // Fetch all AffiliateProductTrack records for this affiliate
    const tracks = await db.affiliateProductTrack.findMany({
      where: { affiliateId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            commissionMonth1PerUnit: true,
            commissionMonth2PlusPerUnit: true,
            commissionPerUnit: true,
            variants: {
              select: {
                id: true,
                name: true,
                commissionMonth1PerUnit: true,
                commissionMonth2PlusPerUnit: true,
                commissionPerUnit: true,
              },
            },
          },
        },
      },
      orderBy: { firstCommissionAt: 'desc' },
    })

    // Compute current month number for each track
    const now = new Date()
    const result = tracks.map((t) => {
      const firstDate = new Date(t.firstCommissionAt)
      const monthDiff =
        (now.getFullYear() - firstDate.getFullYear()) * 12 +
        (now.getMonth() - firstDate.getMonth()) +
        1 // Month 1 = the month firstCommissionAt occurred

      return {
        id: t.id,
        affiliateId: t.affiliateId,
        productId: t.productId,
        customerId: t.customerId,
        firstCommissionAt: t.firstCommissionAt.toISOString(),
        currentMonth: Math.max(1, monthDiff),
        product: t.product
          ? {
              id: t.product.id,
              name: t.product.name,
              image: t.product.image,
              commissionMonth1PerUnit: t.product.commissionMonth1PerUnit,
              commissionMonth2PlusPerUnit: t.product.commissionMonth2PlusPerUnit,
              commissionPerUnit: t.product.commissionPerUnit,
              variants: t.product.variants,
            }
          : null,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Partner products GET error:', error)
    return err('Erreur serveur', 500)
  }
}
