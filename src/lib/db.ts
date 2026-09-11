import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string | undefined {
  // 1. Prefer NEON_DATABASE_URL if set
  if (process.env.NEON_DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.NEON_DATABASE_URL
  }
  // 2. Use DATABASE_URL if it's PostgreSQL
  if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
    return process.env.DATABASE_URL
  }
  // 3. Use DATABASE_URL_UNPOOLED if PostgreSQL
  if (process.env.DATABASE_URL_UNPOOLED?.startsWith('postgresql://')) {
    return process.env.DATABASE_URL_UNPOOLED
  }
  // 4. Return undefined (let Prisma use the schema default)
  return undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const url = getDatabaseUrl()
export const db =
  globalForPrisma.prisma ??
  new PrismaClient(url ? { datasourceUrl: url } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
