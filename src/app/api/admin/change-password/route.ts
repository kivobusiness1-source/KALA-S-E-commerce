import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validateSession, hashPassword, verifyPassword, logActivity } from '@/lib/auth'
import { db } from '@/lib/db'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_.])/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: passwordSchema,
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Non authentifié', 401)

    const admin = await validateSession(token)
    if (!admin) return err('Session expirée ou invalide', 401)

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Données invalides'
      return err(msg)
    }

    const { currentPassword, newPassword } = parsed.data

    const adminUser = await db.admin.findUnique({ where: { id: admin.id } })
    if (!adminUser) return err('Administrateur introuvable', 404)

    const isCurrentValid = await verifyPassword(currentPassword, adminUser.password)
    if (!isCurrentValid) return err('Mot de passe actuel incorrect', 403)

    const newHash = await hashPassword(newPassword)
    await db.admin.update({
      where: { id: admin.id },
      data: { password: newHash },
    })

    await logActivity(admin.id, 'CHANGE_PASSWORD', 'Mot de passe modifié')

    return ok({ message: 'Mot de passe modifié avec succès' })
  } catch (error) {
    console.error('Change password error:', error)
    return err('Erreur interne du serveur', 500)
  }
}
