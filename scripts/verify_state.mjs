import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const c1 = await prisma.conversation.findUnique({ where: { id: 'cmtwuas3h000jnni8kfzgzma3' } })
console.log('cmtwuas3h exists?', !!c1, c1 ? `sessionId=${c1.sessionId}` : '')
const all = await prisma.conversation.findMany({ orderBy: { updatedAt: 'desc' } })
console.log(`\nAll ${all.length} conversations:`)
for (const c of all) console.log(`  ${c.id} | ${c.sessionId.slice(0,30).padEnd(30)} | ${c.customerName} | ${c.customerEmail}`)
await prisma.$disconnect()
