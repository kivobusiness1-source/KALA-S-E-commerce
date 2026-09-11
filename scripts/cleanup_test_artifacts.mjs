import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
// 1. Delete test conversation created by my POST (contains only my "test sync" message)
const del = await prisma.conversation.deleteMany({ where: { id: 'cmtwutf85000tnni8q3x1c8pp' } })
console.log('Test conversations deleted:', del.count)
// 2. Delete my admin test session
const delSess = await prisma.adminSession.deleteMany({ where: { token: 'bc08463b68b0113dd1b54ce5794a8e00bb2a56f0d9c3a60c91c68e1e52615752' } })
console.log('Test sessions deleted:', delSess.count)
// 3. Final state
const all = await prisma.conversation.findMany({ orderBy: { updatedAt: 'desc' } })
console.log(`\nFinal state (${all.length} conversations):`)
for (const c of all) console.log(`  ${c.sessionId.slice(0,34).padEnd(34)} | ${c.customerName ?? 'null'} | ${c.customerEmail ?? 'null'}`)
await prisma.$disconnect()
