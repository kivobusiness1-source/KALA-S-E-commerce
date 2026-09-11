/* Diagnostic: check live DB state for AffiliateProductTrack indexes and related tables */
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function main() {
  const idx = await db.$queryRawUnsafe(
    `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'AffiliateProductTrack' ORDER BY indexname`
  )
  console.log('=== AffiliateProductTrack indexes ===')
  console.log(JSON.stringify(idx, null, 2))

  const cols = await db.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'AffiliateProductTrack' ORDER BY ordinal_position`
  )
  console.log('=== AffiliateProductTrack columns ===')
  console.log(cols.map(c => c.column_name).join(', '))

  const tracks = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "AffiliateProductTrack"`)
  console.log('=== AffiliateProductTrack row count ===', JSON.stringify(tracks))

  try {
    const ct = await db.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'AffiliateCustomerTrack' ORDER BY ordinal_position`
    )
    console.log('=== AffiliateCustomerTrack columns ===', ct.map(c => c.column_name).join(', '))
  } catch {
    console.log('=== AffiliateCustomerTrack: TABLE DOES NOT EXIST ===')
  }

  // Sample orders with affiliate codes + distinct customer emails
  const ord = await db.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS n FROM "Order" WHERE "affiliateId" IS NOT NULL`
  )
  console.log('=== Orders with affiliate ===', JSON.stringify(ord))

  const com = await db.$queryRawUnsafe(
    `SELECT "commissionMonth", COUNT(*)::int AS n, SUM("commissionTotal")::float AS total
     FROM "Commission" GROUP BY "commissionMonth" ORDER BY "commissionMonth" NULLS LAST`
  )
  console.log('=== Commission by month ===')
  console.log(JSON.stringify(com, null, 2))

  await db.$disconnect()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
