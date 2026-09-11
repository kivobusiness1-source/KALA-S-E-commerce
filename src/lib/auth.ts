import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const SESSION_DURATION_HOURS = 24

export interface AdminPayload {
  id: string
  email: string
  name: string
  role: string
}

const BCRYPT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes for migration
  if (hash.length === 64 && /^[a-f0-9]{64}$/.test(hash)) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const sha256Hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    return sha256Hash === hash
  }
  return bcrypt.compare(password, hash)
}

/**
 * Returns true if the given hash is a legacy SHA-256 hex digest (not bcrypt).
 * Used to transparently re-hash credentials with bcrypt after a successful login.
 */
export function isLegacyPasswordHash(hash: string): boolean {
  return hash.length === 64 && /^[a-f0-9]{64}$/.test(hash)
}

/**
 * Server-side RBAC helper. Roles are always enforced here (backend authority),
 * never solely in the frontend.
 */
export function hasAdminRole(admin: { role: string }, allowedRoles: string[]): boolean {
  return allowedRoles.includes(admin.role)
}

// ── Customer Session Validation ────────────────────────

export interface CustomerPayload {
  id: string
  name: string
  email: string
}

/**
 * Validates a customer session token (customer_token cookie).
 * Returns the customer payload, or null when the session is
 * missing/invalid/expired or the account is deactivated.
 */
export async function validateCustomerSession(token: string): Promise<CustomerPayload | null> {
  if (!token) return null
  const session = await db.customerSession.findUnique({
    where: { token },
    include: { customer: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.customerSession.delete({ where: { id: session.id } })
    return null
  }
  if (!session.customer.isActive) return null
  return {
    id: session.customer.id,
    name: session.customer.name,
    email: session.customer.email,
  }
}

export async function createSession(adminId: string, clientIp?: string): Promise<string> {
  const token = randomBytes(64).toString('hex') // 512-bit cryptographically random
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

  await db.adminSession.create({
    data: { adminId, token, expiresAt },
  })

  // Log activity
  await db.activityLog.create({
    data: {
      adminId,
      action: 'LOGIN',
      ipAddress: clientIp,
    },
  })

  return token
}

export async function validateSession(token: string): Promise<AdminPayload | null> {
  const session = await db.adminSession.findUnique({
    where: { token },
    include: { admin: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { id: session.id } })
    return null
  }

  return {
    id: session.admin.id,
    email: session.admin.email,
    name: session.admin.name,
    role: session.admin.role,
  }
}

export async function destroySession(token: string): Promise<void> {
  await db.adminSession.deleteMany({ where: { token } })
}

// ── Affiliate Session Validation ──────────────────────

export interface AffiliatePayload {
  id: string
  code: string
  name: string
  email: string
  phone: string | null
  company: string | null
  bankInfo: string | null
  commissionRate: number
  isActive: boolean
  totalEarnings: number
  pendingEarnings: number
  paidEarnings: number
  totalReferrals: number
  totalOrders: number
}

export async function validateAffiliateSession(token: string): Promise<AffiliatePayload | null> {
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

  return {
    id: session.affiliate.id,
    code: session.affiliate.code,
    name: session.affiliate.name,
    email: session.affiliate.email,
    phone: session.affiliate.phone,
    company: session.affiliate.company,
    bankInfo: session.affiliate.bankInfo,
    commissionRate: session.affiliate.commissionRate,
    isActive: session.affiliate.isActive,
    totalEarnings: session.affiliate.totalEarnings,
    pendingEarnings: session.affiliate.pendingEarnings,
    paidEarnings: session.affiliate.paidEarnings,
    totalReferrals: session.affiliate.totalReferrals,
    totalOrders: session.affiliate.totalOrders,
  }
}

export async function logActivity(adminId: string | undefined, action: string, details?: string, ipAddress?: string) {
  await db.activityLog.create({
    data: { adminId, action, details, ipAddress },
  })
}

// Rate limiting (in-memory, per-process)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 20 // requests per window

export function checkRateLimit(identifier: string, maxRequests = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 60 * 1000)
