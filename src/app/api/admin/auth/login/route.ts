import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, checkRateLimit } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'

    // Rate limit: 5 attempts per minute per IP
    if (!checkRateLimit(`login:${clientIp}`, 5, 60 * 1000)) {
      return err('Too many login attempts. Please try again later.', 429)
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const admin = await db.admin.findUnique({ where: { email } })
    if (!admin) {
      return err('Invalid email or password', 401)
    }

    const isValid = await verifyPassword(password, admin.password)
    if (!isValid) {
      return err('Invalid email or password', 401)
    }

    const token = await createSession(admin.id, clientIp)

    const response = NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Login error:', error)
    return err('Internal server error', 500)
  }
}
