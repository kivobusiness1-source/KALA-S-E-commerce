import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'
const prisma = new PrismaClient()
const admin = await prisma.admin.findFirst()
const token = randomBytes(32).toString('hex')
await prisma.adminSession.create({
  data: { adminId: admin.id, token, expiresAt: new Date(Date.now() + 3600_000) },
})
console.log('TOKEN=' + token)
await prisma.$disconnect()
