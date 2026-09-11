import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional().default('website'),
})

const deleteSchema = z.object({
  id: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const subscribers = await db.emailSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return ok(subscribers)
  } catch (error) {
    console.error('Emails GET error:', error)
    return err('Failed to fetch subscribers', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = subscribeSchema.parse(body)

    // Check if already subscribed
    const existing = await db.emailSubscriber.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      if (existing.isActive) {
        return ok(existing)
      }
      // Reactivate
      const reactivated = await db.emailSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true },
      })
      return ok(reactivated)
    }

    const subscriber = await db.emailSubscriber.create({
      data: {
        email: data.email,
        name: data.name || null,
        source: data.source,
      },
    })

    return ok(subscriber, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Emails POST error:', error)
    return err('Failed to subscribe', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin'])) return err('Accès refusé pour votre rôle', 403)

    const body = await request.json()
    const { id } = deleteSchema.parse(body)

    await db.emailSubscriber.delete({ where: { id } })

    await logActivity(
      admin.id,
      'DELETE_SUBSCRIBER',
      `Deleted email subscriber ${id}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({ id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Emails DELETE error:', error)
    return err('Failed to delete subscriber', 500)
  }
}
