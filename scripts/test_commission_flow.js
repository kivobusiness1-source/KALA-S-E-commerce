/* E2E test: per-customer tiered commission cycle
 * Phase 0: cleanup leftovers from previous failed runs (restore stock, delete orders)
 * 1. Client A (new) → month 1 rate (41.68)
 * 2. Client B (new, same code) → month 1 rate again (RESET per new client ✓)
 * 3. Client A again, same month → month 1 rate
 * 4. Backdate A's track 2 months → order → month 2+ rate (25.01) ✓
 * 5. Cleanup all test data
 */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

const BASE = 'http://localhost:3000'
const CODE = 'KALA-PARTENAIRE831'
const PRODUCT_ID = 'cmtwdnq8e0005nn0aleg8wuqw' // Savon Liquide ALDI 750 ml (41.68 / 25.01)
const EMAIL_A = 'clienta-commissiontest@exemple.cg'
const EMAIL_B = 'clientb-commissiontest@exemple.cg'
const EMAIL_D = 'debug-commissiontest@exemple.cg'
const ALL_EMAILS = [EMAIL_A, EMAIL_B, EMAIL_D]
const TRACK_KEYS = ALL_EMAILS.map(e => `email:${e}`)

let failures = 0
function check(label, cond, extra = '') {
  if (cond) console.log(`  OK  ${label}`)
  else { failures++; console.log(`  FAIL: ${label} ${extra}`) }
}

async function placeOrder(email) {
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Client Test Commission',
      customerEmail: email,
      customerPhone: '+242061234567',
      address: '12 Rue de Test',
      city: 'Pointe-Noire',
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
      affiliateCode: CODE,
    }),
  })
  return res.json()
}

async function cleanupOrders(emails) {
  const orders = await db.order.findMany({
    where: { customerEmail: { in: emails } },
    select: { id: true, items: { select: { productId: true, quantity: true, isPack: true } } },
  })
  for (const o of orders) {
    for (const item of o.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      })
    }
  }
  const orderIds = orders.map(o => o.id)
  if (orderIds.length) {
    await db.commission.deleteMany({ where: { orderId: { in: orderIds } } })
    await db.loyaltyPoint.deleteMany({ where: { orderId: { in: orderIds } } })
    await db.order.deleteMany({ where: { id: { in: orderIds } } })
  }
  return orders.length
}

async function main() {
  // ── Phase 0: cleanup leftovers from previous runs ────────
  const removed = await cleanupOrders(ALL_EMAILS)
  await db.affiliateProductTrack.deleteMany({
    where: { affiliateId: { not: '' }, customerId: { in: TRACK_KEYS } },
  })
  console.log(`Phase 0: ${removed} leftover test order(s) removed, stock restored`)

  const affiliate = await db.affiliate.findUnique({ where: { code: CODE } })
  const product = await db.product.findUnique({ where: { id: PRODUCT_ID } })
  const stockBefore = product.stockQty
  const { pendingEarnings, totalOrders, totalEarnings } = affiliate

  console.log('── Commande 1 : client A (nouveau client) ──')
  const o1 = await placeOrder(EMAIL_A)
  check('commande créée', o1.success === true, JSON.stringify(o1).slice(0, 300))
  check('taux mois 1 : 41,68 × 2 = 83,36', o1.data?.totalCommission === 2 * 41.68, `totalCommission=${o1.data?.totalCommission}`)

  console.log('── Commande 2 : client B (nouveau client, MÊME code) ──')
  const o2 = await placeOrder(EMAIL_B)
  check('commande créée', o2.success === true, JSON.stringify(o2).slice(0, 300))
  check('cycle RESET au mois 1 : 41,68 × 2 = 83,36', o2.data?.totalCommission === 2 * 41.68, `totalCommission=${o2.data?.totalCommission}`)

  console.log('── Commande 3 : client A encore (même mois) ──')
  const o3 = await placeOrder(EMAIL_A)
  check('commande créée', o3.success === true, JSON.stringify(o3).slice(0, 300))
  check('toujours taux mois 1 dans le même mois', o3.data?.totalCommission === 2 * 41.68, `totalCommission=${o3.data?.totalCommission}`)

  const tracks = await db.affiliateProductTrack.findMany({
    where: { affiliateId: affiliate.id, customerId: { in: [`email:${EMAIL_A}`, `email:${EMAIL_B}`] } },
  })
  check('2 cycles de suivi créés (un par client)', tracks.length === 2, `trouvé=${tracks.length}`)

  console.log('── Antidate du cycle client A de 2 mois ──')
  const backdated = new Date()
  backdated.setMonth(backdated.getMonth() - 2)
  await db.affiliateProductTrack.updateMany({
    where: { affiliateId: affiliate.id, customerId: `email:${EMAIL_A}` },
    data: { firstCommissionAt: backdated },
  })

  console.log('── Commande 4 : client A (2 mois plus tard) → taux mois 2+ ──')
  const o4 = await placeOrder(EMAIL_A)
  check('commande créée', o4.success === true, JSON.stringify(o4).slice(0, 300))
  check('taux mois 2+ appliqué : 25,01 × 2 = 50,02', o4.data?.totalCommission === 2 * 25.01, `totalCommission=${o4.data?.totalCommission}`)

  console.log('── Le cycle du client B reste au mois 1 (indépendant) ──')
  const bTrack = await db.affiliateProductTrack.findUnique({
    where: { affiliateId_productId_customerId: { affiliateId: affiliate.id, productId: PRODUCT_ID, customerId: `email:${EMAIL_B}` } },
  })
  check('suivi client B existe', !!bTrack)
  if (bTrack) {
    const f = new Date(bTrack.firstCommissionAt)
    const diff = (new Date().getFullYear() - f.getFullYear()) * 12 + (new Date().getMonth() - f.getMonth())
    check('cycle client B démarré ce mois (mois 1)', diff === 0, `diff=${diff}`)
    check('date début client B non antidatée', f.getFullYear() === new Date().getFullYear())
  }

  // ── Final cleanup ────────────────────────────────────────
  console.log('── Nettoyage des données de test ──')
  const n = await cleanupOrders(ALL_EMAILS)
  await db.affiliateProductTrack.deleteMany({
    where: { customerId: { in: TRACK_KEYS } },
  })
  await db.product.update({ where: { id: PRODUCT_ID }, data: { stockQty: stockBefore } })
  await db.affiliate.update({
    where: { id: affiliate.id },
    data: { pendingEarnings, totalOrders, totalEarnings },
  })
  console.log(`  ${n} commande(s) test supprimée(s), stock & gains restaurés`)

  await db.$disconnect()
  if (failures > 0) { console.log(`\n${failures} CHECK(S) FAILED`); process.exit(1) }
  console.log('\nALL CHECKS PASSED')
}

main().catch(e => { console.error('ERROR:', e); process.exit(1) })
