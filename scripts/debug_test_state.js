/* Debug: inspect orders & tracks created by the test */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const EMAIL_A = 'clienta-commissiontest@exemple.cg'
  const EMAIL_B = 'clientb-commissiontest@exemple.cg'

  const orders = await db.order.findMany({
    where: { customerEmail: { in: [EMAIL_A, EMAIL_B] } },
    select: { id: true, orderNumber: true, customerEmail: true, affiliateCode: true, totalAmount: true, createdAt: true },
  })
  console.log('=== Test orders ===')
  console.log(JSON.stringify(orders, null, 2))

  const tracks = await db.affiliateProductTrack.findMany({
    where: { customerId: { contains: 'commissiontest' } },
  })
  console.log('=== Test tracks ===')
  console.log(JSON.stringify(tracks, null, 2))

  const coms = await db.commission.findMany({
    where: { affiliateCode: 'KALA-PARTENAIRE831' },
    select: { id: true, commissionMonth: true, commissionPerUnit: true, commissionTotal: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  console.log('=== Recent commissions for KALA-PARTENAIRE831 ===')
  console.log(JSON.stringify(coms, null, 2))

  // Customer records?
  const customers = await db.customer.findMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
    select: { id: true, email: true },
  })
  console.log('=== Customer records for test emails ===')
  console.log(JSON.stringify(customers, null, 2))

  await db.$disconnect()
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
