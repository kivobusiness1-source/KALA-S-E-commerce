import { db } from '@/lib/db'
import { hashPassword } from './auth'

async function seed() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await hashPassword('Admin@2024!')
  const admin = await db.admin.upsert({
    where: { email: 'admin@congosoap.cg' },
    update: {},
    create: {
      email: 'admin@congosoap.cg',
      name: 'Administrateur',
      password: adminPassword,
      role: 'super_admin',
    },
  })
  console.log(`Admin created: ${admin.email}`)

  // Create categories
  const savonCategory = await db.category.upsert({
    where: { slug: 'savon-liquide' },
    update: {},
    create: {
      name: 'Savon Liquide',
      slug: 'savon-liquide',
      description: 'Savons liquides de haute qualité fabriqués au Congo-Brazzaville',
      sortOrder: 1,
    },
  })

  const detergentCategory = await db.category.upsert({
    where: { slug: 'detergent' },
    update: {},
    create: {
      name: 'Détergent',
      slug: 'detergent',
      description: 'Détergents puissants pour tous vos besoins de nettoyage',
      sortOrder: 2,
    },
  })

  const javelCategory = await db.category.upsert({
    where: { slug: 'eau-de-javel' },
    update: {},
    create: {
      name: 'Eau de Javel',
      slug: 'eau-de-javel',
      description: 'Eau de Javel de qualité industrielle pour la désinfection',
      sortOrder: 3,
    },
  })

  // Create products
  const products = [
    {
      name: 'CongoClean Savon Liquide 1L',
      slug: 'congoclean-savon-liquide-1l',
      description: 'Savon liquide doux pour le nettoyage quotidien. Formulé avec des ingrédients naturels.',
      longDescription: 'Notre savon liquide phare, le CongoClean 1L, est formulé à partir d\'ingrédients soigneusement sélectionnés pour offrir un nettoyage efficace tout en étant doux pour la peau. Fabriqué dans notre usine de Pointe-Noire, ce produit est le résultat de années de recherche et développement pour répondre aux besoins spécifiques des ménages congolais.',
      price: 1500,
      comparePrice: 1800,
      categoryId: savonCategory.id,
      volume: '1L',
      isFeatured: true,
      inStock: true,
      stockQty: 250,
    },
    {
      name: 'CongoClean Savon Liquide 5L',
      slug: 'congoclean-savon-liquide-5l',
      description: 'Format familial économique. Idéal pour les grandes familles et les entreprises.',
      longDescription: 'Le format 5L du CongoClean est conçu pour les familles nombreuses et les professionnels. Sa formule concentrée assure un nettoyage optimal avec moins de produit.',
      price: 5500,
      comparePrice: 6500,
      categoryId: savonCategory.id,
      volume: '5L',
      isFeatured: true,
      inStock: true,
      stockQty: 120,
    },
    {
      name: 'CongoClean Savon Liquide 10L',
      slug: 'congoclean-savon-liquide-10l',
      description: 'Format professionnel pour hôtels, restaurants et industries.',
      longDescription: 'Notre format professionnel 10L est spécialement conçu pour les établissements commerciaux, les hôtels et les industries nécessitant des volumes importants de savon liquide de qualité.',
      price: 9800,
      comparePrice: 12000,
      categoryId: savonCategory.id,
      volume: '10L',
      isFeatured: false,
      inStock: true,
      stockQty: 50,
    },
    {
      name: 'ProWash Détergent Poudre 500g',
      slug: 'prowash-detergent-poudre-500g',
      description: 'Détergent en poudre haute performance pour lessive. Élimine les taches tenaces.',
      longDescription: 'ProWash est notre détergent en poudre premium. Sa formule avancée pénètre profondément dans les fibres pour éliminer même les taches les plus tenaces. Parfait pour les vêtements de couleur et blancs.',
      price: 2200,
      comparePrice: 2500,
      categoryId: detergentCategory.id,
      volume: '500g',
      isFeatured: true,
      inStock: true,
      stockQty: 300,
    },
    {
      name: 'ProWash Détergent Liquide 1L',
      slug: 'prowash-detergent-liquide-1l',
      description: 'Détergent liquide pour un lavage doux et efficace. Protège les couleurs.',
      longDescription: 'Le détergent liquide ProWash offre une alternative douce au détergent en poudre. Sa formule liquide se dissout instantanément et est idéale pour le lavage à la main ou en machine.',
      price: 2800,
      comparePrice: 3200,
      categoryId: detergentCategory.id,
      volume: '1L',
      isFeatured: false,
      inStock: true,
      stockQty: 180,
    },
    {
      name: 'ProWash Détergent Liquide 5L',
      slug: 'prowash-detergent-liquide-5l',
      description: 'Détergent liquide format familial. Excellent rapport qualité-prix.',
      longDescription: 'Format économique du ProWash liquide, idéal pour les familles. Sa formule concentrée permet de laver jusqu\'à 50 charges de linge.',
      price: 11000,
      comparePrice: 13000,
      categoryId: detergentCategory.id,
      volume: '5L',
      isFeatured: false,
      inStock: true,
      stockQty: 80,
    },
    {
      name: 'JavelCongo Eau de Javel 1L',
      slug: 'javelcongo-eau-de-javel-1l',
      description: 'Eau de Javel de qualité industrielle. Désinfection efficace et fiable.',
      longDescription: 'JavelCongo est notre eau de Javel de qualité industrielle, produite dans notre usine de Pointe-Noire. Elle offre une désinfection fiable pour les surfaces, l\'eau de boisson et le traitement des eaux usées.',
      price: 800,
      comparePrice: 1000,
      categoryId: javelCategory.id,
      volume: '1L',
      isFeatured: true,
      inStock: true,
      stockQty: 500,
    },
    {
      name: 'JavelCongo Eau de Javel 5L',
      slug: 'javelcongo-eau-de-javel-5l',
      description: 'Format professionnel d\'eau de Javel. Idéal pour les collectivités et les entreprises.',
      longDescription: 'Le format 5L de JavelCongo est destiné aux professionnels et aux collectivités. Sa concentration optimisée assure une désinfection maximale.',
      price: 3000,
      comparePrice: 3800,
      categoryId: javelCategory.id,
      volume: '5L',
      isFeatured: false,
      inStock: true,
      stockQty: 200,
    },
    {
      name: 'JavelCongo Eau de Javel 20L',
      slug: 'javelcongo-eau-de-javel-20l',
      description: 'Format industriel. Pour les hôpitaux, hôtels et grandes surfaces.',
      longDescription: 'Notre format industriel 20L est conçu pour les hôpitaux, hôtels, restaurants et grandes surfaces nécessitant des volumes importants de produit de désinfection.',
      price: 10000,
      comparePrice: 12000,
      categoryId: javelCategory.id,
      volume: '20L',
      isFeatured: false,
      inStock: true,
      stockQty: 30,
    },
  ]

  for (const product of products) {
    await db.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }
  console.log(`Created ${products.length} products`)

  // Site settings
  const settings = [
    { key: 'site_name', value: 'CongoClean', type: 'string' },
    { key: 'site_tagline', value: 'Produits d\'hygiène fabriqués au Congo-Brazzaville', type: 'string' },
    { key: 'site_description', value: 'Fabricant de savon liquide, détergent et eau de Javel à Pointe-Noire, Congo-Brazzaville. Qualité industrielle pour les ménages et les professionnels.', type: 'string' },
    { key: 'contact_phone', value: '+242 06 123 4567', type: 'string' },
    { key: 'contact_email', value: 'contact@congoclean.cg', type: 'string' },
    { key: 'contact_address', value: 'Zone Industrielle, Pointe-Noire, Congo-Brazzaville', type: 'string' },
    { key: 'whatsapp_number', value: '+242061234567', type: 'string' },
    { key: 'currency', value: 'FCFA', type: 'string' },
    { key: 'free_shipping_threshold', value: '25000', type: 'number' },
  ]

  for (const setting of settings) {
    await db.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log(`Created ${settings.length} site settings`)

  // Sample emails
  const sampleEmails = [
    { email: 'client1@example.com', name: 'Marie Nzaba', source: 'website' },
    { email: 'hotel@pointenoire.cg', name: 'Hôtel Le Phare', source: 'contact' },
    { email: 'restaurant@brazzaville.cg', name: 'Restaurant La Baie', source: 'order' },
  ]

  for (const email of sampleEmails) {
    await db.emailSubscriber.upsert({
      where: { email: email.email },
      update: {},
      create: email,
    })
  }
  console.log(`Created ${sampleEmails.length} sample emails`)

  console.log('Seeding complete!')
}

seed()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await db.$disconnect()
    process.exit(1)
  })
