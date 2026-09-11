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

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['super_admin', 'admin', 'staff', 'livreur']).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Non autorisé', 401)

    const { id } = await params

    // Only super_admin can edit other admins/super_admins
    // admin can edit staff only
    // staff/livreur can only edit their own profile (name, phone, password)
    if (admin.role === 'staff' || admin.role === 'livreur') {
      if (admin.id !== id) return err('Accès refusé', 403)
    }

    if (admin.role === 'admin') {
      // admin cannot edit other admins or super_admins
      if (admin.id !== id) {
        const target = await db.admin.findUnique({ where: { id }, select: { role: true } })
        if (!target) return err('Utilisateur non trouvé', 404)
        if (target.role === 'super_admin' || target.role === 'admin') {
          return err('Accès refusé', 403)
        }
      }
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Only super_admin can assign super_admin role
    if (data.role === 'super_admin' && admin.role !== 'super_admin') {
      return err('Accès refusé. Seul un super administrateur peut attribuer ce rôle.', 403)
    }

    // staff/livreur editing self cannot change role
    if ((admin.role === 'staff' || admin.role === 'livreur') && data.role) {
      return err('Vous ne pouvez pas modifier votre rôle', 403)
    }

    // If changing email, check uniqueness
    if (data.email) {
      const existing = await db.admin.findFirst({ where: { email: data.email, NOT: { id } } })
      if (existing) return err('Un administrateur avec cet email existe déjà')
    }

    const updateData: Record<string, unknown> = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.role) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password) updateData.password = await hashPassword(data.password)

    const updated = await db.admin.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
    })

    await logActivity(admin.id, 'UPDATE_ADMIN', `Updated admin: ${updated.email}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Admin users PUT error:', error)
    return err('Erreur serveur', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Non autorisé', 401)

    // Only super_admin can delete
    if (admin.role !== 'super_admin') {
      return err('Accès refusé. Seul un super administrateur peut supprimer des comptes.', 403)
    }

    const { id } = await params

    // Cannot delete self
    if (admin.id === id) {
      return err('Vous ne pouvez pas supprimer votre propre compte', 400)
    }

    // Check target is not a super_admin
    const target = await db.admin.findUnique({ where: { id }, select: { role: true, email: true } })
    if (!target) return err('Utilisateur non trouvé', 404)
    if (target.role === 'super_admin') return err('Impossible de supprimer un super administrateur', 400)

    await db.admin.delete({ where: { id } })
    await logActivity(admin.id, 'DELETE_ADMIN', `Deleted admin: ${target.email}`, request.headers.get('x-forwarded-for') ?? undefined)

    return ok(null)
  } catch (error) {
    console.error('Admin users DELETE error:', error)
    return err('Erreur serveur', 500)
  }
}
