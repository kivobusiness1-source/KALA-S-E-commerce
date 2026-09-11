import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return err('sessionId is required', 400)

    let conversation = await db.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { sessionId },
        include: { messages: true },
      })
    }

    return ok(conversation)
  } catch (error) {
    console.error('Chat GET error:', error)
    return err('Failed to fetch conversation', 500)
  }
}

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1, 'Message content is required'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`chat:${clientIp}`, 20, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const body = await request.json()
    const data = sendMessageSchema.parse(body)

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
      // Update customer info if provided and currently missing
      if (data.customerName || data.customerEmail) {
        await db.conversation.update({
          where: { id: conversation.id },
          data: {
            ...(data.customerName && !conversation.customerName ? { customerName: data.customerName } : {}),
            ...(data.customerEmail && !conversation.customerEmail ? { customerEmail: data.customerEmail } : {}),
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

    await db.conversation.update({
      where: { id: conversation.id },
      data: { isRead: false },
    })

    return ok(message, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Chat POST error:', error)
    return err('Failed to send message', 500)
  }
}
