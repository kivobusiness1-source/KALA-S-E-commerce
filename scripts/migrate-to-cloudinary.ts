/**
 * Migration script: Upload existing local images to Cloudinary
 * and update database references from /uploads/xxx to Cloudinary URLs.
 *
 * Usage:
 *   bun run scripts/migrate-to-cloudinary.ts
 *
 * Requirements:
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 *   - Local images in public/uploads/
 *   - Database connection (DATABASE_URL in .env)
 */

import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '@prisma/client'
import { readFile, readdir, stat } from 'fs/promises'
import path from 'path'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

const BASE_FOLDER = 'kala'
const db = new PrismaClient()

interface MigrationResult {
  filename: string
  localUrl: string
  cloudinaryUrl: string
  publicId: string
  success: boolean
  error?: string
}

// ── Upload a single file to Cloudinary ──────────────────────
async function uploadToCloudinary(
  filePath: string,
  filename: string,
  folder: string
): Promise<{ secureUrl: string; publicId: string } | null> {
  const buffer = await readFile(filePath)

  // Detect if it's a video or image
  const ext = path.extname(filename).toLowerCase()
  const isVideo = ['.mp4', '.webm', '.ogv', '.mov'].includes(ext)
  const resourceType = isVideo ? 'video' : 'image'

  const publicId = `${BASE_FOLDER}/${folder}/${filename.replace(/\.[^.]+$/, '')}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: `${BASE_FOLDER}/${folder}`,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto',
        overwrite: true,
        tags: ['kala', 'migration', folder],
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }
        if (!result) {
          reject(new Error('No result from Cloudinary'))
          return
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        })
      }
    )

    uploadStream.end(buffer)
  })
}

// ── Main migration function ─────────────────────────────────
async function migrate() {
  console.log('🚀 Starting Cloudinary migration...\n')

  // Validate config
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials not configured in .env')
    console.error('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
    process.exit(1)
  }

  // Step 1: Upload all local files to Cloudinary
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  let files: string[]
  try {
    files = await readdir(uploadsDir)
  } catch {
    console.error('❌ No public/uploads/ directory found')
    process.exit(1)
  }

  console.log(`📁 Found ${files.length} files in public/uploads/\n`)

  const results: MigrationResult[] = []

  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename)
    const fileStat = await stat(filePath)

    if (!fileStat.isFile()) continue

    const localUrl = `/uploads/${filename}`
    console.log(`⬆️  Uploading: ${filename} (${(fileStat.size / 1024).toFixed(1)} KB)...`)

    try {
      const result = await uploadToCloudinary(filePath, filename, 'products')
      if (result) {
        console.log(`   ✅ → ${result.secureUrl}`)
        results.push({
          filename,
          localUrl,
          cloudinaryUrl: result.secureUrl,
          publicId: result.publicId,
          success: true,
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`   ❌ Failed: ${msg}`)
      results.push({
        filename,
        localUrl,
        cloudinaryUrl: '',
        publicId: '',
        success: false,
        error: msg,
      })
    }
  }

  const uploaded = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`\n📊 Upload results: ${uploaded.length} succeeded, ${failed.length} failed\n`)

  if (uploaded.length === 0) {
    console.log('⚠️  No files uploaded, skipping DB update.')
    await db.$disconnect()
    return
  }

  // Step 2: Update database references
  console.log('📝 Updating database references...\n')

  // Build a map of localUrl → cloudinaryUrl
  const urlMap = new Map(uploaded.map(r => [r.localUrl, r.cloudinaryUrl]))

  let productsUpdated = 0
  let categoriesUpdated = 0
  let settingsUpdated = 0

  // Update Product image and images fields
  const products = await db.product.findMany({
    where: {
      OR: [
        { image: { startsWith: '/uploads/' } },
        { images: { contains: '/uploads/' } },
      ],
    },
  })

  for (const product of products) {
    const updates: { image?: string; images?: string } = {}

    // Update single image
    if (product.image && urlMap.has(product.image)) {
      updates.image = urlMap.get(product.image)!
    }

    // Update images JSON array
    if (product.images && product.images.includes('/uploads/')) {
      try {
        const imageArray: string[] = JSON.parse(product.images)
        const newImageArray = imageArray.map(url => urlMap.get(url) || url)
        updates.images = JSON.stringify(newImageArray)
      } catch {
        console.warn(`   ⚠️  Could not parse images JSON for product ${product.id}`)
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.product.update({
        where: { id: product.id },
        data: updates,
      })
      productsUpdated++
      console.log(`   ✅ Product "${product.name}" updated`)
    }
  }

  // Update Category image field
  const categories = await db.category.findMany({
    where: { image: { startsWith: '/uploads/' } },
  })

  for (const category of categories) {
    if (category.image && urlMap.has(category.image)) {
      await db.category.update({
        where: { id: category.id },
        data: { image: urlMap.get(category.image)! },
      })
      categoriesUpdated++
      console.log(`   ✅ Category "${category.name}" updated`)
    }
  }

  // Update SiteSettings that might contain /uploads/ paths
  const settings = await db.siteSetting.findMany({
    where: { value: { contains: '/uploads/' } },
  })

  for (const setting of settings) {
    let newValue = setting.value
    for (const [localUrl, cloudUrl] of urlMap) {
      newValue = newValue.replaceAll(localUrl, cloudUrl)
    }
    if (newValue !== setting.value) {
      await db.siteSetting.update({
        where: { id: setting.id },
        data: { value: newValue },
      })
      settingsUpdated++
      console.log(`   ✅ Setting "${setting.key}" updated`)
    }
  }

  // Update WholesaleProduct images
  const wholesaleProducts = await db.wholesaleProduct.findMany({
    where: { image: { startsWith: '/uploads/' } },
  })

  let wholesaleUpdated = 0
  for (const wp of wholesaleProducts) {
    if (wp.image && urlMap.has(wp.image)) {
      await db.wholesaleProduct.update({
        where: { id: wp.id },
        data: { image: urlMap.get(wp.image)! },
      })
      wholesaleUpdated++
      console.log(`   ✅ Wholesale product "${wp.name}" updated`)
    }
  }

  console.log(`\n🏁 Migration complete!`)
  console.log(`   Products updated: ${productsUpdated}`)
  console.log(`   Categories updated: ${categoriesUpdated}`)
  console.log(`   Settings updated: ${settingsUpdated}`)
  console.log(`   Wholesale products updated: ${wholesaleUpdated}`)
  console.log(`   Files uploaded: ${uploaded.length}/${results.length}`)
  console.log(`\n💡 Local files in public/uploads/ are still intact and can be deleted manually.`)
  console.log(`   To delete: rm -rf public/uploads/`)

  if (failed.length > 0) {
    console.log(`\n⚠️  Failed files:`)
    failed.forEach(f => console.log(`   - ${f.filename}: ${f.error}`))
  }

  await db.$disconnect()
}

migrate().catch((err) => {
  console.error('Migration error:', err)
  process.exit(1)
})
