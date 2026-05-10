import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const OUT_ROOT = path.join(process.cwd(), 'public', 'pixie')
const SIZE = 256
const CELL = 4
const STAGE_COUNT = 6

const variants = {
  spark: {
    body: ['#f59e0b', '#facc15', '#fde047', '#fff7ad'],
    shade: '#7c2d12',
    outline: '#2f1605',
    accent: '#60a5fa',
    accent2: '#fb923c',
    eye: '#08091a',
    glow: ['#fde047', '#60a5fa', '#d946ef'],
  },
  blip: {
    body: ['#6d28d9', '#8b5cf6', '#c084fc', '#f0abfc'],
    shade: '#32105f',
    outline: '#130723',
    accent: '#22d3ee',
    accent2: '#fb7185',
    eye: '#070817',
    glow: ['#8b5cf6', '#22d3ee', '#fb7185'],
  },
  momo: {
    body: ['#2f8f46', '#5fbd5f', '#a3e635', '#dcfce7'],
    shade: '#14532d',
    outline: '#062915',
    accent: '#facc15',
    accent2: '#f97316',
    eye: '#07150c',
    glow: ['#22c55e', '#bef264', '#facc15'],
  },
  shade: {
    body: ['#1d4ed8', '#3b82f6', '#93c5fd', '#e0f2fe'],
    shade: '#172554',
    outline: '#050a1d',
    accent: '#c4b5fd',
    accent2: '#f8fafc',
    eye: '#020617',
    glow: ['#60a5fa', '#c4b5fd', '#f8fafc'],
  },
  orbit: {
    body: ['#0891b2', '#22d3ee', '#a5f3fc', '#f0fdfa'],
    shade: '#155e75',
    outline: '#05232f',
    accent: '#f0abfc',
    accent2: '#67e8f9',
    eye: '#07131a',
    glow: ['#22d3ee', '#a78bfa', '#f0abfc'],
  },
  heart: {
    body: ['#be123c', '#f43f5e', '#fb7185', '#ffe4e6'],
    shade: '#881337',
    outline: '#3b0716',
    accent: '#f9a8d4',
    accent2: '#fbbf24',
    eye: '#12040a',
    glow: ['#fb7185', '#f9a8d4', '#fbbf24'],
  },
  robot: {
    body: ['#64748b', '#94a3b8', '#cbd5e1', '#f8fafc'],
    shade: '#334155',
    outline: '#0f172a',
    accent: '#22d3ee',
    accent2: '#f8fafc',
    eye: '#020617',
    glow: ['#38bdf8', '#94a3b8', '#f8fafc'],
  },
}

const stageScale = [0, 0.86, 0.96, 1.08, 1.18, 1.27, 1.34]

function makeCanvas(w = SIZE, h = SIZE, fill = [0, 0, 0, 0]) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0]
    data[i + 1] = fill[1]
    data[i + 2] = fill[2]
    data[i + 3] = fill[3]
  }
  return { w, h, data }
}

function hex(input, alpha = 255) {
  const h = input.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    alpha,
  ]
}

function blend(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) return
  const idx = (y * canvas.w + x) * 4
  const sa = color[3] / 255
  const da = canvas.data[idx + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa <= 0) return
  canvas.data[idx] = Math.round((color[0] * sa + canvas.data[idx] * da * (1 - sa)) / oa)
  canvas.data[idx + 1] = Math.round((color[1] * sa + canvas.data[idx + 1] * da * (1 - sa)) / oa)
  canvas.data[idx + 2] = Math.round((color[2] * sa + canvas.data[idx + 2] * da * (1 - sa)) / oa)
  canvas.data[idx + 3] = Math.round(oa * 255)
}

function rect(canvas, x, y, w, h, color) {
  const c = Array.isArray(color) ? color : hex(color)
  x = snap(x); y = snap(y); w = snap(w); h = snap(h)
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) blend(canvas, px, py, c)
  }
}

function ellipse(canvas, cx, cy, rx, ry, color) {
  const c = Array.isArray(color) ? color : hex(color)
  for (let y = snap(cy - ry); y <= snap(cy + ry); y += CELL) {
    for (let x = snap(cx - rx); x <= snap(cx + rx); x += CELL) {
      const dx = (x + CELL / 2 - cx) / rx
      const dy = (y + CELL / 2 - cy) / ry
      if (dx * dx + dy * dy <= 1) rect(canvas, x, y, CELL, CELL, c)
    }
  }
}

