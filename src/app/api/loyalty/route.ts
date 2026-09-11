import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit, validateSession } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const getQuerySchema = z.object({
  email: z.string().email(),
})

const postBodySchema = z.object({
  email: z.string().email(),
  points: z.number().int().positive().min(1),
  orderId: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 10 lookups / min / IP (email enumeration mitigation)
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`loyalty-get:${clientIp}`, 10, 60 * 1000)) {
      return err('Trop de requêtes. Veuillez réessayer plus tard.', 429)
    }

    const { searchParams } = new URL(request.url)
    const query = getQuerySchema.parse(Object.fromEntries(searchParams))

    const points = await db.loyaltyPoint.findMany({
      where: { email: query.email },
      orderBy: { createdAt: 'desc' },
    })

    const totalPoints = points.reduce((sum, p) => sum + p.points, 0)

    // SECURITY: only return the aggregate. Individual entries would leak
    // internal order IDs and purchase history to anyone knowing the email.
    // `points` keeps backward compatibility with the storefront dashboard.
    return ok({ points: totalPoints, totalPoints })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Paramètres invalides', 400)
    }
    console.error('Loyalty GET error:', error)
    return err('Erreur lors de la récupération des points', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`loyalty:${clientIp}`, 5, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    // Admin auth required for adding loyalty points
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non autorisé', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Non autorisé', 401)

    const body = await request.json()
    const data = postBodySchema.parse(body)

    const loyaltyPoint = await db.loyaltyPoint.create({
      data: {
        email: data.email,
        points: data.points,
        orderId: data.orderId,
        description: data.description,
      },
    })

    return ok(loyaltyPoint, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Données invalides', 400)
    }
    console.error('Loyalty POST error:', error)
    return err('Erreur lors de l\'ajout des points', 500)
  }
}
