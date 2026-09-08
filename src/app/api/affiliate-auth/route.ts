import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────

function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const COOKIE_NAME = 'affiliate_token'
const SESSION_DAYS = 7
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

// ── Zod Schemas ──────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company: z.string().optional(),
  bankInfo: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ── Affiliate code generator ─────────────────────────────

async function generateAffiliateCode(name: string): Promise<string> {
  // Take first name, uppercase it
  const firstName = name.trim().split(/\s+/)[0].toUpperCase()
  const base = `KALA-${firstName}`

  // Check uniqueness with random 3-digit suffix
  for (let attempt = 0; attempt < 50; attempt++) {
    const suffix = String(Math.floor(Math.random() * 900) + 100) // 100–999
    const code = `${base}${suffix}`
    const existing = await db.affiliate.findUnique({ where: { code } })
    if (!existing) return code
  }

  // Fallback: use timestamp-based suffix
  const fallback = `${base}${Date.now().toString().slice(-3)}`
  return fallback
}

// ── Session helpers ──────────────────────────────────────

async function createAffiliateSession(affiliateId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MS)

  await db.affiliateSession.create({
    data: { affiliateId, token, expiresAt },
  })

  return token
}

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

function setCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })
}

function clearCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

// ── POST handler ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body as { action?: string }

    switch (action) {
      // ─── REGISTER ────────────────────────────────────
      case 'register': {
        const data = registerSchema.parse(body)

        // Check email uniqueness
        const existing = await db.affiliate.findUnique({ where: { email: data.email } })
        if (existing) {
          return err('An affiliate account with this email already exists', 409)
        }

        // Generate unique affiliate code
        const code = await generateAffiliateCode(data.name)

        // Hash password
        const hashedPassword = await hash(data.password, 12)

        // Create affiliate
        const affiliate = await db.affiliate.create({
          data: {
            code,
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            password: hashedPassword,
            company: data.company ?? null,
            bankInfo: data.bankInfo ?? null,
            commissionRate: 5.0,
          },
        })

        // Create session
        const token = await createAffiliateSession(affiliate.id)

        const response = ok({
          affiliate: {
            id: affiliate.id,
            code: affiliate.code,
            name: affiliate.name,
            email: affiliate.email,
            commissionRate: affiliate.commissionRate,
          },
        }, 201)

        setCookie(response, token)
        return response
      }

      // ─── LOGIN ───────────────────────────────────────
      case 'login': {
        const data = loginSchema.parse(body)

        const affiliate = await db.affiliate.findUnique({ where: { email: data.email } })
        if (!affiliate) {
          return err('Invalid email or password', 401)
        }

        const isValid = await compare(data.password, affiliate.password)
        if (!isValid) {
          return err('Invalid email or password', 401)
        }

        if (!affiliate.isActive) {
          return err('Your affiliate account has been deactivated. Please contact support.', 403)
        }

        // Create session
        const token = await createAffiliateSession(affiliate.id)

        const response = ok({
          affiliate: {
            id: affiliate.id,
            code: affiliate.code,
            name: affiliate.name,
            email: affiliate.email,
            commissionRate: affiliate.commissionRate,
          },
        })

        setCookie(response, token)
        return response
      }

      // ─── LOGOUT ──────────────────────────────────────
      case 'logout': {
        const token = request.cookies.get(COOKIE_NAME)?.value

        if (token) {
          await db.affiliateSession.deleteMany({ where: { token } })
        }

        const response = ok({ message: 'Logged out successfully' })
        clearCookie(response)
        return response
      }

      // ─── ME (get current affiliate) ─────────────────
      case 'me': {
        const token = request.cookies.get(COOKIE_NAME)?.value
        if (!token) return err('Not authenticated', 401)

        const affiliate = await validateAffiliateSession(token)
        if (!affiliate) return err('Session expired or invalid', 401)

        return ok({
          affiliate: {
            id: affiliate.id,
            code: affiliate.code,
            name: affiliate.name,
            email: affiliate.email,
            phone: affiliate.phone,
            company: affiliate.company,
            bankInfo: affiliate.bankInfo,
            commissionRate: affiliate.commissionRate,
            isActive: affiliate.isActive,
            totalEarnings: affiliate.totalEarnings,
            pendingEarnings: affiliate.pendingEarnings,
            paidEarnings: affiliate.paidEarnings,
            totalReferrals: affiliate.totalReferrals,
            totalOrders: affiliate.totalOrders,
            createdAt: affiliate.createdAt,
          },
        })
      }

      default:
        return err('Invalid action. Use: register, login, logout, me', 400)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return err(firstIssue?.message ?? 'Invalid input data', 400)
    }
    console.error('Affiliate auth error:', error)
    return err('Internal server error', 500)
  }
}
