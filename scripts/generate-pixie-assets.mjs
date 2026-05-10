import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const OUT_ROOT = path.join(process.cwd(), 'public', 'pixie')
const SIZE = 256
const CELL = 4
const STAGE_COUNT = 6

const variants = {
  spark: {
    label: 'spark',
    body: ['#f59e0b', '#facc15', '#fde047', '#fff7ad'],
    shade: '#78350f',
    outline: '#2f1805',
    accent: '#60a5fa',
    accent2: '#fb923c',
    eye: '#090b1a',
    glow: ['#facc15', '#60a5fa', '#d946ef'],
  },
  blip: {
    label: 'glitch',
    body: ['#6d28d9', '#8b5cf6', '#c084fc', '#f0abfc'],
    shade: '#31135f',
    outline: '#130723',
    accent: '#22d3ee',
    accent2: '#fb7185',
    eye: '#070817',
    glow: ['#7c3aed', '#22d3ee', '#fb7185'],
  },
  momo: {
    label: 'leaf',
    body: ['#3f9f46', '#66bb6a', '#a3e635', '#dcfce7'],
    shade: '#155e2d',
    outline: '#082f1b',
    accent: '#facc15',
    accent2: '#f97316',
    eye: '#07150c',
    glow: ['#22c55e', '#bef264', '#facc15'],
  },
  shade: {
    label: 'moonlight',
    body: ['#1e3a8a', '#3b82f6', '#93c5fd', '#e0f2fe'],
    shade: '#172554',
    outline: '#060b1d',
    accent: '#c4b5fd',
    accent2: '#f8fafc',
    eye: '#020617',
    glow: ['#60a5fa', '#c4b5fd', '#f8fafc'],
  },
  orbit: {
    label: 'hologram',
    body: ['#0891b2', '#22d3ee', '#a5f3fc', '#f0fdfa'],
    shade: '#155e75',
    outline: '#062330',
    accent: '#f0abfc',
    accent2: '#67e8f9',
    eye: '#07131a',
    glow: ['#22d3ee', '#a78bfa', '#f0abfc'],
  },
  heart: {
    label: 'premium-heart',
    body: ['#be123c', '#f43f5e', '#fb7185', '#ffe4e6'],
    shade: '#881337',
    outline: '#3b0716',
    accent: '#f9a8d4',
    accent2: '#fbbf24',
    eye: '#12040a',
    glow: ['#fb7185', '#f9a8d4', '#fbbf24'],
  },
  robot: {
    label: 'premium-robot',
    body: ['#64748b', '#94a3b8', '#cbd5e1', '#f8fafc'],
    shade: '#334155',
    outline: '#0f172a',
    accent: '#22d3ee',
    accent2: '#f8fafc',
    eye: '#020617',
    glow: ['#38bdf8', '#94a3b8', '#f8fafc'],
  },
}

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

function blendPixel(canvas, x, y, color) {
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

function clearPixel(canvas, x, y) {
  if (x < 0 || y < 0 || x >= canvas.w || y >= canvas.h) return
  const idx = (y * canvas.w + x) * 4
  canvas.data[idx] = 0
  canvas.data[idx + 1] = 0
  canvas.data[idx + 2] = 0
  canvas.data[idx + 3] = 0
}

function rect(canvas, x, y, w, h, color) {
  const c = Array.isArray(color) ? color : hex(color)
  x = snap(x); y = snap(y); w = snap(w); h = snap(h)
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) blendPixel(canvas, px, py, c)
  }
}

function ellipse(canvas, cx, cy, rx, ry, color) {
  const c = Array.isArray(color) ? color : hex(color)
  const minX = snap(cx - rx)
  const maxX = snap(cx + rx)
  const minY = snap(cy - ry)
  const maxY = snap(cy + ry)
  for (let y = minY; y <= maxY; y += CELL) {
    for (let x = minX; x <= maxX; x += CELL) {
      const dx = (x + CELL / 2 - cx) / rx
      const dy = (y + CELL / 2 - cy) / ry
      if (dx * dx + dy * dy <= 1) rect(canvas, x, y, CELL, CELL, c)
    }
  }
}