function ring(canvas, cx, cy, rx, ry, thick, color) {
  const c = Array.isArray(color) ? color : hex(color)
  for (let y = snap(cy - ry); y <= snap(cy + ry); y += CELL) {
    for (let x = snap(cx - rx); x <= snap(cx + rx); x += CELL) {
      const dx = (x + CELL / 2 - cx) / rx
      const dy = (y + CELL / 2 - cy) / ry
      const outer = dx * dx + dy * dy
      const ix = (x + CELL / 2 - cx) / (rx - thick)
      const iy = (y + CELL / 2 - cy) / (ry - thick)
      const inner = ix * ix + iy * iy
      if (outer <= 1 && inner >= 1) rect(canvas, x, y, CELL, CELL, c)
    }
  }
}

function polygon(canvas, points, color) {
  const c = Array.isArray(color) ? color : hex(color)
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  for (let y = snap(Math.min(...ys)); y <= snap(Math.max(...ys)); y += CELL) {
    for (let x = snap(Math.min(...xs)); x <= snap(Math.max(...xs)); x += CELL) {
      if (insidePolygon(x + CELL / 2, y + CELL / 2, points)) rect(canvas, x, y, CELL, CELL, c)
    }
  }
}

function line(canvas, x0, y0, x1, y1, width, color) {
  const c = Array.isArray(color) ? color : hex(color)
  const dx = x1 - x0
  const dy = y1 - y0
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) / CELL
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps
    rect(canvas, x0 + dx * t - width / 2, y0 + dy * t - width / 2, width, width, c)
  }
}

function diamond(canvas, x, y, r, color) {
  polygon(canvas, [[x, y - r], [x + r, y], [x, y + r], [x - r, y]], color)
}

function sparkle(canvas, x, y, color, size = 6) {
  rect(canvas, x - size, y, size * 2, CELL, color)
  rect(canvas, x, y - size, CELL, size * 2, color)
  diamond(canvas, x, y, Math.max(4, size / 2), color)
}

function heartShape(canvas, cx, cy, scale, color) {
  ellipse(canvas, cx - 8 * scale, cy - 5 * scale, 10 * scale, 10 * scale, color)
  ellipse(canvas, cx + 8 * scale, cy - 5 * scale, 10 * scale, 10 * scale, color)
  polygon(canvas, [
    [cx - 18 * scale, cy - 3 * scale],
    [cx + 18 * scale, cy - 3 * scale],
    [cx, cy + 22 * scale],
  ], color)
}

function snap(n) {
  return Math.round(n / CELL) * CELL
}

function insidePolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], yi = points[i][1]
    const xj = points[j][0], yj = points[j][1]
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function drawBackdrop(canvas, v, stage) {
  const cx = 128
  const cy = stage >= 5 ? 126 : 132
  ring(canvas, cx, cy, 56 + stage * 8, 52 + stage * 7, 8, hex(v.glow[0], 34 + stage * 8))
  if (stage >= 2) {
    sparkle(canvas, 76, 72, hex(v.glow[1], 150), 5)
    sparkle(canvas, 186, 82, hex(v.glow[2], 135), 4)
  }
  if (stage >= 3) ring(canvas, cx, cy, 82 + stage * 5, 74 + stage * 5, 6, hex(v.glow[1], 54))
  if (stage >= 4) {
    sparkle(canvas, 56, 168, hex(v.glow[2], 180), 7)
    sparkle(canvas, 204, 174, hex(v.glow[0], 180), 7)
  }
  if (stage >= 5) ring(canvas, cx, cy, 112, 102, 6, hex(v.glow[2], 74))
  if (stage >= 6) {
    ring(canvas, cx, cy, 120, 112, 7, hex(v.glow[0], 96))
    ring(canvas, cx, cy, 112, 38, 5, hex(v.glow[1], 110))
    sparkle(canvas, 42, 82, hex(v.glow[2], 210), 8)
    sparkle(canvas, 214, 112, hex(v.glow[1], 210), 8)
    sparkle(canvas, 132, 24, hex(v.glow[0], 220), 7)
  }
}

function drawEyes(canvas, cx, cy, v, stage) {
  ellipse(canvas, cx - 20, cy - 8, 11, 14, v.eye)
  ellipse(canvas, cx + 22, cy - 8, 11, 14, v.eye)
  rect(canvas, cx - 24, cy - 15, 5, 5, '#ffffff')
  rect(canvas, cx + 18, cy - 15, 5, 5, '#ffffff')
  if (stage >= 4) {
    rect(canvas, cx - 16, cy, 5, 5, hex(v.accent, 210))
    rect(canvas, cx + 26, cy, 5, 5, hex(v.accent, 210))
  }
}

