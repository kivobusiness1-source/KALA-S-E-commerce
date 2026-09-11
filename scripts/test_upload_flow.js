/* E2E test: image upload via /api/upload (admin auth + magic-byte fallback) */
const { execSync } = require('child_process')
const fs = require('fs')

const BASE = 'http://localhost:3000'
const COOKIE_JAR = '/tmp/admin_cookies.txt'

let failures = 0
function check(label, cond, extra = '') {
  if (cond) console.log(`  OK  ${label}`)
  else { failures++; console.log(`  FAIL: ${label} ${extra}`) }
}

// Minimal valid PNG (1x1 red pixel)
function makePng() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
}

// Minimal valid JPEG (1x1)
function makeJpeg() {
  return Buffer.from(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
    'base64',
  )
}

async function main() {
  // ── 1. Admin login ──────────────────────────────────────
  console.log('── 1. Login admin ──')
  const loginRes = await fetch(`${BASE}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@kalas.cg', password: 'Admin@2024!' }),
  })
  const login = await loginRes.json()
  check('login réussi', login.success === true, JSON.stringify(login).slice(0, 200))
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const token = setCookie.split(';')[0] // admin_token=...
  check('cookie admin_token reçu', token.startsWith('admin_token='))

  // ── 2. Upload PNG (MIME correct) ────────────────────────
  console.log('── 2. Upload image PNG (produit) ──')
  const png = makePng()
  const form1 = new FormData()
  form1.append('image', new File([png], 'produit-test.png', { type: 'image/png' }))
  const up1 = await (await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { cookie: token }, body: form1 })).json()
  check('upload PNG réussi', up1.success === true, JSON.stringify(up1).slice(0, 300))
  const url1 = up1.data?.url
  check('URL retournée /uploads/...', typeof url1 === 'string' && url1.startsWith('/uploads/'), `url=${url1}`)
  if (url1) {
    const imgRes = await fetch(`${BASE}${url1}`)
    check('image servie (HTTP 200)', imgRes.status === 200, `status=${imgRes.status}`)
    check('contenu = PNG original', Buffer.compare(Buffer.from(await imgRes.arrayBuffer()), png) === 0)
  }

  // ── 3. Upload JPEG avec MIME faux (fallback octets magiques) ──
  console.log('── 3. Upload JPEG avec MIME déclaré incorrect ──')
  const jpeg = makeJpeg()
  const form2 = new FormData()
  form2.append('image', new File([jpeg], 'photo.jpeg', { type: 'application/octet-stream' }))
  const up2 = await (await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { cookie: token }, body: form2 })).json()
  check('upload réussi via détection octets magiques', up2.success === true && up2.data?.type === 'image/jpeg', JSON.stringify(up2).slice(0, 300))

  // ── 4. Rejet d'un fichier non-image ─────────────────────
  console.log('── 4. Rejet fichier non autorisé ──')
  const form3 = new FormData()
  form3.append('image', new File([Buffer.from('hello world, pas une image')], 'notes.txt', { type: 'text/plain' }))
  const up3 = await (await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { cookie: token }, body: form3 })).json()
  check('fichier texte rejeté (400)', up3.success === false, JSON.stringify(up3).slice(0, 200))

  // ── 5. Rejet sans authentification ──────────────────────
  console.log('── 5. Rejet sans auth admin ──')
  const form4 = new FormData()
  form4.append('image', new File([png], 'x.png', { type: 'image/png' }))
  const up4 = await (await fetch(`${BASE}/api/upload`, { method: 'POST', body: form4 })).json()
  check('upload sans cookie rejeté (401)', up4.success === false, JSON.stringify(up4).slice(0, 200))

  // ── Cleanup: remove uploaded test files ─────────────────
  console.log('── Nettoyage fichiers de test ──')
  for (const url of [url1, up2.data?.url].filter(Boolean)) {
    const f = `/home/z/my-project/public${url}`
    try { fs.unlinkSync(f); console.log(`  supprimé: ${url}`) } catch {}
  }

  console.log(failures > 0 ? `\n${failures} CHECK(S) FAILED` : '\nALL CHECKS PASSED')
  process.exit(failures > 0 ? 1 : 0)
}

main().catch(e => { console.error('ERROR:', e); process.exit(1) })
