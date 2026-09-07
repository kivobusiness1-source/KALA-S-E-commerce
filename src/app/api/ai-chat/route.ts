import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/auth'

// ─── Zod validation (H-2) ───
const chatSchema = z.object({
  message: z.string().min(1, 'Message requis').max(2000, 'Message trop long'),
  sessionId: z.string().min(1).max(128),
})

// ─── Bounded memory with TTL (H-3) ───
interface ConversationEntry {
  messages: { role: string; content: string }[]
  lastActivity: number
}

const conversations = new Map<string, ConversationEntry>()
const MAX_CONVERSATIONS = 500
const CONVERSATION_TTL = 30 * 60 * 1000 // 30 minutes

function evictConversations() {
  const now = Date.now()

  // Remove TTL-expired entries
  for (const [key, entry] of conversations.entries()) {
    if (now - entry.lastActivity > CONVERSATION_TTL) {
      conversations.delete(key)
    }
  }

  // If still over limit, remove oldest entries
  if (conversations.size >= MAX_CONVERSATIONS) {
    const entries = Array.from(conversations.entries())
    entries.sort((a, b) => a[1].lastActivity - b[1].lastActivity)
    const toRemove = entries.slice(0, Math.floor(MAX_CONVERSATIONS / 4))
    toRemove.forEach(([key]) => conversations.delete(key))
  }
}

// Periodic cleanup
setInterval(evictConversations, 5 * 60 * 1000)

const SYSTEM_PROMPT = `Tu es l'assistant client de KALA'S, une entreprise de fabrication de produits d'hygiène basée à Pointe-Noire, Congo-Brazzaville.

Produits disponibles:
- Savon liquide (1L: 1 500 FCFA, 5L: 5 500 FCFA, 10L: 9 800 FCFA)
- Détergent liquide (1L: 2 800 FCFA, 5L: 11 000 FCFA)
- Détergent poudre 500g: 2 200 FCFA
- Eau de Javel (1L: 800 FCFA, 5L: 3 000 FCFA, 20L: 10 000 FCFA)

Informations de livraison:
- Zone de livraison: Pointe-Noire et périphérie (rayon 15 km)
- Centre-ville: GRATUIT
- Périphérie proche: 1 000 FCFA
- Périphérie éloignée: 1 500 FCFA
- Délai: 24-48h après confirmation
- Commandes en gros: tarifs préférentiels sur demande

Modes de paiement:
- Cash à la livraison
- Mobile money
- Virement bancaire

Contact:
- Téléphone: +242 06 123 4567
- Email: contact@kalas.cg
- Adresse: Zone Industrielle, Pointe-Noire
- Horaires: Lun-Ven 8h-18h, Sam 8h-14h

Règles:
- Réponds TOUJOURS en français
- Sois concis et professionnel
- Ne fais PAS de promotions non demandées
- Si tu ne connais pas la réponse, dirige le client vers le téléphone +242 06 123 4567
- Ne mentionne JAMAIS que tu es une IA
- Réponds comme un vrai conseiller client de l'entreprise
- Maximum 3-4 phrases par réponse`

const MAX_MESSAGES = 20

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`ai-chat:${clientIp}`, 20, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    // Validate input with Zod
    const body = await request.json()
    const { message, sessionId } = chatSchema.parse(body)

    // Check TTL before using cached conversation
    const now = Date.now()
    let entry = conversations.get(sessionId)
    if (entry && now - entry.lastActivity > CONVERSATION_TTL) {
      conversations.delete(sessionId)
      entry = undefined
    }

    let history = entry?.messages || [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    history.push({ role: 'user', content: message })

    if (history.length > MAX_MESSAGES) {
      history = [
        history[0],
        ...history.slice(-(MAX_MESSAGES - 1)),
      ]
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: history,
      thinking: { type: 'disabled' },
    })

    const aiResponse = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu traiter votre demande. Veuillez nous contacter au +242 06 123 4567."

    history.push({ role: 'assistant', content: aiResponse })

    // Evict old conversations before adding new one
    evictConversations()
    conversations.set(sessionId, { messages: history, lastActivity: Date.now() })

    return NextResponse.json({ success: true, response: aiResponse })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ')
      return NextResponse.json({ success: false, error: messages }, { status: 400 })
    }
    console.error('AI Chat error:', error)
    return NextResponse.json({
      success: true,
      response: 'Désolé, une erreur est survenue. Veuillez réessayer ou nous contacter au +242 06 123 4567.',
    })
  }
}