function heart(canvas, cx, cy, scale, color) {
  const c = Array.isArray(color) ? color : hex(color)
  ellipse(canvas, cx - 8 * scale, cy - 5 * scale, 10 * scale, 10 * scale, c)
  ellipse(canvas, cx + 8 * scale, cy - 5 * scale, 10 * scale, 10 * scale, c)
  polygon(canvas, [
    [cx - 18 * scale, cy - 3 * scale],
    [cx + 18 * scale, cy - 3 * scale],
    [cx, cy + 22 * scale],
  ], c)
}

function clearEllipse(canvas, cx, cy, rx, ry) {
  const minX = snap(cx - rx)
  const maxX = snap(cx + rx)
  const minY = snap(cy - ry)
  const maxY = snap(cy + ry)
  for (let y = minY; y <= maxY; y += CELL) {
    for (let x = minX; x <= maxX; x += CELL) {
      const dx = (x + CELL / 2 - cx) / rx
      const dy = (y + CELL / 2 - cy) / ry
      if (dx * dx + dy * dy <= 1) {
        for (let py = y; py < y + CELL; py++) {
          for (let px = x; px < x + CELL; px++) clearPixel(canvas, px, py)
        }
      }
    }
  }
}

function ring(canvas, cx, cy, rx, ry, thick, color) {
  const c = Array.isArray(color) ? color : hex(color)
  const minX = snap(cx - rx)
  const maxX = snap(cx + rx)
  const minY = snap(cy - ry)
  const maxY = snap(cy + ry)
  for (let y = minY; y <= maxY; y += CELL) {
    for (let x = minX; x <= maxX; x += CELL) {
      const dx = (x + CELL / 2 - cx) / rx
      const dy = (y + CELL / 2 - cy) / ry
      const outer = dx * dx + dy * dy
      const idx = (x + CELL / 2 - cx) / (rx - thick)
      const idy = (y + CELL / 2 - cy) / (ry - thick)
      const inner = idx * idx + idy * idy
      if (outer <= 1 && inner >= 1) rect(canvas, x, y, CELL, CELL, c)
    }
  }
}

