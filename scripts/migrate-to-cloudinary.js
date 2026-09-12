/**
 * Migration Cloudinary — KALA E-commerce
 * =======================================
 * Migre les images locales (public/uploads) vers Cloudinary et
 * met à jour toutes les références dans la base de données.
 *
 * Prérequis : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * doivent être renseignés dans .env
 *
 * Usage : node scripts/migrate-to-cloudinary.js [--dry-run]
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { PrismaClient } = require('@prisma/client');

// Fix : si DATABASE_URL du shell n'est pas postgres (ancien SQLite exporté),
// le recharger depuis .env manuellement
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  const match = envContent.match(/^DATABASE_URL=["']?(.+?)["']?$/m);
  if (match) process.env.DATABASE_URL = match[1];
}

const db = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// ── Configuration ────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const LOCAL_UPLOADS = path.join(process.cwd(), 'public', 'uploads');

// Mapping des fichiers locaux → dossier Cloudinary cible
const FILE_FOLDERS = {
  '1789129307180-7250c275abbc.jpg': 'hero',      // Image hero
  '1789129445117-7da8bf7fde96.jpg': 'products',  // Eau de Javel 5L
  '1789129478369-5ed227cdc69f.jpg': 'products',  // Liquide Vaisselle 5L
  '1789129760933-f9b0e7bab39c.jpg': 'products',  // Savon Ménager 5L
  // '1789130952663-162e28a5edcb.mp4': 'videos', // MP4 orphelin — décommenter si besoin
};

// ── Helpers ──────────────────────────────────────────────────
function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function localToCloudinaryPath(localPath) {
  // "/uploads/1789129445117-7da8bf7fde96.jpg" → objet { filename, folder }
  const filename = path.basename(localPath);
  const folder = FILE_FOLDERS[filename] || 'general';
  const resourceType = filename.endsWith('.mp4') ? 'video' : 'image';
  return { filename, folder, resourceType };
}

function expectedCloudinaryUrl(localPath) {
  const { filename, folder, resourceType } = localToCloudinaryPath(localPath);
  const publicId = `kala/${folder}/${filename.replace(/\.[^.]+$/, '')}`;
  const type = resourceType === 'video' ? 'video' : 'image';
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${type}/upload/${publicId}`;
}

async function uploadFile(localPath) {
  const { filename, folder, resourceType } = localToCloudinaryPath(localPath);
  const buffer = fs.readFileSync(localPath);
  const publicId = `kala/${folder}/${filename.replace(/\.[^.]+$/, '')}`;

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: `kala/${folder}`,
        resource_type: resourceType,
        overwrite: true,
        tags: ['kala', 'migration', folder],
        ...(resourceType === 'image'
          ? { transformation: [{ width: 2000, height: 2000, crop: 'limit' }], quality: 'auto', fetch_format: 'auto' }
          : {}),
      },
      (err, res) => (err ? reject(new Error(err.message)) : resolve(res))
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
  };
}

// ── Migration des références DB ──────────────────────────────
async function migrateDbRef(localPath, newUrl) {
  const changes = [];

  // 1. Products (image + images JSON)
  const products = await db.product.findMany({
    where: {
      OR: [{ image: localPath }, { images: { contains: localPath } }],
    },
  });
  for (const p of products) {
    const data = {};
    if (p.image === localPath) data.image = newUrl;
    if (p.images && p.images.includes(localPath)) {
      try {
        const arr = JSON.parse(p.images);
        const idx = arr.indexOf(localPath);
        if (idx >= 0) { arr[idx] = newUrl; data.images = JSON.stringify(arr); }
      } catch { /* garder tel quel si JSON invalide */ }
    }
    if (DRY_RUN) {
      changes.push(`  [DRY] Product "${p.name}": ${localPath} → ${newUrl}`);
    } else if (Object.keys(data).length > 0) {
      await db.product.update({ where: { id: p.id }, data });
      changes.push(`  [OK] Product "${p.name}" mis à jour`);
    }
  }

  // 2. Categories
  const cats = await db.category.findMany({ where: { image: localPath } });
  for (const c of cats) {
    if (DRY_RUN) changes.push(`  [DRY] Category "${c.name}" → ${newUrl}`);
    else { await db.category.update({ where: { id: c.id }, data: { image: newUrl } }); changes.push(`  [OK] Category "${c.name}" mise à jour`); }
  }

  // 3. ProductVariant
  const variants = await db.productVariant.findMany({ where: { image: localPath } });
  for (const v of variants) {
    if (DRY_RUN) changes.push(`  [DRY] Variant "${v.name}" → ${newUrl}`);
    else { await db.productVariant.update({ where: { id: v.id }, data: { image: newUrl } }); changes.push(`  [OK] Variant "${v.name}" mis à jour`); }
  }

  // 4. WholesaleProduct
  const ws = await db.wholesaleProduct.findMany({ where: { image: localPath } });
  for (const w of ws) {
    if (DRY_RUN) changes.push(`  [DRY] Wholesale "${w.name}" → ${newUrl}`);
    else { await db.wholesaleProduct.update({ where: { id: w.id }, data: { image: newUrl } }); changes.push(`  [OK] Wholesale "${w.name}" mis à jour`); }
  }

  // 5. SiteSettings (hero, etc.)
  const settings = await db.siteSetting.findMany({ where: { value: { contains: localPath } } });
  for (const s of settings) {
    const newValue = s.value.split(localPath).join(newUrl);
    if (DRY_RUN) changes.push(`  [DRY] Setting "${s.key}" → ${newValue.slice(0, 80)}`);
    else { await db.siteSetting.update({ where: { id: s.id }, data: { value: newValue } }); changes.push(`  [OK] Setting "${s.key}" mis à jour`); }
  }

  return changes;
}

