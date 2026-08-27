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

const settingItemSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

const updateSettingsSchema = z.object({
  settings: z.array(settingItemSchema).min(1),
})

export async function GET() {
  try {
    const settings = await db.siteSetting.findMany()

    const kv: Record<string, string> = {}
    for (const s of settings) {
      kv[s.key] = s.value
    }

    return ok(kv)
  } catch (error) {
    console.error('Site settings GET error:', error)
    return err('Failed to fetch site settings', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const body = await request.json()
    const { settings } = updateSettingsSchema.parse(body)

    const results = await Promise.all(
      settings.map(async (item) => {
        return db.siteSetting.upsert({
          where: { key: item.key },
          update: { value: item.value },
          create: { key: item.key, value: item.value },
        })
      }),
    )

    await logActivity(
      admin.id,
      'UPDATE_SITE_SETTINGS',
      `Updated ${settings.length} site setting(s)`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(results)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Site settings PUT error:', error)
    return err('Failed to update site settings', 500)
  }
}
