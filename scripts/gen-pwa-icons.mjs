// Generate KALA'S PWA icons from public/logo.jpeg
// 1) Remove baked-in checkerboard "fake transparency" via edge flood-fill
// 2) Produce: icon-192/512 (white bg), maskable-192/512 (white bg, 72% scale),
//    apple-touch-icon 180 (white bg)
import sharp from 'sharp'
import path from 'path'

const ROOT = '/home/z/my-project'
const SRC = path.join(ROOT, 'public/logo.jpeg')
const OUT = path.join(ROOT, 'public/icons')

const SIZE = 512

async function loadRaw() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

// Sample the two checker shades from the top rows (pure light squares + slightly darker squares)
function getCheckerShades(data, w) {
  const px = (x, y) => {
    const i = (y * w + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  }
  // collect unique gray shades along top border
  const seen = new Map()
  for (let x = 0; x < w; x += 4) {
    const [r, g, b] = px(x, 2)
    if (Math.abs(r - g) < 6 && Math.abs(g - b) < 6 && r > 120) {
      const key = Math.round(r / 8) * 8
      seen.set(key, (seen.get(key) || 0) + 1)
    }
  }
  const shades = [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0])
  return shades.length ? shades : [255, 204]
}

function removeChecker({ data, w, h }) {
  const shades = getCheckerShades(data, w)
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = Math.abs(r - g) < 10 && Math.abs(g - b) < 10
    if (!gray) return false
    return shades.some(s => Math.abs(r - s) <= 14 && Math.abs(g - s) <= 14 && Math.abs(b - s) <= 14)
  }
  // BFS flood fill from all border pixels
  const stack = []
  const visited = new Uint8Array(w * h)
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return
    const p = y * w + x
    if (visited[p]) return
    visited[p] = 1
    if (isBg(p * 4)) stack.push(p)
  }
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1) }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y) }
  while (stack.length) {
    const p = stack.pop()
    const x = p % w, y = (p - x) / w
    data[p * 4 + 3] = 0
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
  return data
}

async function main() {
  const { data, w, h } = await loadRaw()
  removeChecker({ data, w, h })
  const base = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer()

  const white = { r: 255, g: 255, b: 255, alpha: 1 }

  async function emit(name, size, logoScale, bg) {
    const inner = Math.round(size * logoScale)
    const logo = await sharp(base).resize(inner, inner).png().toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: bg },
    }).composite([{ input: logo, gravity: 'center' }]).png()
      .toFile(path.join(OUT, name))
    console.log('wrote', name)
  }

  await emit('icon-192.png', 192, 0.94, white)
  await emit('icon-512.png', 512, 0.94, white)
  await emit('icon-maskable-192.png', 192, 0.68, white)
  await emit('icon-maskable-512.png', 512, 0.68, white)
  await emit('apple-touch-icon.png', 180, 0.92, white)
  console.log('done')
}

main().catch(e => { console.error(e); process.exit(1) })
