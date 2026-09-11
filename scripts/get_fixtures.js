/* Get test fixtures: affiliate codes + products with tiered rates */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const affiliates = await db.affiliate.findMany({
    select: { id: true, code: true, name: true, isActive: true },
    take: 5,
  })
  console.log('=== Affiliates ===')
  console.log(JSON.stringify(affiliates, null, 2))

  const products = await db.product.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, price: true, stockQty: true, inStock: true,
      commissionPerUnit: true, commissionMonth1PerUnit: true, commissionMonth2PlusPerUnit: true,
    },
    take: 6,
  })
  console.log('=== Products ===')
  console.log(JSON.stringify(products, null, 2))

  await db.$disconnect()
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
