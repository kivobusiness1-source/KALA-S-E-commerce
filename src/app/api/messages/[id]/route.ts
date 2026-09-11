import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) return err('Conversation not found', 404)

    // Backfill missing customer info from Customer table
    let customerName = conversation.customerName
    let customerEmail = conversation.customerEmail
    if ((!customerName || !customerEmail) && conversation.sessionId.startsWith('customer-')) {
      const custId = conversation.sessionId.replace('customer-', '')
      if (custId) {
        const cust = await db.customer.findUnique({
          where: { id: custId },
          select: { name: true, email: true },
        })
        if (cust) {
          customerName = customerName || cust.name
          customerEmail = customerEmail || cust.email
          db.conversation.update({
            where: { id: conversation.id },
            data: { customerName, customerEmail },
          }).catch(() => {})
        }
      }
    }

    const conversationWithInfo = { ...conversation, customerName, customerEmail }

    // Mark all messages as read by admin
    await db.message.updateMany({
      where: { conversationId: id, isAdminRead: false },
      data: { isAdminRead: true },
    })

    // Mark conversation as read
    await db.conversation.update({
      where: { id },
      data: { isRead: true },
    })

    return ok(conversationWithInfo)
  } catch (error) {
    console.error('Message GET error:', error)
    return err('Failed to fetch conversation', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const body = await request.json()
    const { content } = replySchema.parse(body)

    const conversation = await db.conversation.findUnique({ where: { id } })
    if (!conversation) return err('Conversation not found', 404)

    const message = await db.message.create({
      data: {
        conversationId: id,
        content,
        senderType: 'admin',
        isAdminRead: true,
      },
    })

    await logActivity(
      admin.id,
      'REPLY_MESSAGE',
      `Replied to conversation ${id}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid input data', 400)
    }
    console.error('Message PUT error:', error)
    return err('Failed to send reply', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const { id } = await params
    const conversation = await db.conversation.findUnique({ where: { id } })
    if (!conversation) return err('Conversation not found', 404)

    // Messages are deleted via cascade
    await db.conversation.delete({ where: { id } })

    await logActivity(
      admin.id,
      'DELETE_CONVERSATION',
      `Deleted conversation ${id}`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({ id })
  } catch (error) {
    console.error('Message DELETE error:', error)
    return err('Failed to delete conversation', 500)
  }
}
