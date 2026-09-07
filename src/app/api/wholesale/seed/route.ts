import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity } from '@/lib/auth'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

// ─── Default wholesale products ───

const defaultProducts = [
  {
    name: 'Savon Liquide 1L',
    description: 'Savon liquide pour le lavage des mains et du linge, format 1 litre. Lot de 10 bouteilles.',
    lotSize: 10,
    lotUnit: 'bouteilles',
    pricePerLot: 25000,
    comparePrice: 30000,
    isActive: true,
    minLots: 5,
    stockLots: 100,
  },
  {
    name: 'Eau de Javel 5L',
    description: 'Eau de Javel concentrée pour la désinfection, format 5 litres. Lot de 6 bidons.',
    lotSize: 6,
    lotUnit: 'bidons',
    pricePerLot: 30000,
    comparePrice: 36000,
    isActive: true,
    minLots: 5,
    stockLots: 80,
  },
  {
    name: 'Détergent en poudre 500g',
    description: 'Détergent en poudre pour le lavage du linge, format 500g. Lot de 12 sachets.',
    lotSize: 12,
    lotUnit: 'sachets',
    pricePerLot: 18000,
    comparePrice: 22000,
    isActive: true,
    minLots: 5,
    stockLots: 120,
  },
  {
    name: 'Savon Liquide 5L',
    description: 'Savon liquide professionnel pour le lavage, format 5 litres. Lot de 4 bidons.',
    lotSize: 4,
    lotUnit: 'bidons',
    pricePerLot: 35000,
    comparePrice: 42000,
    isActive: true,
    minLots: 5,
    stockLots: 60,
  },
  {
    name: 'Eau de Javel 1L',
    description: 'Eau de Javel pour la désinfection domestique, format 1 litre. Lot de 12 bouteilles.',
    lotSize: 12,
    lotUnit: 'bouteilles',
    pricePerLot: 15000,
    comparePrice: 18000,
    isActive: true,
    minLots: 5,
    stockLots: 150,
  },
]

// ─── Default payment methods ───

const defaultPaymentMethods = [
  {
    name: 'M-Pesa',
    description: 'Paiement via M-Pesa. Envoyez le montant au numéro ci-dessous et indiquez la référence.',
    accountInfo: '+242 06 500 0000',
    icon: '📱',
    isActive: true,
    sortOrder: 1,
    isCash: false,
  },
  {
    name: 'Airtel Money',
    description: 'Paiement via Airtel Money. Envoyez le montant au numéro ci-dessous et indiquez la référence.',
    accountInfo: '+242 05 500 0000',
    icon: '📲',
    isActive: true,
    sortOrder: 2,
    isCash: false,
  },
  {
    name: 'Espèces',
    description: "Paiement en espèces à la livraison ou au dépôt KALA'S.",
    accountInfo: null,
    icon: '💰',
    isActive: true,
    sortOrder: 3,
    isCash: true,
  },
]

// ─── POST: Admin only - Seed default data ───

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    // Check if wholesale products already exist
    const existingProductCount = await db.wholesaleProduct.count()
    let productsSeeded = 0

    if (existingProductCount === 0) {
      await db.wholesaleProduct.createMany({ data: defaultProducts })
      productsSeeded = defaultProducts.length
    }

    // Check if payment methods already exist
    const existingPaymentCount = await db.wholesalePaymentMethod.count()
    let paymentMethodsSeeded = 0

    if (existingPaymentCount === 0) {
      await db.wholesalePaymentMethod.createMany({ data: defaultPaymentMethods })
      paymentMethodsSeeded = defaultPaymentMethods.length
    }

    await logActivity(
      admin.id,
      'SEED_WHOLESALE',
      `Seeded wholesale: ${productsSeeded} products, ${paymentMethodsSeeded} payment methods`,
      request.headers.get('x-forwarded-for') ?? undefined,
    )

    return ok({
      productsSeeded,
      paymentMethodsSeeded,
      message: existingProductCount === 0 && existingPaymentCount === 0
        ? 'Wholesale data seeded successfully'
        : existingProductCount > 0 && existingPaymentCount > 0
          ? 'Wholesale data already exists, nothing seeded'
          : 'Partial seed: some data already existed',
    }, 201)
  } catch (error) {
    console.error('WholesaleSeed POST error:', error)
    return err('Failed to seed wholesale data', 500)
  }
}
