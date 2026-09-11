import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'
import { z } from 'zod'

const catchphraseSchema = z.object({
  text: z.string().min(1, 'Le texte est requis').max(200),
  position: z.enum(['hero', 'promo_bar', 'product_page', 'footer']),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showAll = searchParams.get('all') === 'true'

    const session = await getSession(request)
    if (session && showAll) {
      // Admin: return all catchphrases
      const catchphrases = await db.catchphrase.findMany({
        orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
      })
      return NextResponse.json({ success: true, data: catchphrases })
    }

    // Public: return only active
    const catchphrases = await db.catchphrase.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    })
    return NextResponse.json({ success: true, data: catchphrases })
  } catch (error) {
    console.error('Get catchphrases error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'super_admin' && session.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }
    const body = await request.json()
    const validated = catchphraseSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 })
    }
    const cp = await db.catchphrase.create({ data: validated.data })
    await logActivity(session.id, 'create_catchphrase', `Phrase créée: ${cp.text.slice(0, 50)}`)
    return NextResponse.json({ success: true, data: cp }, { status: 201 })
  } catch (error) {
    console.error('Create catchphrase error:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
