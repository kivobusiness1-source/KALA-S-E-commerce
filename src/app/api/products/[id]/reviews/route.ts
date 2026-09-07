import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/auth'

// GET /api/products/[id]/reviews - Public: get reviews for a product
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reviews = await db.review.findMany({
      where: { productId: id, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate average rating
    const allReviews = await db.review.findMany({
      where: { productId: id, isApproved: true },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.length,
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}

// POST /api/products/[id]/reviews - Public: add a review
const reviewSchema = z.object({
  customerName: z.string().min(2, 'Nom requis (2 caractères minimum)').max(100),
  rating: z.number().int().min(1, 'Note minimale: 1').max(5, 'Note maximale: 5'),
  comment: z.string().max(500, 'Commentaire trop long (500 caractères max)').optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown'
    if (!checkRateLimit(`reviews:${clientIp}`, 5, 60 * 1000)) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }, { status: 429 })
    }

    const { id } = await params

    // Check product exists
    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json({ success: false, error: 'Produit introuvable' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        productId: id,
        customerName: parsed.data.customerName,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}
