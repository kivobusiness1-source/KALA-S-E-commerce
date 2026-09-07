import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

const conversations = new Map<string, { role: string; content: string }[]>()

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
    const { message, sessionId } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message et sessionId requis' }, { status: 400 })
    }

    let history = conversations.get(sessionId) || [
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
    conversations.set(sessionId, history)

    return NextResponse.json({ success: true, response: aiResponse })
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json({
      success: true,
      response: 'Désolé, une erreur est survenue. Veuillez réessayer ou nous contacter au +242 06 123 4567.',
    })
  }
}
