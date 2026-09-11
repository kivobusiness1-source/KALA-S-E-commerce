import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { checkRateLimit } from '@/lib/auth'

// ── Helpers ────────────────────────────────────────────────────────
function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const COOKIE_NAME = 'customer_token'
const SESSION_DURATION_DAYS = 7
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
const BCRYPT_ROUNDS = 12

function generateToken(): string {
  return randomBytes(64).toString('hex')
}

function setCustomerCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  })
}

function clearCustomerCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ── Validation Schemas ─────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  address: z.string().optional(),
  city: z.string().optional(),
  quartier: z.string().optional(),
  referredByCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

// ── POST Handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Brute-force protection: 10 auth actions / min / IP
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`customer-auth:${clientIp}`, 10, 60 * 1000)) {
      return err('Trop de tentatives. Veuillez réessayer plus tard.', 429)
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'register':
        return await handleRegister(body)
      case 'login':
        return await handleLogin(body)
      case 'logout':
        return await handleLogout(request)
      case 'me':
        return await handleMe(request)
      default:
        return err(`Action invalide: "${action}". Actions supportées: register, login, logout, me`)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return err(firstError?.message || 'Données invalides', 400)
    }
    console.error('Customer auth error:', error)
    return err('Erreur interne du serveur', 500)
  }
}

// ── Register ───────────────────────────────────────────────────────
async function handleRegister(body: Record<string, unknown>) {
  const data = registerSchema.parse(body)

  // Check email uniqueness
  const existing = await db.customer.findUnique({ where: { email: data.email } })
  if (existing) {
    return err('Un compte avec cet email existe déjà', 409)
  }

  // Hash password
  const hashedPassword = await hash(data.password, BCRYPT_ROUNDS)

  // Resolve referral code → affiliate
  let referredById: string | undefined
  if (data.referredByCode) {
    const affiliate = await db.affiliate.findUnique({
      where: { code: data.referredByCode },
    })
    if (affiliate) {
      referredById = affiliate.id
    }
    // If affiliate code not found, we silently ignore it
    // (the customer still gets registered, just without referral tracking)
  }

  // Create customer
  const customer = await db.customer.create({
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone ?? null,
      password: hashedPassword,
      address: data.address ?? null,
      city: data.city ?? 'Pointe-Noire',
      quartier: data.quartier ?? null,
      referredById: referredById ?? null,
    },
  })

  // If referred, create AffiliateReferral record
  if (referredById) {
    await db.affiliateReferral.create({
      data: {
        affiliateId: referredById,
        customerId: customer.id,
        status: 'pending',
      },
    })
    // Increment affiliate's totalReferrals
    await db.affiliate.update({
      where: { id: referredById },
      data: { totalReferrals: { increment: 1 } },
    })
  }

  // Create session token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  await db.customerSession.create({
    data: { customerId: customer.id, token, expiresAt },
  })

  // Build response
  const response = ok({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    },
  }, 201)

  setCustomerCookie(response, token)
  return response
}

// ── Login ──────────────────────────────────────────────────────────
async function handleLogin(body: Record<string, unknown>) {
  const data = loginSchema.parse(body)

  const customer = await db.customer.findUnique({ where: { email: data.email } })
  if (!customer) {
    return err('Email ou mot de passe incorrect', 401)
  }

  if (!customer.isActive) {
    return err('Votre compte a été désactivé. Contactez le support.', 403)
  }

  const isValid = await compare(data.password, customer.password)
  if (!isValid) {
    return err('Email ou mot de passe incorrect', 401)
  }

  // Create session token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  await db.customerSession.create({
    data: { customerId: customer.id, token, expiresAt },
  })

  const response = ok({
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
    },
  })

  setCustomerCookie(response, token)
  return response
}

// ── Logout ─────────────────────────────────────────────────────────
async function handleLogout(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (token) {
    // Delete session from DB
    await db.customerSession.deleteMany({ where: { token } })
  }

  const response = ok({ message: 'Déconnecté avec succès' })
  clearCustomerCookie(response)
  return response
}

// ── Me (current customer info) ─────────────────────────────────────
async function handleMe(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return err('Non authentifié', 401)
  }

  // Validate session
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

  // Get orders count and total spent
  const ordersAggregation = await db.order.aggregate({
    where: {
      customerId: session.customer.id,
      status: { notIn: ['cancelled'] },
    },
    _count: true,
    _sum: { totalAmount: true },
  })

  const response = ok({
    customer: {
      id: session.customer.id,
      email: session.customer.email,
      name: session.customer.name,
      phone: session.customer.phone,
      address: session.customer.address,
      city: session.customer.city,
      quartier: session.customer.quartier,
      emailVerified: session.customer.emailVerified,
      referredById: session.customer.referredById,
      affiliateId: session.customer.affiliateId,
      ordersCount: ordersAggregation._count,
      totalSpent: ordersAggregation._sum.totalAmount ?? 0,
    },
  })

  return response
}
