// End-to-end verification of tiered commission system
// 1. Temp admin session → 2. partner-products API → 3. product save with tiered rates → 4. cleanup
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const db = new PrismaClient()
const BASE = 'http://localhost:3000'

async function main() {
  const token = randomBytes(32).toString('hex')
  const admin = await db.admin.findFirst()
  if (!admin) throw new Error('No admin account found')
  await db.adminSession.create({ data: { token, adminId: admin.id, expiresAt: new Date(Date.now() + 15 * 60 * 1000) } })
  const cookie = `admin_token=${token}`
  console.log('✓ Temp admin session created for', admin.email)

  try {
    // ── 1. partner-products API (previously broken: unknown relation `product`) ──
    const affiliate = await db.affiliate.findFirst()
    console.log('\n── Test 1: GET /api/admin/partner-products ──')
    const r1 = await fetch(`${BASE}/api/admin/partner-products?affiliateId=${affiliate.id}`, { headers: { cookie } })
    const j1 = await r1.json()
    console.log(`HTTP ${r1.status} | success=${j1.success} | tracks=${Array.isArray(j1.data) ? j1.data.length : 'n/a'}`)
    if (r1.status !== 200) console.log('BODY:', JSON.stringify(j1).slice(0, 300))

    // ── 2. Save tiered rates on a product via PUT /api/products/[id] ──
    console.log('\n── Test 2: PUT /api/products/[id] with tiered rates ──')
    const product = await db.product.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
    const getR = await fetch(`${BASE}/api/products/${product.id}`, { headers: { cookie } })
    const current = await getR.json()
    const payload = current.data ?? current
    payload.commissionMonth1PerUnit = 60
    payload.commissionMonth2PlusPerUnit = 30
    const putR = await fetch(`${BASE}/api/products/${product.id}`, {
      method: 'PUT',
      headers: { cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const putJ = await putR.json()
    console.log(`HTTP ${putR.status} | success=${putJ.success ?? putJ.data?.success}`)
    const saved = await db.product.findUnique({ where: { id: product.id }, select: { name: true, commissionMonth1PerUnit: true, commissionMonth2PlusPerUnit: true } })
    console.log(`Saved: ${saved.name} | M1=${saved.commissionMonth1PerUnit} | M2+=${saved.commissionMonth2PlusPerUnit}`)

    // ── 3. Simulate tiered calculation for month 1 vs month 2+ ──
    console.log('\n── Test 3: Rate resolution logic ──')
    const p = await db.product.findUnique({ where: { id: product.id } })
    const rates = { commissionPerUnit: p.commissionPerUnit, commissionMonth1PerUnit: p.commissionMonth1PerUnit, commissionMonth2PlusPerUnit: p.commissionMonth2PlusPerUnit }
    console.log(`  Month 1 → 10 unités × ${rates.commissionMonth1PerUnit} = ${10 * (rates.commissionMonth1PerUnit ?? rates.commissionPerUnit)} FCFA`)
    console.log(`  Month 3 → 10 unités × ${rates.commissionMonth2PlusPerUnit} = ${10 * (rates.commissionMonth2PlusPerUnit ?? rates.commissionPerUnit)} FCFA`)
  } finally {
    await db.adminSession.delete({ where: { token } })
    console.log('\n✓ Temp admin session cleaned up')
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) }).finally(() => db.$disconnect())