function drawSmile(canvas, cx, cy, v, stage) {
  rect(canvas, cx - 12, cy + 26, 24, 4, v.outline)
  if (stage >= 3) rect(canvas, cx - 8, cy + 30, 16, 4, v.outline)
  if (stage >= 6) rect(canvas, cx - 14, cy + 35, 28, 4, hex(v.body[3], 200))
}

function drawRoundBody(canvas, v, stage, options = {}) {
  const s = stageScale[stage]
  const cx = 128
  const cy = stage === 1 ? 136 : stage >= 5 ? 126 : 132
  const rx = (options.rx ?? 47) * s
  const ry = (options.ry ?? 52) * s

  if (stage >= 2) {
    polygon(canvas, [[cx - rx - 7, cy + 4], [cx - rx - 30, cy + 17], [cx - rx - 6, cy + 29]], v.outline)
    polygon(canvas, [[cx + rx + 7, cy + 4], [cx + rx + 30, cy + 17], [cx + rx + 6, cy + 29]], v.outline)
    polygon(canvas, [[cx - rx - 7, cy + 9], [cx - rx - 22, cy + 18], [cx - rx - 6, cy + 24]], v.accent2)
    polygon(canvas, [[cx + rx + 7, cy + 9], [cx + rx + 22, cy + 18], [cx + rx + 6, cy + 24]], v.accent2)
  }

  ellipse(canvas, cx + 2, cy + 8, rx + 8, ry + 9, v.outline)
  ellipse(canvas, cx, cy, rx, ry, v.body[0])
  ellipse(canvas, cx - 8, cy - 10, rx * 0.78, ry * 0.78, v.body[1])
  ellipse(canvas, cx - 19, cy - 22, rx * 0.34, ry * 0.28, hex(v.body[3], 230))
  ellipse(canvas, cx + 20, cy + 16, rx * 0.36, ry * 0.44, hex(v.shade, 105))

  rect(canvas, cx - 29, cy + ry - 12, 18, 22, v.accent2)
  rect(canvas, cx + 11, cy + ry - 12, 18, 22, v.accent2)
  drawEyes(canvas, cx, cy, v, stage)
  drawSmile(canvas, cx, cy, v, stage)

  if (stage >= 5) {
    diamond(canvas, cx, cy - ry - 14, 10, v.accent)
    rect(canvas, cx - 4, cy - ry - 30, 8, 18, v.accent2)
  }
}

function drawSpark(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  drawRoundBody(canvas, v, stage)
  const cy = stage >= 5 ? 126 : 132
  polygon(canvas, [[114, cy - 60], [134, cy - 112], [132, cy - 72], [156, cy - 74], [120, cy - 28]], v.outline)
  polygon(canvas, [[120, cy - 61], [132, cy - 100], [130, cy - 72], [148, cy - 72], [122, cy - 38]], v.body[3])
  line(canvas, 68, 188, 96, 154, 5, hex(v.accent, stage >= 5 ? 190 : 120))
  line(canvas, 188, 188, 160, 154, 5, hex(v.glow[2], stage >= 5 ? 185 : 115))
}

function drawGlitch(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  drawRoundBody(canvas, v, stage, { rx: 48, ry: 50 })
  const y = stage >= 5 ? 126 : 132
  rect(canvas, 86, y - 54, 28, 8, hex(v.accent, 230))
  rect(canvas, 146, y - 36, 30, 8, hex(v.accent2, 220))
  rect(canvas, 72, y + 16, 22, 8, hex(v.accent, 190))
  rect(canvas, 160, y + 44, 26, 8, hex(v.body[3], 175))
  if (stage >= 3) {
    rect(canvas, 36, 96, 34, 8, hex(v.accent2, 170))
    rect(canvas, 184, 72, 42, 8, hex(v.accent, 170))
  }
  if (stage >= 6) {
    rect(canvas, 42, 58, 52, 8, hex(v.accent, 210))
    rect(canvas, 170, 190, 46, 8, hex(v.accent2, 200))
  }
}

