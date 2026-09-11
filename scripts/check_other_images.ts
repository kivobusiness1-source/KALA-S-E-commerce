import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const cats = await prisma.category.findMany({ select: { slug: true, image: true } })
  console.log('=== CATEGORIES ===')
  for (const c of cats) console.log(`${c.slug} | image=${c.image}`)
  const wp = await prisma.wholesaleProduct.findMany({ select: { name: true, image: true } })
  console.log('=== WHOLESALE PRODUCTS ===')
  for (const w of wp) console.log(`${w.name} | image=${w.image}`)
}
main().finally(() => prisma.$disconnect())
