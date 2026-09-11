import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateSession, logActivity, checkRateLimit } from '@/lib/auth'
import {
  calculateTotalUnits,
  calculateTieredItemCommission,
  determineCommissionMonth,
  sumCommissions,
  type CommissionInput,
  type TieredCommissionRates,
} from '@/lib/commission'
import { z } from 'zod'

function ok(data: unknown, status = 200) { return NextResponse.json({ success: true, data }, { status }) }
function err(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }) }

async function getAdmin(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return null
  return await validateSession(token)
}

const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().min(1),
  isPack: z.boolean().optional().default(false),
  packSize: z.number().int().positive().optional(),
})

const createOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: z.string().email('Invalid email address').max(254),
  customerPhone: z.string().max(20).optional(),
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().max(200).optional().default('Pointe-Noire'),
  notes: z.string().max(5000).optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  affiliateCode: z.string().max(50).optional(), // Affiliate promo code
})

const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  search: z.string().max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin(request)
    if (!admin) return err('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const query = listOrdersQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Record<string, unknown> = {}

    // Role-based filtering
    if (admin.role === 'livreur') {
      // Livreur: only see orders assigned to them via assignedToId
      where.assignedToId = admin.id
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { customerName: { contains: query.search } },
        { customerEmail: { contains: query.search } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true, image: true, volume: true } } } },
          assignedBy: { select: { id: true, name: true, email: true, role: true } },
          deliverer: { select: { id: true, name: true, phone: true, zone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.order.count({ where }),
    ])

    return ok({ orders, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err('Invalid query parameters', 400)
    }
    console.error('Orders GET error:', error)
    return err('Failed to fetch orders', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`orders:${clientIp}`, 10, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // ── Validate products and variants ──────────────────────
    const productIds = [...new Set(data.items.map(i => i.productId))]
    const variantIds = data.items.map(i => i.variantId).filter(Boolean) as string[]

    const [products, variants] = await Promise.all([
      db.product.findMany({ where: { id: { in: productIds } } }),
      variantIds.length > 0
        ? db.productVariant.findMany({ where: { id: { in: variantIds } } })
        : Promise.resolve([] as Awaited<ReturnType<typeof db.productVariant.findMany>>),
    ])

    const productMap = new Map(products.map(p => [p.id, p]))
    const variantMap = new Map(variants.map(v => [v.id, v]))

    for (const item of data.items) {
      const product = productMap.get(item.productId)
      if (!product) return err(`Product not found: ${item.productId}`, 400)
      if (!product.isActive) return err(`Product is not available: ${product.name}`, 400)

      // Check variant if provided
      if (item.variantId) {
        const variant = variantMap.get(item.variantId)
        if (!variant) return err(`Variant not found: ${item.variantId}`, 400)
        if (!variant.isActive) return err(`Variant is not available: ${variant.name}`, 400)
        if (!variant.inStock || variant.stockQty < item.quantity) {
          return err(`Insufficient stock for variant: ${variant.name} (available: ${variant.stockQty})`, 400)
        }
      } else {
        if (!product.inStock || product.stockQty < item.quantity) {
          return err(`Insufficient stock for: ${product.name} (available: ${product.stockQty})`, 400)
        }
      }
    }

    // ── Validate affiliate code (if provided) ──────────────
    let affiliate: { id: string; code: string } | null = null
    if (data.affiliateCode) {
      const found = await db.affiliate.findUnique({
        where: { code: data.affiliateCode },
        select: { id: true, code: true, isActive: true },
      })
      if (found && found.isActive) {
        affiliate = { id: found.id, code: found.code }
      }
      // If affiliate code is invalid/inactive, we still create the order — just no commission
    }

    // ── Build order items and calculate totals ──────────────
    const count = await db.order.count()
    const orderNumber = `CGC-${String(count + 1).padStart(6, '0')}`

    let totalAmount = 0
    const orderItemsData: Array<{
      productId: string
      variantId?: string
      productName: string
      variantName?: string
      quantity: number
      unitPrice: number
      totalPrice: number
      isPack: boolean
      packSize?: number
      totalUnits?: number
    }> = []

    // Track commission inputs for post-order calculation
    const commissionInputs: CommissionInput[] = []

    for (const item of data.items) {
      const product = productMap.get(item.productId)!
      const variant = item.variantId ? variantMap.get(item.variantId) : undefined

      // Determine unit price: variant overrides product
      const unitPrice = variant ? variant.price : product.price
      const totalPrice = unitPrice * item.quantity
      totalAmount += totalPrice

      const isPack = item.isPack ?? false
      const packSize = isPack ? (item.packSize ?? product.packSize ?? 1) : undefined
      const totalUnits = calculateTotalUnits(item.quantity, isPack, packSize)

      orderItemsData.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        isPack,
        packSize,
        totalUnits,
      })

      // Prepare commission input (will only be used if affiliate is valid)
      commissionInputs.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name,
        quantity: item.quantity,
        unitPrice,
        isPack,
        packSize,
        totalUnits,
      })
    }

    // ── Create order ────────────────────────────────────────
    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address,
        city: data.city,
        totalAmount,
        notes: data.notes,
        affiliateCode: affiliate?.code ?? null,
        affiliateId: affiliate?.id ?? null,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    })

    // ── Calculate and create commissions (if affiliate is valid) ──
    let totalCommission = 0
    if (affiliate) {
      const commissionResults: Array<{
        orderItemId: string
        commissionPerUnit: number
        commissionTotal: number
        commissionMonth: number
      }> = []

      const now = new Date()

      // Pre-fetch AffiliateProductTrack records for all products in this order
      const uniqueProductIds = [...new Set(commissionInputs.map(c => c.productId))]
      const existingTracks = await db.affiliateProductTrack.findMany({
        where: {
          affiliateId: affiliate.id,
          productId: { in: uniqueProductIds },
        },
      })
      const trackMap = new Map(existingTracks.map(t => [t.productId, t]))

      for (let i = 0; i < commissionInputs.length; i++) {
        const cInput = commissionInputs[i]
        const orderItem = order.items[i]

        // Get commission rates: variant overrides product
        const product = productMap.get(cInput.productId)!
        const variant = cInput.variantId ? variantMap.get(cInput.variantId) : undefined

        // Build tiered rates (variant overrides product)
        const rates: TieredCommissionRates = {
          commissionPerUnit: variant?.commissionPerUnit ?? product.commissionPerUnit ?? null,
          commissionMonth1PerUnit: variant?.commissionMonth1PerUnit ?? product.commissionMonth1PerUnit ?? null,
          commissionMonth2PlusPerUnit: variant?.commissionMonth2PlusPerUnit ?? product.commissionMonth2PlusPerUnit ?? null,
        }

        // Determine commission month from AffiliateProductTrack
        const track = trackMap.get(cInput.productId)
        const commissionMonth = determineCommissionMonth(track?.firstCommissionAt, now)

        const result = calculateTieredItemCommission(cInput, rates, commissionMonth)
        if (result) {
          commissionResults.push({
            orderItemId: orderItem.id,
            commissionPerUnit: result.commissionPerUnit,
            commissionTotal: result.commissionTotal,
            commissionMonth: result.commissionMonth,
          })
        }
      }

      // Create Commission records and update OrderItems in a transaction
      if (commissionResults.length > 0) {
        await db.$transaction(async (tx) => {
          for (const cr of commissionResults) {
            const orderItem = order.items.find(oi => oi.id === cr.orderItemId)!
            const cInput = commissionInputs[order.items.indexOf(orderItem)]!

            // Create Commission record
            await tx.commission.create({
              data: {
                affiliateId: affiliate!.id,
                orderId: order.id,
                orderItemId: cr.orderItemId,
                affiliateCode: affiliate!.code,
                productId: cInput.productId,
                variantId: cInput.variantId,
                productName: cInput.productName,
                variantName: cInput.variantName,
                quantity: cInput.totalUnits,
                unitPrice: cInput.unitPrice,
                totalSaleAmount: cInput.quantity * cInput.unitPrice,
                commissionPerUnit: cr.commissionPerUnit,
                commissionTotal: cr.commissionTotal,
                commissionMonth: cr.commissionMonth,
                status: 'pending',
              },
            })

            // Update OrderItem with commission data
            await tx.orderItem.update({
              where: { id: cr.orderItemId },
              data: {
                commissionPerUnit: cr.commissionPerUnit,
                commissionTotal: cr.commissionTotal,
                affiliateCode: affiliate!.code,
              },
            })

            // Upsert AffiliateProductTrack to record first commission date
            await tx.affiliateProductTrack.upsert({
              where: {
                affiliateId_productId: {
                  affiliateId: affiliate!.id,
                  productId: cInput.productId,
                },
              },
              create: {
                affiliateId: affiliate!.id,
                productId: cInput.productId,
                firstCommissionAt: now,
              },
              update: {}, // Don't update if already exists — keep original firstCommissionAt
            })
          }

          // Sum total commission
          totalCommission = commissionResults.reduce((sum, cr) => sum + cr.commissionTotal, 0)

          // Update affiliate earnings
          await tx.affiliate.update({
            where: { id: affiliate!.id },
            data: {
              pendingEarnings: { increment: totalCommission },
              totalOrders: { increment: 1 },
            },
          })
        })
      } else {
        // No commission items, but still increment totalOrders
        await db.affiliate.update({
          where: { id: affiliate.id },
          data: { totalOrders: { increment: 1 } },
        })
      }
    }

    // ── Deduct stock ────────────────────────────────────────
    for (const item of data.items) {
      const product = productMap.get(item.productId)!
      const newStock = product.stockQty - item.quantity
      await db.product.update({
        where: { id: product.id },
        data: {
          stockQty: newStock,
          inStock: newStock > 0,
        },
      })

      // Also deduct variant stock if applicable
      if (item.variantId) {
        const variant = variantMap.get(item.variantId)!
        const newVariantStock = variant.stockQty - item.quantity
        await db.productVariant.update({
          where: { id: variant.id },
          data: {
            stockQty: newVariantStock,
            inStock: newVariantStock > 0,
          },
        })
      }
    }

    // ── Award loyalty points: 1 point per 1000 FCFA spent ──
    const earnedPoints = Math.floor(totalAmount / 1000)
    if (earnedPoints > 0) {
      await db.loyaltyPoint.create({
        data: {
          email: data.customerEmail,
          points: earnedPoints,
          orderId: order.id,
          description: `Commande ${orderNumber} — ${earnedPoints} points gagnés`,
        },
      })
    }

    return ok({ ...order, earnedPoints, totalCommission }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(e => e.message).join(', ')
      return err(messages, 400)
    }
    console.error('Orders POST error:', error)
    return err('Failed to create order', 500)
  }
}