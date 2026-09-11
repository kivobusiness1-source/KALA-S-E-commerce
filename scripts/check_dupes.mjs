import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
// Check duplicates and constraints
const dupes = await prisma.$queryRawUnsafe(`
  SELECT "sessionId", COUNT(*) as cnt FROM "Conversation" GROUP BY "sessionId" HAVING COUNT(*) > 1
`)
console.log('Duplicate sessionIds:', JSON.stringify(dupes))
const idx = await prisma.$queryRawUnsafe(`
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Conversation'
`)
console.log('Indexes:', JSON.stringify(idx))
// Detail of the two dupes
const convs = await prisma.conversation.findMany({
  where: { sessionId: 'customer-cmtwuaqv4000gnni8s2w5' },
  include: { messages: { orderBy: { createdAt: 'asc' } } },
})
for (const c of convs) {
  console.log(`\nConv ${c.id}: createdAt=${c.createdAt.toISOString()} name=${c.customerName}`)
  for (const m of c.messages) console.log(`   msg: [${m.senderType}] ${m.content.slice(0,40)} @ ${m.createdAt.toISOString()}`)
}
await prisma.$disconnect()
