import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ─── GET: Public - List active payment methods ───

export async function GET() {
  try {
    const methods = await db.wholesalePaymentMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return ok(methods)
  } catch (error) {
    console.error('WholesalePaymentMethods GET error:', error)
    return err('Failed to fetch payment methods', 500)
  }
}

// ─── POST: Admin only - Create payment method ───

const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  accountInfo: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  isCash: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const body = await request.json()
    const data = createPaymentMethodSchema.parse(body)

    const method = await db.wholesalePaymentMethod.create({ data })

    await logActivity(
      admin.id,
      'CREATE_WHOLESALE_PAYMENT_METHOD',
      `Created wholesale payment method: ${method.name}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(method, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('WholesalePaymentMethods POST error:', error)
    return err('Failed to create payment method', 500)
  }
}