// ── Main ─────────────────────────────────────────────────────
(async () => {
  console.log('═══════════════════════════════════════════════');
  console.log('  Migration Cloudinary — KALA E-commerce');
  console.log('═══════════════════════════════════════════════');
  console.log(`Mode : ${DRY_RUN ? 'DRY-RUN (aucune modification)' : 'RÉEL'}`);
  console.log(`Cloud : ${process.env.CLOUDINARY_CLOUD_NAME || '(non configuré)'}\n`);

  if (!isConfigured()) {
    console.error('❌ Cloudinary non configuré !');
    console.error('   Renseignez dans .env :');
    console.error('   CLOUDINARY_CLOUD_NAME=...');
    console.error('   CLOUDINARY_API_KEY=...');
    console.error('   CLOUDINARY_API_SECRET=...');
    process.exit(1);
  }

  // Vérifier la connexion avec un ping
  try {
    await cloudinary.api.ping();
    console.log('✅ Connexion Cloudinary OK\n');
  } catch (e) {
    const msg = e?.error?.message || e?.message || JSON.stringify(e).slice(0, 200);
    console.error('❌ Connexion Cloudinary échouée :', msg);
    console.error('   → Vérifiez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env');
    process.exit(1);
  }

  const results = { uploaded: 0, failed: 0, dbChanges: 0 };

  for (const [filename, folder] of Object.entries(FILE_FOLDERS)) {
    const localPath = path.join(LOCAL_UPLOADS, filename);
    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  ${filename} : fichier local introuvable, ignoré`);
      continue;
    }

    const urlRef = `/uploads/${filename}`;
    const sizeMo = (fs.statSync(localPath).size / 1024 / 1024).toFixed(2);
    console.log(`📤 ${filename} (${sizeMo} Mo) → kala/${folder}/`);

    try {
      if (!DRY_RUN) {
        const up = await uploadFile(localPath);
        console.log(`   ✅ Uploadé : ${up.url}`);
        var newUrl = up.url;
      } else {
        var newUrl = expectedCloudinaryUrl(urlRef);
        console.log(`   [DRY] URL cible : ${newUrl}`);
      }
      results.uploaded++;

      const changes = await migrateDbRef(urlRef, newUrl);
      if (changes.length === 0) console.log('   ℹ️  Aucune référence DB pour ce fichier');
      changes.forEach(c => { console.log(c); if (!c.includes('[DRY]')) results.dbChanges++; });
      console.log('');
    } catch (e) {
      console.error(`   ❌ Échec : ${e.message}\n`);
      results.failed++;
    }
  }

  console.log('═══════════════════════════════════════════════');
  console.log(`Résumé : ${results.uploaded} upload(s), ${results.dbChanges} mise(s) à jour DB, ${results.failed} échec(s)`);
  if (!DRY_RUN && results.failed === 0) {
    console.log('\n💡 Les fichiers locaux restent dans public/uploads/ comme backup.');
    console.log('   Vérifiez le site, puis vous pourrez les supprimer manuellement.');
  }
  await db.$disconnect();
})();
