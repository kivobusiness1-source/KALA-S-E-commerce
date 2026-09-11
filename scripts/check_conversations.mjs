import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const convs = await prisma.conversation.findMany({
  orderBy: { updatedAt: 'desc' },
  include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
})
console.log(JSON.stringify(convs.map(c => ({
  id: c.id, sessionId: c.sessionId.slice(0, 30),
  name: c.customerName, email: c.customerEmail,
  lastMsg: c.messages[0]?.content?.slice(0, 30) ?? null,
  updatedAt: c.updatedAt,
})), null, 2))
await prisma.$disconnect()
