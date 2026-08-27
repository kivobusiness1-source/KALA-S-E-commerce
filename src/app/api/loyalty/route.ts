import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

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
    const { searchParams } = new URL(request.url)
    const query = getQuerySchema.parse(Object.fromEntries(searchParams))

    const points = await db.loyaltyPoint.findMany({
      where: { email: query.email },
      orderBy: { createdAt: 'desc' },
    })

    const totalPoints = points.reduce((sum, p) => sum + p.points, 0)

    return ok({ totalPoints, entries: points })
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
