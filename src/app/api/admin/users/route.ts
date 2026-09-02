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
  role: z.enum(['super_admin', 'admin', 'staff', 'livreur']).optional().default('staff'),
  phone: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Non autorisé', 401)

    // staff/livreur can only see their own profile
    if (admin.role === 'staff' || admin.role === 'livreur') {
      const self = await db.admin.findUnique({
        where: { id: admin.id },
        select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
      })
      return ok(self ? [self] : [])
    }

    // admin can see all except super_admins' details (but can see them in list)
    // super_admin sees everything
    const admins = await db.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // For admin role, hide super_admin passwords (already hidden) — just filter is fine
    // No password is returned regardless

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

    // super_admin can create any role
    // admin can create staff and livreur only
    if (admin.role === 'admin') {
      // Will validate role below
    } else if (admin.role !== 'super_admin') {
      return err('Accès refusé', 403)
    }

    const body = await request.json()
    const data = createAdminSchema.parse(body)

    // admin cannot create super_admin or admin
    if (admin.role === 'admin' && (data.role === 'super_admin' || data.role === 'admin')) {
      return err('Vous ne pouvez créer que des comptes staff ou livreur', 403)
    }

    // Only super_admin can create super_admin
    if (data.role === 'super_admin' && admin.role !== 'super_admin') {
      return err('Accès refusé', 403)
    }

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
        phone: data.phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
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
