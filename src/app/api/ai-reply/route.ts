import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { chatCompletion, isLLMConfigured, LLMError } from '@/lib/llm'

const replySchema = z.object({
  conversationId: z.string().optional(),
  customerMessage: z.string().min(1, 'Le message est requis'),
  context: z.string().optional(),
})

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const SYSTEM_PROMPT = `Tu es l'assistant client de KALA'S, une entreprise de produits d'hygiene a Pointe-Noire, Congo-Brazzaville.

Regles:
- Reponds TOUJOURS en francais
- Sois professionnel mais chaleureux
- Reponds de maniere concise (2-4 phrases max)
- Si on te demande des prix, dis de consulter le site web
- Si on te demande une livraison, explique qu'on livre a Pointe-Noire en 24-48h
- Ne jamais inventer de prix ou d'informations fausses
- Pour les reclamations, propose de contacter par email
- Utilise le tutoiement uniquement si le client utilise le tutoiement`

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Non autorise' }, { status: 401 })
    }

    // Check LLM configuration
    if (!isLLMConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'IA non configurée. Veuillez définir OPENAI_API_KEY dans les variables d\'environnement.',
      }, { status: 503 })
    }

    const body = await request.json()
    const validated = replySchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.issues[0].message }, { status: 400 })
    }

    const { customerMessage, context } = validated.data

    let contextInfo = context || ''
    if (validated.data.conversationId) {
      const recentMessages = await db.message.findMany({
        where: { conversationId: validated.data.conversationId },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
      if (recentMessages.length > 0) {
        const history = recentMessages.reverse().map(m => `${m.senderType === 'customer' ? 'Client' : 'Assistant'}: ${m.content}`).join('\n')
        contextInfo = `Historique recent:\n${history}\n\n${contextInfo}`
      }
    }

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: contextInfo ? `Contexte: ${contextInfo}\n\nMessage du client: ${customerMessage}` : customerMessage },
    ]

    const result = await chatCompletion({
      messages,
      temperature: 0.7,
    })

    const reply = result.content

    if (validated.data.conversationId) {
      await db.message.create({
        data: {
          conversationId: validated.data.conversationId,
          content: reply,
          senderType: 'admin',
          isAdminRead: true,
        },
      })
      await db.conversation.update({
        where: { id: validated.data.conversationId },
        data: { isRead: true, updatedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, data: { reply } })
  } catch (error) {
    if (error instanceof LLMError) {
      console.error('LLM Error:', error.code, error.message)
      return NextResponse.json({ success: false, error: `Erreur IA: ${error.message}` }, { status: 503 })
    }
    console.error('AI reply error:', error)
    return NextResponse.json({ success: false, error: 'Erreur IA' }, { status: 500 })
  }
}
