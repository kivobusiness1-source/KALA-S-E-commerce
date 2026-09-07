import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  name: z.string().max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`newsletter:${clientIp}`, 3, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const body = await request.json()
    const data = subscribeSchema.parse(body)

    const existing = await db.emailSubscriber.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      if (existing.isActive) {
        return ok(existing)
      }
      const reactivated = await db.emailSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true, source: 'website' },
      })
      return ok(reactivated)
    }

    const subscriber = await db.emailSubscriber.create({
      data: {
        email: data.email,
        name: data.name || null,
        source: 'website',
      },
    })

    return ok(subscriber, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Newsletter POST error:', error)
    return err('Failed to subscribe', 500)
  }
}
