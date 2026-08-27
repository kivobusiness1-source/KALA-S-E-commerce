import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Not authenticated', 401)

    const admin = await validateSession(token)
    if (!admin) return err('Session expired or invalid', 401)

    return ok(admin)
  } catch (error) {
    console.error('Auth me error:', error)
    return err('Internal server error', 500)
  }
}