function drawLeaf(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  drawRoundBody(canvas, v, stage, { rx: 46, ry: 54 })
  const cy = stage >= 5 ? 126 : 132
  polygon(canvas, [[116, cy - 60], [144, cy - 104], [158, cy - 58], [128, cy - 42]], v.outline)
  polygon(canvas, [[122, cy - 62], [142, cy - 94], [152, cy - 60], [130, cy - 48]], v.body[2])
  line(canvas, 128, cy - 54, 144, cy - 82, 4, v.shade)
  if (stage >= 3) {
    polygon(canvas, [[68, 92], [38, 66], [82, 66]], hex(v.body[2], 220))
    polygon(canvas, [[188, 92], [218, 66], [174, 66]], hex(v.body[2], 220))
  }
  if (stage >= 5) {
    line(canvas, 54, 178, 92, 148, 5, hex(v.accent, 185))
    line(canvas, 202, 178, 164, 148, 5, hex(v.accent, 185))
  }
  if (stage >= 6) {
    polygon(canvas, [[52, 136], [24, 108], [68, 98], [84, 124]], hex(v.body[2], 220))
    polygon(canvas, [[204, 136], [232, 108], [188, 98], [172, 124]], hex(v.body[2], 220))
  }
}

function drawMoonlight(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  drawRoundBody(canvas, v, stage, { rx: 48, ry: 52 })
  const cy = stage >= 5 ? 126 : 132
  ellipse(canvas, 150, cy - 76, 22, 30, v.accent2)
  ellipse(canvas, 160, cy - 80, 18, 30, v.outline)
  polygon(canvas, [[92, cy - 52], [112, cy - 82], [128, cy - 48]], v.outline)
  polygon(canvas, [[164, cy - 48], [186, cy - 82], [194, cy - 42]], v.outline)
  sparkle(canvas, 72, 72, hex(v.accent2, 220), 5)
  if (stage >= 4) sparkle(canvas, 198, 94, hex(v.accent2, 220), 5)
  if (stage >= 6) {
    sparkle(canvas, 48, 126, hex(v.accent2, 235), 8)
    sparkle(canvas, 210, 138, hex(v.accent, 220), 8)
  }
}

function drawHologram(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  if (stage >= 3) {
    ring(canvas, 128, stage >= 5 ? 126 : 132, 86, 26, 5, hex(v.accent, 95))
    ring(canvas, 128, stage >= 5 ? 126 : 132, 104, 36, 4, hex(v.accent2, 80))
  }
  drawRoundBody(canvas, v, stage, { rx: 50, ry: 50 })
  const y = stage >= 5 ? 126 : 132
  line(canvas, 86, y - 48, 158, y - 56, 5, hex(v.accent2, 210))
  rect(canvas, 92, y + 46, 74, 5, hex(v.accent, 155))
  if (stage >= 5) {
    rect(canvas, 54, 72, 32, 7, hex(v.body[3], 145))
    rect(canvas, 178, 180, 38, 7, hex(v.accent, 150))
  }
}

function drawHeartPremium(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  const s = [0, 1.6, 1.82, 2.08, 2.32, 2.52, 2.68][stage]
  const cx = 128
  const cy = stage >= 5 ? 122 : 128
  heartShape(canvas, cx + 2, cy + 7, s + 0.18, v.outline)
  heartShape(canvas, cx, cy, s, v.body[0])
  heartShape(canvas, cx - 5, cy - 6, s * 0.76, v.body[1])
  ellipse(canvas, cx - 24, cy - 20, 16 * s, 10 * s, hex(v.body[3], 230))
  ellipse(canvas, cx + 20, cy + 16, 12 * s, 16 * s, hex(v.shade, 115))
  drawEyes(canvas, cx, cy, v, stage)
  drawSmile(canvas, cx, cy, v, stage)
  diamond(canvas, cx, cy - 64, 9, v.accent2)
  if (stage >= 5) {
    heartShape(canvas, 58, 168, 0.5, hex(v.accent, 220))
    heartShape(canvas, 204, 86, 0.48, hex(v.accent2, 220))
  }
}

