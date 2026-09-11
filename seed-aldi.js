// Seed ALDI products into Neon database
const { PrismaClient } = require('/home/z/my-project/node_modules/.prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_gx65FdvezHXR@ep-sparkling-bread-axyx9060-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require',
    },
  },
});

async function main() {
  console.log('🌱 Seeding ALDI products...\n');

  // ==================== CATEGORIES ====================
  console.log('📦 Creating categories...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'savon-liquide' },
      update: {},
      create: {
        name: 'Savon Liquide',
        slug: 'savon-liquide',
        description: 'Savons liquides de haute qualité ALDI',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'eau-de-javel' },
      update: {},
      create: {
        name: 'Eau de Javel',
        slug: 'eau-de-javel',
        description: 'Eau de Javel ALDI de qualité industrielle',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'liquide-vaisselle' },
      update: {},
      create: {
        name: 'Liquide Vaisselle',
        slug: 'liquide-vaisselle',
        description: 'Liquide vaisselle ALDI',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'savon-menager' },
      update: {},
      create: {
        name: 'Savon Ménager',
        slug: 'savon-menager',
        description: 'Savon liquide ménager ALDI',
        sortOrder: 4,
        isActive: true,
      },
    }),
  ]);

  const [catSavonLiquide, catJavel, catVaisselle, catMenager] = categories;
  console.log(`  ✓ Created ${categories.length} categories\n`);

  // ==================== PRODUCTS ====================
  console.log('🛒 Creating products...');

  // Product 1: Savon Liquide ALDI 750 ml
  const p1 = await prisma.product.upsert({
    where: { slug: 'savon-liquide-aldi-750ml' },
    update: {},
    create: {
      name: 'Savon Liquide ALDI 750 ml',
      slug: 'savon-liquide-aldi-750ml',
      description: 'Savon liquide ALDI 750 ml - disponible en Citron, Pomme, Fraise',
      longDescription: 'Savon liquide de haute qualité ALDI, format 750 ml. Disponible en parfums Citron, Pomme et Fraise. Idéal pour le lavage quotidien des mains et du corps.',
      price: 1000,
      wholesalePrice: 850,
      packSize: 12,
      packPrice: 10200,
      commissionPerUnit: 41.68,
      categoryId: catSavonLiquide.id,
      volume: '750ml',
      unit: 'bouteille',
      isActive: true,
      isFeatured: true,
      inStock: true,
      stockQty: 100,
      minStockAlert: 10,
    },
  });
  console.log(`  ✓ Product 1: ${p1.name}`);

  // Product 2: Eau de Javel ALDI 2,5 L
  const p2 = await prisma.product.upsert({
    where: { slug: 'eau-de-javel-aldi-2-5l' },
    update: {},
    create: {
      name: 'Eau de Javel ALDI 2,5 L',
      slug: 'eau-de-javel-aldi-2-5l',
      description: 'Eau de Javel ALDI 2,5 L - qualité industrielle',
      longDescription: 'Eau de Javel ALDI de qualité industrielle, format 2,5 litres. Efficace pour la désinfection et le blanchiment.',
      price: 1650,
      packSize: 10,
      packPrice: 16500,
      commissionPerUnit: 50,
      categoryId: catJavel.id,
      volume: '2.5L',
      unit: 'bouteille',
      isActive: true,
      isFeatured: true,
      inStock: true,
      stockQty: 100,
      minStockAlert: 10,
    },
  });
  console.log(`  ✓ Product 2: ${p2.name}`);

  // Product 3: Eau de Javel ALDI 5 L
  const p3 = await prisma.product.upsert({
    where: { slug: 'eau-de-javel-aldi-5l' },
    update: {},
    create: {
      name: 'Eau de Javel ALDI 5 L',
      slug: 'eau-de-javel-aldi-5l',
      description: 'Eau de Javel ALDI 5 L - qualité industrielle',
      longDescription: 'Eau de Javel ALDI de qualité industrielle, format 5 litres en bidon. Usage professionnel et intensif.',
      price: 4000,
      packSize: 10,
      packPrice: 35000,
      commissionPerUnit: 50,
      categoryId: catJavel.id,
      volume: '5L',
      unit: 'bidon',
      isActive: true,
      isFeatured: false,
      inStock: true,
      stockQty: 100,
      minStockAlert: 10,
    },
  });
  console.log(`  ✓ Product 3: ${p3.name}`);

  // Product 4: Liquide Vaisselle ALDI 5 L
  const p4 = await prisma.product.upsert({
    where: { slug: 'liquide-vaisselle-aldi-5l' },
    update: {},
    create: {
      name: 'Liquide Vaisselle ALDI 5 L',
      slug: 'liquide-vaisselle-aldi-5l',
      description: 'Liquide vaisselle ALDI 5 L',
      longDescription: 'Liquide vaisselle ALDI format 5 litres en bidon. Efficace et économique pour un usage intensif.',
      price: 5500,
      packSize: 10,
      packPrice: 45000,
      commissionPerUnit: 50,
      categoryId: catVaisselle.id,
      volume: '5L',
      unit: 'bidon',
      isActive: true,
      isFeatured: true,
      inStock: true,
      stockQty: 100,
      minStockAlert: 10,
    },
  });
  console.log(`  ✓ Product 4: ${p4.name}`);

  // Product 5: Savon Liquide Ménager ALDI 5 L
  const p5 = await prisma.product.upsert({
    where: { slug: 'savon-liquide-menager-aldi-5l' },
    update: {},
    create: {
      name: 'Savon Liquide Ménager ALDI 5 L',
      slug: 'savon-liquide-menager-aldi-5l',
      description: 'Savon liquide ménager ALDI 5 L - disponible en Citron, Lavande',
      longDescription: 'Savon liquide ménager ALDI format 5 litres en bidon. Disponible en parfums Citron et Lavande. Usage professionnel.',
      price: 5500,
      packSize: 10,
      packPrice: 45000,
      commissionPerUnit: 50,
      categoryId: catMenager.id,
      volume: '5L',
      unit: 'bidon',
      isActive: true,
      isFeatured: true,
      inStock: true,
      stockQty: 100,
      minStockAlert: 10,
    },
  });
  console.log(`  ✓ Product 5: ${p5.name}\n`);

  // ==================== VARIANTS ====================
  console.log('🎨 Creating variants...');

  // Product 1 variants (Citron, Pomme, Fraise)
  const v1a = await prisma.productVariant.upsert({
    where: { productId_slug: { productId: p1.id, slug: 'citron' } },
    update: {},
    create: {
      productId: p1.id,
      name: 'Citron',
      slug: 'citron',
      price: 1000,
      wholesalePrice: 850,
      packPrice: 10200,
      commissionPerUnit: 41.68,
      inStock: true,
      stockQty: 100,
      isActive: true,
    },
  });
  console.log(`  ✓ Variant: Savon Liquide 750ml - Citron`);

  const v1b = await prisma.productVariant.upsert({
    where: { productId_slug: { productId: p1.id, slug: 'pomme' } },
    update: {},
    create: {
      productId: p1.id,
      name: 'Pomme',
      slug: 'pomme',
      price: 1000,
      wholesalePrice: 850,
      packPrice: 10200,
      commissionPerUnit: 41.68,
      inStock: true,
      stockQty: 100,
      isActive: true,
    },
  });
  console.log(`  ✓ Variant: Savon Liquide 750ml - Pomme`);

  const v1c = await prisma.productVariant.upsert({
    where: { productId_slug: { productId: p1.id, slug: 'fraise' } },
    update: {},
    create: {
      productId: p1.id,
      name: 'Fraise',
      slug: 'fraise',
      price: 1000,
      wholesalePrice: 850,
      packPrice: 10200,
      commissionPerUnit: 41.68,
      inStock: true,
      stockQty: 100,
      isActive: true,
    },
  });
  console.log(`  ✓ Variant: Savon Liquide 750ml - Fraise`);

  // Product 5 variants (Citron, Lavande)
  const v5a = await prisma.productVariant.upsert({
    where: { productId_slug: { productId: p5.id, slug: 'citron' } },
    update: {},
    create: {
      productId: p5.id,
      name: 'Citron',
      slug: 'citron',
      price: 5500,
      packPrice: 45000,
      commissionPerUnit: 50,
      inStock: true,
      stockQty: 100,
      isActive: true,
    },
  });
  console.log(`  ✓ Variant: Savon Ménager 5L - Citron`);

  const v5b = await prisma.productVariant.upsert({
    where: { productId_slug: { productId: p5.id, slug: 'lavande' } },
    update: {},
    create: {
      productId: p5.id,
      name: 'Lavande',
      slug: 'lavande',
      price: 5500,
      packPrice: 45000,
      commissionPerUnit: 50,
      inStock: true,
      stockQty: 100,
      isActive: true,
    },
  });
  console.log(`  ✓ Variant: Savon Ménager 5L - Lavande\n`);

  // ==================== VERIFICATION ====================
  console.log('📊 Verifying seeded data...\n');

  const categoryCount = await prisma.category.count();
  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();

  console.log('═══════════════════════════════════════════');
  console.log('         ALDI SEED DATA SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`  Categories:       ${categoryCount}`);
  console.log(`  Products:         ${productCount}`);
  console.log(`  Product Variants: ${variantCount}`);
  console.log('═══════════════════════════════════════════\n');

  // Detail per category
  const catsWithProducts = await prisma.category.findMany({
    include: {
      products: {
        include: { variants: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  for (const cat of catsWithProducts) {
    console.log(`📁 ${cat.name} (${cat.slug})`);
    for (const prod of cat.products) {
      console.log(`   🛒 ${prod.name}`);
      console.log(`      Price: ${prod.price} FCFA | Wholesale: ${prod.wholesalePrice || 'N/A'} | Pack(${prod.packSize}): ${prod.packPrice} FCFA | Commission: ${prod.commissionPerUnit} FCFA/unit`);
      console.log(`      Stock: ${prod.stockQty} | Featured: ${prod.isFeatured} | Volume: ${prod.volume} | Unit: ${prod.unit}`);
      for (const v of prod.variants) {
        console.log(`      🎨 ${v.name} (${v.slug}) → ${v.price} FCFA | Pack: ${v.packPrice} | Commission: ${v.commissionPerUnit} | Stock: ${v.stockQty}`);
      }
    }
    console.log('');
  }

  console.log('✅ ALDI seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
