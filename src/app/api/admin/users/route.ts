import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, hashPassword, logActivity } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const createAdminSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  role: z.enum(['admin', 'super_admin']).optional().default('admin'),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Non autorisé', 401)

    const admins = await db.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return ok(admins)
  } catch (error) {
    console.error('Admin users GET error:', error)
    return err('Erreur serveur', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Non autorisé', 401)

    // Only super_admin can create new admins
    if (admin.role !== 'super_admin') {
      return err('Accès refusé. Seul un super administrateur peut créer des comptes.', 403)
    }

    const body = await request.json()
    const data = createAdminSchema.parse(body)

    // Check if email already exists
    const existing = await db.admin.findUnique({ where: { email: data.email } })
    if (existing) {
      return err('Un administrateur avec cet email existe déjà')
    }

    const passwordHash = await hashPassword(data.password)

    const newAdmin = await db.admin.create({
      data: {
        email: data.email,
        name: data.name,
        password: passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    await logActivity(
      admin.id,
      'CREATE_ADMIN',
      `Created admin: ${data.email} (${data.role})`,
      request.headers.get('x-forwarded-for') ?? undefined
    )

    return ok(newAdmin, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Admin users POST error:', error)
    return err('Erreur serveur', 500)
  }
}
