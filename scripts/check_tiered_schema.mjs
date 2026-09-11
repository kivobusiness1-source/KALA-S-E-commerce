// Check tiered commission schema sync with Postgres
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('── 1. Product tiered columns ──')
  const products = await db.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Product'
      AND column_name IN ('commissionPerUnit','commissionMonth1PerUnit','commissionMonth2PlusPerUnit')
    ORDER BY column_name`)
  console.log(products.map(p => p.column_name))

  console.log('── 2. ProductVariant tiered columns ──')
  const variants = await db.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'ProductVariant'
      AND column_name IN ('commissionPerUnit','commissionMonth1PerUnit','commissionMonth2PlusPerUnit')
    ORDER BY column_name`)
  console.log(variants.map(v => v.column_name))

  console.log('── 3. Commission.commissionMonth ──')
  const comm = await db.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Commission' AND column_name = 'commissionMonth'`)
  console.log(comm.map(c => c.column_name))

  console.log('── 4. AffiliateProductTrack table ──')
  const track = await db.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'AffiliateProductTrack'`)
  console.log(track.length > 0 ? 'EXISTS' : 'MISSING!')

  console.log('── 5. Current products with rates ──')
  const prods = await db.product.findMany({
    select: { name: true, commissionPerUnit: true, commissionMonth1PerUnit: true, commissionMonth2PlusPerUnit: true, isActive: true },
  })
  for (const p of prods) {
    console.log(`  ${p.name} | fallback=${p.commissionPerUnit ?? '—'} | M1=${p.commissionMonth1PerUnit ?? '—'} | M2+=${p.commissionMonth2PlusPerUnit ?? '—'}`)
  }

  console.log('── 6. Existing tracks ──')
  const tracks = await db.affiliateProductTrack.findMany({ include: { product: { select: { name: true } }, affiliate: { select: { name: true } } } })
  if (tracks.length === 0) console.log('  (none)')
  for (const t of tracks) {
    console.log(`  affiliate=${t.affiliate?.name} product=${t.product?.name} firstCommissionAt=${t.firstCommissionAt.toISOString()}`)
  }
}

main().catch(console.error).finally(() => db.$disconnect())