function polygon(canvas, points, color) {
  const c = Array.isArray(color) ? color : hex(color)
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const minX = snap(Math.min(...xs))
  const maxX = snap(Math.max(...xs))
  const minY = snap(Math.min(...ys))
  const maxY = snap(Math.max(...ys))
  for (let y = minY; y <= maxY; y += CELL) {
    for (let x = minX; x <= maxX; x += CELL) {
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

function sparkle(canvas, x, y, color, s = 4) {
  rect(canvas, x - s, y, s * 2, CELL, color)
  rect(canvas, x, y - s, CELL, s * 2, color)
}

function diamond(canvas, x, y, r, color) {
  polygon(canvas, [[x, y - r], [x + r, y], [x, y + r], [x - r, y]], color)
}

function pixelBurst(canvas, cx, cy, radius, colors) {
  const points = [
    [-0.78, -0.58, 8], [-0.42, -0.88, 5], [0.02, -0.98, 7],
    [0.55, -0.72, 6], [0.86, -0.28, 8], [0.82, 0.32, 5],
    [0.38, 0.82, 7], [-0.18, 0.92, 5], [-0.72, 0.52, 8],
  ]
  points.forEach(([dx, dy, size], i) => {
    const color = colors[i % colors.length]
    diamond(canvas, cx + dx * radius, cy + dy * radius, size, hex(color, 220))
  })
}

function haloArc(canvas, cx, cy, rx, y, color, width = 5) {
  line(canvas, cx - rx, y, cx - rx * 0.42, y - 10, width, color)
  line(canvas, cx - rx * 0.42, y - 10, cx + rx * 0.42, y - 10, width, color)
  line(canvas, cx + rx * 0.42, y - 10, cx + rx, y, width, color)
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

function drawBase(canvas, v, stage) {
  const scale = [0, 0.82, 0.94, 1.08, 1.18, 1.28, 1.34][stage]
  const cx = 128
  const cy = stage === 1 ? 139 : stage === 2 ? 137 : stage >= 6 ? 128 : 132
  const rx = 46 * scale
  const ry = 52 * scale

  if (stage >= 3) {
    ring(canvas, cx, cy, 58 + stage * 11, 58 + stage * 10, 12, hex(v.glow[0], 54))
  }
  if (stage >= 4) ring(canvas, cx, cy, 78 + stage * 8, 74 + stage * 7, 8, hex(v.glow[1], 88))
  if (stage >= 5) ring(canvas, cx, cy, 94, 88, 8, hex(v.glow[2], 135))
  if (stage >= 6) {
    ring(canvas, cx, cy, 116, 108, 8, hex(v.glow[0], 120))
    ring(canvas, cx, cy, 104, 40, 6, hex(v.glow[1], 160))
    haloArc(canvas, cx, cy, 78, cy - 74, hex(v.glow[2], 220), 6)
    pixelBurst(canvas, cx, cy, 112, v.glow)
  }

  if (stage >= 2) {
    polygon(canvas, [[cx - rx - 12, cy + 3], [cx - rx - 38, cy + 16], [cx - rx - 8, cy + 25]], v.outline)
    polygon(canvas, [[cx + rx + 12, cy + 3], [cx + rx + 38, cy + 16], [cx + rx + 8, cy + 25]], v.outline)
    polygon(canvas, [[cx - rx - 8, cy + 8], [cx - rx - 30, cy + 17], [cx - rx - 8, cy + 22]], v.accent2)
    polygon(canvas, [[cx + rx + 8, cy + 8], [cx + rx + 30, cy + 17], [cx + rx + 8, cy + 22]], v.accent2)
  }

  ellipse(canvas, cx + 2, cy + 7, rx + 8, ry + 9, v.outline)
  ellipse(canvas, cx, cy, rx, ry, v.body[0])
  ellipse(canvas, cx - 8, cy - 10, rx * 0.76, ry * 0.78, v.body[1])
  ellipse(canvas, cx - 16, cy - 21, rx * 0.42, ry * 0.42, v.body[2])
  ellipse(canvas, cx - 24, cy - 30, rx * 0.2, ry * 0.18, hex(v.body[3], 210))
  if (stage >= 6) {
    ellipse(canvas, cx + 18, cy + 10, rx * 0.42, ry * 0.5, hex(v.shade, 120))
    ellipse(canvas, cx - 18, cy - 22, rx * 0.32, ry * 0.24, hex(v.body[3], 230))
    diamond(canvas, cx, cy - ry - 18, 13, v.accent)
    rect(canvas, cx - 4, cy - ry - 35, 8, 18, v.accent2)
  }
  rect(canvas, cx - 28, cy + ry - 13, 18, 22, v.accent2)
  rect(canvas, cx + 10, cy + ry - 13, 18, 22, v.accent2)

  drawEyes(canvas, cx, cy, stage, v)
  drawMouth(canvas, cx, cy, stage, v)

  if (stage >= 3) {
    sparkle(canvas, cx - 74, cy - 34, hex(v.glow[1], 210), 8)
    sparkle(canvas, cx + 78, cy + 12, hex(v.glow[2], 210), 6)
  }
  if (stage >= 5) {
    sparkle(canvas, cx - 90, cy + 48, hex(v.glow[2], 230), 8)
    sparkle(canvas, cx + 90, cy - 42, hex(v.glow[1], 230), 8)
  }
  if (stage >= 6) {
    sparkle(canvas, cx - 104, cy - 8, hex(v.body[3], 245), 10)
    sparkle(canvas, cx + 102, cy + 54, hex(v.accent, 245), 8)
    sparkle(canvas, cx + 12, cy - 108, hex(v.accent2, 245), 8)
  }
}

function drawEyes(canvas, cx, cy, stage, v) {
  const eyeY = cy - 4
  ellipse(canvas, cx - 20, eyeY, 11, 14, v.eye)
  ellipse(canvas, cx + 22, eyeY, 11, 14, v.eye)
  rect(canvas, cx - 24, eyeY - 7, 5, 5, '#ffffff')
  rect(canvas, cx + 18, eyeY - 7, 5, 5, '#ffffff')
  if (stage >= 4) {
    rect(canvas, cx - 16, eyeY + 5, 4, 4, v.accent)
    rect(canvas, cx + 26, eyeY + 5, 4, 4, v.accent)
  }
  if (stage >= 6) {
    rect(canvas, cx - 28, eyeY - 16, 20, 4, v.accent)
    rect(canvas, cx + 14, eyeY - 16, 20, 4, v.accent)
    rect(canvas, cx - 18, eyeY + 8, 8, 4, hex(v.accent2, 220))
    rect(canvas, cx + 26, eyeY + 8, 8, 4, hex(v.accent2, 220))
  }
}

function drawMouth(canvas, cx, cy, stage, v) {
  if (stage === 1) {
    rect(canvas, cx - 8, cy + 30, 16, 4, v.outline)
    return
  }
  rect(canvas, cx - 12, cy + 31, 24, 4, v.outline)
  if (stage >= 4) rect(canvas, cx - 8, cy + 35, 16, 4, v.outline)
  if (stage >= 6) rect(canvas, cx - 16, cy + 38, 32, 4, hex(v.body[3], 220))
}

function drawSpark(canvas, v, stage) {
  drawBase(canvas, v, stage)
  const cx = 128
  const cy = stage >= 6 ? 128 : 132
  polygon(canvas, [[cx - 10, cy - 62], [cx + 14, cy - 114], [cx + 8, cy - 70], [cx + 34, cy - 72], [cx - 2, cy - 28]], v.outline)
  polygon(canvas, [[cx - 4, cy - 64], [cx + 10, cy - 104], [cx + 6, cy - 72], [cx + 26, cy - 72], [cx, cy - 38]], v.body[3])
  if (stage >= 6) {
    ring(canvas, cx, cy, 110, 32, 5, hex(v.accent, 210))
    line(canvas, 46, 72, 210, 188, 5, hex(v.glow[2], 210))
    line(canvas, 54, 190, 202, 76, 5, hex(v.glow[1], 210))
    sparkle(canvas, 58, 84, hex(v.body[3], 255), 10)
    sparkle(canvas, 204, 82, hex(v.accent, 255), 10)
  }
}

function drawGlitch(canvas, v, stage) {
  drawBase(canvas, v, stage)
  const cx = 128
  const cy = stage === 1 ? 139 : stage === 2 ? 137 : stage >= 6 ? 128 : 132
  rect(canvas, cx - 40, cy - 46, 24, 8, hex(v.accent, 220))
  rect(canvas, cx + 20, cy - 30, 28, 8, hex(v.accent2, 210))
  rect(canvas, cx - 56, cy + 12, 20, 8, hex('#22d3ee', 210))
  rect(canvas, cx + 42, cy + 42, 26, 8, hex(v.body[3], 170))
  if (stage >= 3) {
    rect(canvas, 36, 98, 34, 8, hex(v.accent2, 180))
    rect(canvas, 184, 78, 42, 8, hex(v.accent, 180))
    rect(canvas, 172, 186, 28, 8, hex('#ffffff', 150))
  }
  if (stage >= 5) {
    line(canvas, 72, 70, 190, 68, 6, hex(v.accent, 220))
    line(canvas, 80, 82, 200, 84, 5, hex(v.accent2, 210))
  }
  if (stage >= 6) {
    rect(canvas, 28, 60, 56, 10, hex(v.accent, 210))
    rect(canvas, 174, 54, 44, 10, hex(v.accent2, 210))
    rect(canvas, 42, 202, 66, 10, hex(v.body[3], 170))
    line(canvas, 52, 48, 210, 200, 5, hex(v.glow[1], 190))
    line(canvas, 42, 202, 200, 48, 5, hex(v.glow[2], 170))
  }
}

function drawLeaf(canvas, v, stage) {
  drawBase(canvas, v, stage)
  const cx = 128
  const cy = stage === 1 ? 139 : stage === 2 ? 137 : stage >= 6 ? 128 : 132
  polygon(canvas, [[cx - 8, cy - 58], [cx + 22, cy - 96], [cx + 36, cy - 54], [cx + 10, cy - 44]], v.outline)
  polygon(canvas, [[cx - 4, cy - 60], [cx + 20, cy - 88], [cx + 30, cy - 56], [cx + 8, cy - 48]], v.body[2])
  line(canvas, cx + 4, cy - 54, cx + 22, cy - 78, 4, v.shade)
  if (stage >= 3) {
    polygon(canvas, [[66, 86], [38, 58], [80, 62]], hex(v.body[2], 210))
    polygon(canvas, [[190, 84], [220, 58], [178, 62]], hex(v.body[2], 210))
  }
  if (stage >= 5) {
    line(canvas, 54, 176, 88, 146, 6, hex(v.accent, 220))
    line(canvas, 202, 174, 168, 146, 6, hex(v.accent, 220))
  }
  if (stage >= 6) {
    polygon(canvas, [[52, 132], [22, 102], [66, 92], [82, 120]], hex(v.body[2], 230))
    polygon(canvas, [[204, 132], [234, 102], [190, 92], [174, 120]], hex(v.body[2], 230))
    polygon(canvas, [[88, 58], [54, 28], [104, 34]], hex(v.accent, 230))
    polygon(canvas, [[168, 58], [202, 28], [152, 34]], hex(v.accent, 230))
    line(canvas, 42, 198, 214, 88, 5, hex(v.accent, 180))
    line(canvas, 214, 198, 42, 88, 5, hex(v.body[3], 170))
  }
}

function drawMoonlight(canvas, v, stage) {
  drawBase(canvas, v, stage)
  const cx = 128
  const cy = stage === 1 ? 139 : stage === 2 ? 137 : stage >= 6 ? 128 : 132
  ellipse(canvas, cx + 22, cy - 76, 22, 30, v.outline)
  ellipse(canvas, cx + 18, cy - 78, 18, 26, v.accent2)
  clearEllipse(canvas, cx + 28, cy - 82, 17, 26)
  polygon(canvas, [[cx - 34, cy - 50], [cx - 14, cy - 82], [cx + 2, cy - 48]], v.outline)
  polygon(canvas, [[cx + 28, cy - 48], [cx + 50, cy - 78], [cx + 58, cy - 42]], v.outline)
  if (stage >= 3) {
    sparkle(canvas, 68, 68, v.accent2, 6)
    sparkle(canvas, 196, 92, v.accent2, 4)
    sparkle(canvas, 74, 190, v.accent, 5)
  }
  if (stage >= 5) {
    ring(canvas, cx, cy, 104, 42, 5, hex(v.accent2, 170))
  }
  if (stage >= 6) {
    ring(canvas, cx, cy, 116, 48, 6, hex(v.accent2, 210))
    line(canvas, 58, 58, 198, 198, 4, hex(v.accent, 170))
    line(canvas, 198, 58, 58, 198, 4, hex(v.accent2, 150))
    sparkle(canvas, 44, 112, v.accent2, 9)
    sparkle(canvas, 212, 136, v.accent2, 9)
    sparkle(canvas, 130, 36, v.accent, 8)
  }
}

function drawHologram(canvas, v, stage) {
  if (stage >= 3) {
    for (let i = 0; i < 5; i++) {
      ring(canvas, 128, 135, 52 + i * 18, 50 + i * 16, 4, hex(v.glow[i % v.glow.length], 32 + i * 14))
    }
  }
  drawBase(canvas, v, stage)
  const cx = 128
  const cy = stage === 1 ? 139 : stage === 2 ? 137 : stage >= 6 ? 128 : 132
  line(canvas, cx - 48, cy - 38, cx + 42, cy - 54, 5, hex(v.accent2, 220))
  line(canvas, cx - 44, cy + 46, cx + 48, cy + 30, 5, hex(v.accent, 200))
  rect(canvas, cx - 34, cy - 8, 68, 4, hex('#ffffff', 120))
  if (stage >= 4) {
    ring(canvas, cx, cy - 4, 94, 22, 6, hex(v.accent, 190))
    rect(canvas, 52, 58, 28, 8, hex(v.accent2, 180))
    rect(canvas, 184, 188, 24, 8, hex(v.accent, 180))
  }
  if (stage >= 6) {
    ring(canvas, cx, cy, 114, 54, 5, hex(v.accent2, 220))
    ring(canvas, cx, cy, 88, 96, 5, hex(v.accent, 150))
    rect(canvas, 34, 88, 48, 6, hex('#ffffff', 130))
    rect(canvas, 176, 162, 54, 6, hex(v.accent, 190))
    line(canvas, 42, 56, 214, 72, 4, hex(v.glow[1], 170))
    line(canvas, 44, 202, 210, 184, 4, hex(v.glow[2], 190))
  }
}

function drawHeartPremium(canvas, v, stage) {
  const cx = 128
  const cy = stage === 1 ? 136 : stage === 2 ? 134 : stage >= 6 ? 126 : 130
  const scale = [0, 2.25, 2.55, 2.9, 3.15, 3.38, 3.55][stage]

  if (stage >= 3) ring(canvas, cx, cy, 68 + stage * 9, 62 + stage * 8, 10, hex(v.glow[0], 62))
  if (stage >= 4) ring(canvas, cx, cy, 92, 84, 7, hex(v.glow[1], 96))
  if (stage >= 5) {
    ring(canvas, cx, cy, 104, 94, 7, hex(v.glow[2], 128))
    haloArc(canvas, cx, cy, 76, cy - 70, hex(v.accent, 210), 5)
  }
  if (stage >= 6) {
    ring(canvas, cx, cy, 116, 108, 8, hex(v.glow[0], 135))
    ring(canvas, cx, cy, 106, 38, 5, hex(v.glow[2], 180))
    pixelBurst(canvas, cx, cy, 112, v.glow)
  }

  heart(canvas, cx + 2, cy + 8, scale + 0.34, v.outline)
  heart(canvas, cx, cy, scale, v.body[0])
  heart(canvas, cx - 6, cy - 7, scale * 0.78, v.body[1])
  heart(canvas, cx - 18, cy - 17, scale * 0.36, v.body[3])
  ellipse(canvas, cx + 20, cy + 18, scale * 5.6, scale * 7.4, hex(v.shade, 112))

  if (stage >= 2) {
    polygon(canvas, [[cx - 70, cy + 10], [cx - 98, cy - 2], [cx - 72, cy + 30]], v.outline)
    polygon(canvas, [[cx + 70, cy + 10], [cx + 98, cy - 2], [cx + 72, cy + 30]], v.outline)
    polygon(canvas, [[cx - 72, cy + 12], [cx - 90, cy + 2], [cx - 72, cy + 24]], v.accent)
    polygon(canvas, [[cx + 72, cy + 12], [cx + 90, cy + 2], [cx + 72, cy + 24]], v.accent)
  }

  ellipse(canvas, cx - 20, cy - 4, 10, 14, v.eye)
  ellipse(canvas, cx + 21, cy - 4, 10, 14, v.eye)
  rect(canvas, cx - 24, cy - 10, 5, 5, '#ffffff')
  rect(canvas, cx + 17, cy - 10, 5, 5, '#ffffff')
  rect(canvas, cx - 13, cy + 30, 26, 4, v.outline)
  if (stage >= 4) rect(canvas, cx - 9, cy + 34, 18, 4, v.outline)

  diamond(canvas, cx, cy - 70, 10, v.accent2)
  if (stage >= 5) {
    sparkle(canvas, cx - 82, cy - 42, hex(v.accent, 240), 8)
    sparkle(canvas, cx + 88, cy + 50, hex(v.accent2, 240), 8)
    line(canvas, 54, 184, 206, 82, 5, hex(v.accent, 170))
  }
  if (stage >= 6) {
    heart(canvas, cx - 84, cy + 50, 0.62, hex(v.accent, 230))
    heart(canvas, cx + 86, cy - 48, 0.62, hex(v.accent2, 230))
    line(canvas, 48, 72, 210, 190, 5, hex(v.glow[2], 185))
    line(canvas, 54, 198, 202, 68, 5, hex(v.glow[1], 185))
  }
}

function drawRobotPremium(canvas, v, stage) {
  const cx = 128
  const cy = stage === 1 ? 137 : stage === 2 ? 135 : stage >= 6 ? 126 : 130
  const scale = [0, 0.78, 0.9, 1.04, 1.16, 1.26, 1.34][stage]
  const w = snap(76 * scale)
  const h = snap(70 * scale)

  if (stage >= 3) ring(canvas, cx, cy, 66 + stage * 10, 62 + stage * 9, 9, hex(v.glow[0], 56))
  if (stage >= 4) ring(canvas, cx, cy, 90, 78, 7, hex(v.glow[1], 92))
  if (stage >= 5) ring(canvas, cx, cy, 106, 94, 7, hex(v.glow[2], 128))
  if (stage >= 6) {
    ring(canvas, cx, cy, 116, 108, 8, hex(v.glow[0], 132))
    ring(canvas, cx, cy, 104, 42, 5, hex(v.glow[2], 170))
    pixelBurst(canvas, cx, cy, 112, v.glow)
  }

  const left = cx - w / 2
  const top = cy - h / 2
  rect(canvas, left - 8, top - 8, w + 16, h + 20, v.outline)
  rect(canvas, left, top, w, h, v.body[0])
  rect(canvas, left + 8, top + 8, w - 16, h - 16, v.body[1])
  rect(canvas, left + 12, top + 12, w * 0.42, h * 0.28, v.body[3])
  rect(canvas, left + w * 0.58, top + h * 0.54, w * 0.28, h * 0.26, hex(v.shade, 170))
  rect(canvas, left + 8, top - 20, w - 16, 14, v.outline)
  rect(canvas, left + 14, top - 17, w - 28, 8, v.body[2])
  line(canvas, cx, top - 20, cx, top - 44, 5, v.outline)
  diamond(canvas, cx, top - 50, 10, v.accent)

  if (stage >= 2) {
    rect(canvas, left - 26, top + 24, 22, 26, v.outline)
    rect(canvas, left + w + 4, top + 24, 22, 26, v.outline)
    rect(canvas, left - 20, top + 28, 14, 18, v.body[2])
    rect(canvas, left + w + 8, top + 28, 14, 18, v.body[2])
  }

  rect(canvas, left + 18, top + 26, 18, 14, v.eye)
  rect(canvas, left + w - 36, top + 26, 18, 14, v.eye)
  rect(canvas, left + 21, top + 29, 12, 8, v.accent)
  rect(canvas, left + w - 33, top + 29, 12, 8, v.accent)
  rect(canvas, cx - 18, top + h - 20, 36, 5, v.outline)
  rect(canvas, cx - 10, top + h - 14, 20, 4, hex(v.accent, 190))

  if (stage >= 4) {
    line(canvas, 54, 80, 202, 76, 4, hex(v.accent, 170))
    line(canvas, 64, 184, 196, 188, 4, hex(v.body[3], 150))
  }
  if (stage >= 5) {
    ring(canvas, cx, cy, 104, 34, 5, hex(v.accent, 190))
    rect(canvas, 48, 108, 30, 7, hex(v.body[3], 170))
    rect(canvas, 180, 152, 34, 7, hex(v.accent, 180))
  }
  if (stage >= 6) {
    ring(canvas, cx, cy, 90, 96, 5, hex(v.accent, 155))
    line(canvas, 48, 58, 208, 196, 5, hex(v.glow[0], 180))
    line(canvas, 48, 198, 208, 58, 5, hex(v.glow[2], 180))
    sparkle(canvas, 54, 92, hex(v.body[3], 245), 8)
    sparkle(canvas, 204, 112, hex(v.accent, 245), 8)
  }
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
      blendPixel(dst, ox + x, oy + y, [
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

  const chunks = [
    chunk('IHDR', ihdr(canvas.w, canvas.h)),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ...chunks,
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
  const firstStage = id === 'spark' ? 6 : 1
  for (let stage = firstStage; stage <= STAGE_COUNT; stage++) {
    const sprite = generateSprite(id, stage)
    sprites.push(sprite)
    writePng(sprite, path.join(dir, `pixie-${id}-stage-${stage}.png`))
    stagePngs++
  }
  if (id !== 'spark') {
    writePng(previewSheet(id, sprites), path.join(dir, `pixie-${id}-preview-sheet.png`))
    previewSheets++
  }
}

console.log(`Generated ${stagePngs} stage PNGs and ${previewSheets} preview sheets in ${OUT_ROOT}`)
