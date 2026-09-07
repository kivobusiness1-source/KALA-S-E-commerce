import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, checkRateLimit } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(254),
  phone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(5000),
})

const contactUpdateSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  isRead: z.boolean().optional(),
  isReplied: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Unauthorized', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
      ]
    }

    const [submissions, total] = await Promise.all([
      db.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.contactSubmission.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const unreadCount = await db.contactSubmission.count({ where: { isRead: false } })

    return ok({ submissions, total, page, totalPages, unreadCount })
  } catch (error) {
    console.error('Contact GET error:', error)
    return err('Failed to fetch contact submissions', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Unauthorized', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Unauthorized', 401)

    const body = await request.json()
    const { id, isRead, isReplied } = contactUpdateSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (isRead !== undefined) updateData.isRead = isRead
    if (isReplied !== undefined) updateData.isReplied = isReplied
    if (Object.keys(updateData).length === 0) updateData.isRead = true

    const submission = await db.contactSubmission.update({
      where: { id },
      data: updateData,
    })
    return ok(submission)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Contact PUT error:', error)
    return err('Failed to update contact submission', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value
    if (!token) return err('Unauthorized', 401)
    const admin = await validateSession(token)
    if (!admin) return err('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return err('ID is required')

    await db.contactSubmission.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (error) {
    console.error('Contact DELETE error:', error)
    return err('Failed to delete contact submission', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`contact:${clientIp}`, 5, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const body = await request.json()
    const data = contactSchema.parse(body)

    const submission = await db.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
      },
    })

    return ok(submission, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Contact POST error:', error)
    return err('Failed to submit contact form', 500)
  }
}
