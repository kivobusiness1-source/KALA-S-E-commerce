import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateAffiliateSession } from '@/lib/auth'
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────

function ok(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status })
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

const COOKIE_NAME = 'affiliate_token'

async function getAffiliate(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return validateAffiliateSession(token)
}

// ── Zod Schemas ──────────────────────────────────────────

const createTransferSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['mobile_money', 'bank_transfer', 'cash'], {
    errorMap: () => ({ message: 'Method must be mobile_money, bank_transfer, or cash' }),
  }),
  phoneNumber: z.string().optional(),
  bankInfo: z.string().optional(),
})

// ── GET: List fund transfer requests / Process scheduled ──

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    // ─── Process Scheduled (cron endpoint) ──────────────
    if (action === 'processScheduled') {
      const now = new Date()

      // Find all scheduled requests where scheduledAt <= now
      const scheduledRequests = await db.fundTransferRequest.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: now },
        },
        include: { affiliate: true },
      })

      if (scheduledRequests.length === 0) {
        return ok({ message: 'No scheduled requests to process', processed: 0 })
      }

      let processed = 0

      for (const req of scheduledRequests) {
        try {
          // Step 1: Change status to processing
          await db.fundTransferRequest.update({
            where: { id: req.id },
            data: { status: 'processing' },
          })

          // Step 2: Move amount from pendingEarnings to paidEarnings on the affiliate
          // (decrement pendingEarnings, increment paidEarnings)
          await db.affiliate.update({
            where: { id: req.affiliateId },
            data: {
              pendingEarnings: { decrement: req.amount },
              paidEarnings: { increment: req.amount },
            },
          })

          // Step 3: Create AffiliatePayout record with status completed
          await db.affiliatePayout.create({
            data: {
              affiliateId: req.affiliateId,
              amount: req.amount,
              method: req.method,
              status: 'completed',
              notes: `Auto-processed from FundTransferRequest ${req.id}`,
            },
          })

          // Step 4: Change status to completed and set processedAt
          await db.fundTransferRequest.update({
            where: { id: req.id },
            data: {
              status: 'completed',
              processedAt: new Date(),
            },
          })

          processed++
        } catch (processError) {
          console.error(`Failed to process transfer request ${req.id}:`, processError)
          // Mark as failed
          await db.fundTransferRequest.update({
            where: { id: req.id },
            data: {
              status: 'failed',
              processedAt: new Date(),
              notes: `Processing failed: ${processError instanceof Error ? processError.message : 'Unknown error'}`,
            },
          })
        }
      }

      return ok({ message: `Processed ${processed} scheduled requests`, processed })
    }

    // ─── List affiliate's fund transfer requests ───────
    const affiliate = await getAffiliate(request)
    if (!affiliate) return err('Not authenticated', 401)

    const transfers = await db.fundTransferRequest.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
    })

    return ok({ transfers })
  } catch (error) {
    console.error('Affiliate transfer GET error:', error)
    return err('Internal server error', 500)
  }
}

// ── POST: Create a new fund transfer request ─────────────

export async function POST(request: NextRequest) {
  try {
    const affiliate = await getAffiliate(request)
    if (!affiliate) return err('Not authenticated', 401)

    const body = await request.json()
    const data = createTransferSchema.parse(body)

    // Validate amount <= affiliate.pendingEarnings
    if (data.amount > affiliate.pendingEarnings) {
      return err(
        `Amount (${data.amount}) exceeds your pending earnings (${affiliate.pendingEarnings})`,
        400,
      )
    }

    // Validate phoneNumber for mobile_money
    if (data.method === 'mobile_money' && !data.phoneNumber) {
      return err('Phone number is required for mobile money transfers', 400)
    }

    // Validate bankInfo for bank_transfer
    if (data.method === 'bank_transfer' && !data.bankInfo) {
      return err('Bank information is required for bank transfers', 400)
    }

    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // now + 2 hours

    // Create FundTransferRequest with status "pending"
    const transferRequest = await db.fundTransferRequest.create({
      data: {
        affiliateId: affiliate.id,
        amount: data.amount,
        method: data.method,
        phoneNumber: data.phoneNumber ?? null,
        bankInfo: data.bankInfo ?? null,
        status: 'pending',
        scheduledAt,
      },
    })

    // Move amount from pendingEarnings to paidEarnings immediately (to reserve the funds)
    await db.affiliate.update({
      where: { id: affiliate.id },
      data: {
        pendingEarnings: { decrement: data.amount },
        paidEarnings: { increment: data.amount },
      },
    })

    // Update status to "scheduled" (the 2h delay is just for actual payout execution)
    const updatedRequest = await db.fundTransferRequest.update({
      where: { id: transferRequest.id },
      data: { status: 'scheduled' },
    })

    return ok({ transfer: updatedRequest }, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      return err(firstIssue?.message ?? 'Invalid input data', 400)
    }
    console.error('Affiliate transfer POST error:', error)
    return err('Internal server error', 500)
  }
}