function drawRobotPremium(canvas, v, stage) {
  drawBackdrop(canvas, v, stage)
  const s = stageScale[stage]
  const cx = 128
  const cy = stage >= 5 ? 124 : 130
  const w = snap(72 * s)
  const h = snap(64 * s)
  const left = cx - w / 2
  const top = cy - h / 2

  rect(canvas, left - 8, top - 8, w + 16, h + 20, v.outline)
  rect(canvas, left, top, w, h, v.body[0])
  rect(canvas, left + 8, top + 8, w - 16, h - 16, v.body[1])
  rect(canvas, left + 12, top + 12, w * 0.42, h * 0.26, v.body[3])
  rect(canvas, left + w * 0.58, top + h * 0.54, w * 0.28, h * 0.24, hex(v.shade, 170))
  rect(canvas, left + 10, top - 18, w - 20, 12, v.outline)
  rect(canvas, left + 16, top - 15, w - 32, 6, v.body[2])
  line(canvas, cx, top - 18, cx, top - 40, 5, v.outline)
  diamond(canvas, cx, top - 46, 9, v.accent)

  if (stage >= 2) {
    rect(canvas, left - 24, top + 22, 20, 24, v.outline)
    rect(canvas, left + w + 4, top + 22, 20, 24, v.outline)
    rect(canvas, left - 18, top + 26, 12, 16, v.body[2])
    rect(canvas, left + w + 8, top + 26, 12, 16, v.body[2])
  }

  rect(canvas, left + 18, top + 24, 18, 14, v.eye)
  rect(canvas, left + w - 36, top + 24, 18, 14, v.eye)
  rect(canvas, left + 21, top + 27, 12, 8, v.accent)
  rect(canvas, left + w - 33, top + 27, 12, 8, v.accent)
  rect(canvas, cx - 18, top + h - 18, 36, 5, v.outline)
  rect(canvas, cx - 10, top + h - 12, 20, 4, hex(v.accent, 190))
}

function generateSprite(id, stage) {
  const v = variants[id]
  const canvas = makeCanvas()
  if (id === 'spark') drawSpark(canvas, v, stage)
  if (id === 'blip') drawGlitch(canvas, v, stage)
  if (id === 'momo') drawLeaf(canvas, v, stage)
  if (id === 'shade') drawMoonlight(canvas, v, stage)
  if (id === 'orbit') drawHologram(canvas, v, stage)
  if (id === 'heart') drawHeartPremium(canvas, v, stage)
  if (id === 'robot') drawRobotPremium(canvas, v, stage)
  return canvas
}

function previewSheet(id, sprites) {
  const card = 256
  const gap = 20
  const pad = 20
  const canvas = makeCanvas(pad * 2 + card * sprites.length + gap * (sprites.length - 1), 296, [5, 7, 26, 255])
  for (let i = 0; i < sprites.length; i++) {
    const x = pad + i * (card + gap)
    const y = pad
    rect(canvas, x, y, card, card, [18, 15, 47, 255])
    rect(canvas, x, y, card, 2, hex(variants[id].glow[0], 210))
    rect(canvas, x, y + card - 2, card, 2, hex(variants[id].glow[0], 120))
    rect(canvas, x, y, 2, card, hex(variants[id].glow[0], 120))
    rect(canvas, x + card - 2, y, 2, card, hex(variants[id].glow[0], 120))
    blit(canvas, sprites[i], x, y)
  }
  return canvas
}

function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) {
      const idx = (y * src.w + x) * 4
      if (src.data[idx + 3] === 0) continue
      blend(dst, ox + x, oy + y, [
        src.data[idx],
        src.data[idx + 1],
        src.data[idx + 2],
        src.data[idx + 3],
      ])
    }
  }
}

function writePng(canvas, file) {
  const rows = Buffer.alloc((canvas.w * 4 + 1) * canvas.h)
  for (let y = 0; y < canvas.h; y++) {
    const rowStart = y * (canvas.w * 4 + 1)
    rows[rowStart] = 0
    const srcStart = y * canvas.w * 4
    Buffer.from(canvas.data.buffer, canvas.data.byteOffset + srcStart, canvas.w * 4)
      .copy(rows, rowStart + 1)
  }

  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr(canvas.w, canvas.h)),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]))
}

function ihdr(w, h) {
  const b = Buffer.alloc(13)
  b.writeUInt32BE(w, 0)
  b.writeUInt32BE(h, 4)
  b[8] = 8
  b[9] = 6
  b[10] = 0
  b[11] = 0
  b[12] = 0
  return b
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

let stagePngs = 0
let previewSheets = 0

for (const id of Object.keys(variants)) {
  const dir = path.join(OUT_ROOT, id)
  const sprites = []
  for (let stage = 1; stage <= STAGE_COUNT; stage++) {
    const sprite = generateSprite(id, stage)
    sprites.push(sprite)
    writePng(sprite, path.join(dir, `pixie-${id}-stage-${stage}.png`))
    stagePngs++
  }
  writePng(previewSheet(id, sprites), path.join(dir, `pixie-${id}-preview-sheet.png`))
  previewSheets++
}

console.log(`Generated ${stagePngs} stage PNGs and ${previewSheets} preview sheets in ${OUT_ROOT}`)
