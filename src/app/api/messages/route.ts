import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, hasAdminRole, validateCustomerSession, checkRateLimit } from '@/lib/auth'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const createMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  content: z.string().min(1, 'Message content is required'),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)
    if (!hasAdminRole(admin, ['super_admin', 'admin', 'staff'])) return err('Accès refusé pour votre rôle', 403)

    const conversations = await db.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { isAdminRead: false, senderType: 'customer' },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Backfill missing customer info from Customer table
    const customerIdsToLookup: string[] = []
    for (const c of conversations) {
      if ((!c.customerName || !c.customerEmail) && c.sessionId.startsWith('customer-')) {
        const custId = c.sessionId.replace('customer-', '')
        if (custId) customerIdsToLookup.push(custId)
      }
    }

    let customerMap: Record<string, { name: string; email: string }> = {}
    if (customerIdsToLookup.length > 0) {
      const customers = await db.customer.findMany({
        where: { id: { in: customerIdsToLookup } },
        select: { id: true, name: true, email: true },
      })
      customerMap = Object.fromEntries(customers.map(c => [c.id, { name: c.name, email: c.email }]))
    }

    // Format: attach latest message directly, backfill customer info
    const formatted = conversations.map(c => {
      let customerName = c.customerName
      let customerEmail = c.customerEmail

      // Backfill from Customer table if missing
      if ((!customerName || !customerEmail) && c.sessionId.startsWith('customer-')) {
        const custId = c.sessionId.replace('customer-', '')
        const custInfo = customerMap[custId]
        if (custInfo) {
          customerName = customerName || custInfo.name
          customerEmail = customerEmail || custInfo.email
          // Persist backfill async (fire-and-forget)
          db.conversation.update({
            where: { id: c.id },
            data: { customerName, customerEmail },
          }).catch(() => {})
        }
      }

      return {
        ...c,
        customerName,
        customerEmail,
        latestMessage: c.messages[0] ?? null,
        messages: undefined,
        unreadCount: c._count.messages,
      }
    })

    return ok(formatted)
  } catch (error) {
    console.error('Messages GET error:', error)
    return err('Failed to fetch conversations', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 messages / min / IP
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`messages-post:${clientIp}`, 10, 60 * 1000)) {
      return err('Trop de requêtes. Veuillez réessayer plus tard.', 429)
    }

    const body = await request.json()
    const data = createMessageSchema.parse(body)

    // Bind customer-<id> conversations to the authenticated customer session
    if (data.sessionId.startsWith('customer-')) {
      const customer = await validateCustomerSession(request.cookies.get('customer_token')?.value ?? '')
      if (!customer || customer.id !== data.sessionId.slice('customer-'.length)) {
        return err('Non autorisé', 403)
      }
    }

    // Find or create conversation
    let conversation = await db.conversation.findUnique({
      where: { sessionId: data.sessionId },
    })

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          sessionId: data.sessionId,
          customerName: data.customerName || null,
          customerEmail: data.customerEmail || null,
        },
      })
    } else {
      // Always sync customer info from latest payload so the admin
      // conversation header reflects the customer's current name/email
      if (data.customerName || data.customerEmail) {
        await db.conversation.update({
          where: { id: conversation.id },
          data: {
            ...(data.customerName ? { customerName: data.customerName } : {}),
            ...(data.customerEmail ? { customerEmail: data.customerEmail } : {}),
          },
        })
      }
    }

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        content: data.content,
        senderType: 'customer',
        isAdminRead: false,
      },
    })

    // Mark conversation as unread for admin
    await db.conversation.update({
      where: { id: conversation.id },
      data: { isRead: false },
    })

    return ok(message, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Messages POST error:', error)
    return err('Failed to send message', 500)
  }
}
