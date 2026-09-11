import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ── GET: List affiliates or get single affiliate ──────────

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (admin.role !== 'super_admin' && admin.role !== 'admin') return err('Access denied', 403)

    const { searchParams } = new URL(request.url)

    // Single affiliate by ID
    const singleId = searchParams.get('id')
    if (singleId) {
      const affiliate = await db.affiliate.findUnique({
        where: { id: singleId },
        include: { _count: { select: { commissions: true } } },
      })
      if (!affiliate) return err('Partenaire introuvable', 404)

      // If payouts=1 requested, also return payouts
      const withPayouts = searchParams.get('payouts') === '1'
      let payouts: unknown[] = []
      if (withPayouts) {
        payouts = await db.affiliatePayout.findMany({
          where: { affiliateId: singleId },
          orderBy: { createdAt: 'desc' },
        })
      }

      return ok({
        partner: {
          id: affiliate.id,
          code: affiliate.code,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          company: affiliate.company,
          commissionRate: affiliate.commissionRate,
          bankInfo: affiliate.bankInfo,
          isActive: affiliate.isActive,
          totalEarnings: affiliate.totalEarnings,
          pendingEarnings: affiliate.pendingEarnings,
          paidEarnings: affiliate.paidEarnings,
          totalReferrals: affiliate.totalReferrals,
          totalOrders: affiliate.totalOrders,
          createdAt: affiliate.createdAt,
          _count: affiliate._count,
        },
        payouts,
      })
    }

    // List affiliates
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [affiliates, total] = await Promise.all([
      db.affiliate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { commissions: true } } },
      }),
      db.affiliate.count({ where }),
    ])

    return ok({
      partners: affiliates.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        email: a.email,
        phone: a.phone,
        company: a.company,
        commissionRate: a.commissionRate,
        bankInfo: a.bankInfo,
        isActive: a.isActive,
        totalEarnings: a.totalEarnings,
        pendingEarnings: a.pendingEarnings,
        paidEarnings: a.paidEarnings,
        totalReferrals: a.totalReferrals,
        totalOrders: a.totalOrders,
        createdAt: a.createdAt,
        _count: a._count,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Admin partners GET error:', error)
    return err('Internal server error', 500)
  }
}

// ── POST: Create affiliate ────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  code: z.string().min(1, 'Code requis'),
  company: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(5),
  password: z.string().min(6, 'Mot de passe min 6 caractères'),
  bankInfo: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (admin.role !== 'super_admin' && admin.role !== 'admin') return err('Access denied', 403)

    const body = await request.json()
    const data = createSchema.parse(body)

    // Check uniqueness
    const existingCode = await db.affiliate.findUnique({ where: { code: data.code } })
    if (existingCode) return err('Ce code partenaire existe déjà')

    const existingEmail = await db.affiliate.findUnique({ where: { email: data.email } })
    if (existingEmail) return err('Cet email est déjà utilisé par un partenaire')

    const hashedPassword = await hashPassword(data.password)

    const affiliate = await db.affiliate.create({
      data: {
        code: data.code,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        company: data.company || null,
        commissionRate: data.commissionRate,
        password: hashedPassword,
        bankInfo: data.bankInfo || null,
      },
    })

    await logActivity(
      admin.id,
      'CREATE_AFFILIATE',
      `Affiliate created: ${affiliate.code} (${affiliate.name})`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({
      partner: {
        id: affiliate.id,
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        phone: affiliate.phone,
        company: affiliate.company,
        commissionRate: affiliate.commissionRate,
        isActive: affiliate.isActive,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        paidEarnings: affiliate.paidEarnings,
        totalReferrals: affiliate.totalReferrals,
        totalOrders: affiliate.totalOrders,
        createdAt: affiliate.createdAt,
      },
    }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '), 400)
    }
    console.error('Admin partners POST error:', error)
    return err('Internal server error', 500)
  }
}

// ── PUT: Update affiliate or create payout ────────────────

const updateSchema = z.object({
  id: z.string().min(1),
  // Standard fields
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  bankInfo: z.string().optional(),
  isActive: z.boolean().optional(),
  code: z.string().min(1).optional(),
  // Payout creation
  action: z.enum(['createPayout']).optional(),
  payoutAmount: z.number().positive().optional(),
  payoutMethod: z.enum(['mobile_money', 'bank_transfer', 'cash']).optional(),
  payoutReference: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (admin.role !== 'super_admin' && admin.role !== 'admin') return err('Access denied', 403)

    const body = await request.json()
    const data = updateSchema.parse(body)

    const affiliate = await db.affiliate.findUnique({ where: { id: data.id } })
    if (!affiliate) return err('Partenaire introuvable', 404)

    // ── Handle payout creation ──────────────────────────
    if (data.action === 'createPayout') {
      if (!data.payoutAmount || !data.payoutMethod) {
        return err('Montant et méthode de paiement requis', 400)
      }

      const payout = await db.$transaction(async (tx) => {
        const newPayout = await tx.affiliatePayout.create({
          data: {
            affiliateId: data.id,
            amount: data.payoutAmount!,
            method: data.payoutMethod!,
            reference: data.payoutReference || null,
            status: 'completed',
          },
        })

        // Update affiliate earnings: move from paidEarnings the payout amount
        await tx.affiliate.update({
          where: { id: data.id },
          data: {
            paidEarnings: { decrement: data.payoutAmount! },
          },
        })

        return newPayout
      })

      await logActivity(
        admin.id,
        'CREATE_PAYOUT',
        `Payout ${payout.id}: ${data.payoutAmount} FCFA to ${affiliate.name} (${affiliate.code}) via ${data.payoutMethod}`,
        request.headers.get('x-forwarded-for') ?? undefined,
      )

      return ok({ payout })
    }

    // ── Handle standard update ──────────────────────────
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) {
      // Check email uniqueness
      const existingEmail = await db.affiliate.findFirst({ where: { email: data.email, NOT: { id: data.id } } })
      if (existingEmail) return err('Cet email est déjà utilisé')
      updateData.email = data.email
    }
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.company !== undefined) updateData.company = data.company || null
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate
    if (data.bankInfo !== undefined) updateData.bankInfo = data.bankInfo || null
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.code !== undefined) {
      const existingCode = await db.affiliate.findFirst({ where: { code: data.code, NOT: { id: data.id } } })
      if (existingCode) return err('Ce code partenaire existe déjà')
      updateData.code = data.code
    }

    const updated = await db.affiliate.update({
      where: { id: data.id },
      data: updateData,
    })

    await logActivity(
      admin.id,
      'UPDATE_AFFILIATE',
      `Affiliate ${data.id} updated: ${Object.keys(updateData).join(', ')}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({
      partner: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        company: updated.company,
        commissionRate: updated.commissionRate,
        isActive: updated.isActive,
        totalEarnings: updated.totalEarnings,
        pendingEarnings: updated.pendingEarnings,
        paidEarnings: updated.paidEarnings,
        totalReferrals: updated.totalReferrals,
        totalOrders: updated.totalOrders,
        createdAt: updated.createdAt,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(error.issues.map((e) => e.message).join(', '), 400)
    }
    console.error('Admin partners PUT error:', error)
    return err('Internal server error', 500)
  }
}
