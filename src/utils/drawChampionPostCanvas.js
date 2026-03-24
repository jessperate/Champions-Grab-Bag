import { wrapText } from './drawCanvas.js'

// ── Color modes
const CHAMP_MODES = {
  'paper-light': {
    bg:        '#f8fffb',
    text:      '#000d05',
    lastName:  '#002910',
    quote:     '#009b32',
    roleColor: '#002910',
    moreColor: '#000d05',
  },
  'paper-dark': {
    bg:        '#002910',
    text:      '#f8fffb',
    lastName:  '#dfeae3',
    quote:     '#00ff64',
    roleColor: '#dfeae3',
    moreColor: '#f8fffb',
  },
  'mint': {
    bg:        '#dfeae3',
    text:      '#000d05',
    lastName:  '#002910',
    quote:     '#008c44',
    roleColor: '#002910',
    moreColor: '#000d05',
  },
}

// ── Halftone dot grid
function drawHalftoneDots(ctx, x, y, w, h, dotRadius, spacing, color, alpha) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  const cols = Math.ceil(w / spacing) + 2
  const rows = Math.ceil(h / spacing) + 2
  for (let row = -1; row <= rows; row++) {
    for (let col = -1; col <= cols; col++) {
      const px = x + col * spacing
      const py = y + row * spacing
      if (px + dotRadius < x || px - dotRadius > x + w) continue
      if (py + dotRadius < y || py - dotRadius > y + h) continue
      ctx.moveTo(px + dotRadius, py)
      ctx.arc(px, py, dotRadius, 0, Math.PI * 2)
    }
  }
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Draw individual leaf shape (pointed almond)
function drawLeaf(ctx, cx, cy, width, height, angle, color) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  // Almond/leaf shape using bezier curves
  ctx.moveTo(0, -height / 2)
  ctx.bezierCurveTo(width / 2, -height / 4, width / 2, height / 4, 0, height / 2)
  ctx.bezierCurveTo(-width / 2, height / 4, -width / 2, -height / 4, 0, -height / 2)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

// ── Draw scattered laurel leaves on the photo side
function drawLaurelLeaves(ctx, sideX, sideW, canvasH, scale, color) {
  // Hardcoded relative positions (normalized to sideW and canvasH)
  // Each entry: [xRatio, yRatio, widthPx, heightPx, angleDeg]
  const leaves = [
    // Top-left cluster
    [0.06, 0.05, 70, 28, -45],
    [0.12, 0.08, 60, 24, -30],
    [0.04, 0.12, 55, 22, -60],
    [0.18, 0.04, 65, 26, -20],
    [0.09, 0.18, 58, 23, -50],
    // Top-right cluster
    [0.82, 0.06, 72, 29, 40],
    [0.88, 0.12, 63, 25, 55],
    [0.76, 0.10, 67, 27, 25],
    [0.92, 0.04, 58, 23, 70],
    [0.85, 0.18, 61, 24, 45],
    // Bottom-left area
    [0.05, 0.78, 68, 27, -35],
    [0.12, 0.85, 62, 25, -55],
    [0.08, 0.92, 70, 28, -20],
    [0.18, 0.88, 58, 23, -70],
    // Bottom-right scattered
    [0.80, 0.82, 65, 26, 50],
    [0.88, 0.90, 60, 24, 35],
    [0.75, 0.92, 72, 29, 65],
    [0.93, 0.78, 58, 23, 30],
  ]

  leaves.forEach(([xR, yR, w, h, angleDeg]) => {
    const cx = sideX + xR * sideW
    const cy = yR * canvasH
    const lw = w * scale
    const lh = h * scale
    const angle = (angleDeg * Math.PI) / 180
    drawLeaf(ctx, cx, cy, lw, lh, angle, color)
  })
}

// ── Photo side: draw bg + halftone + leaves + photo
function drawPhotoSide(ctx, x, y, w, h, profileImage, M, scale) {
  // Background
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  // Halftone dot grid
  const dotRadius = 3 * scale
  const spacing   = 28 * scale
  drawHalftoneDots(ctx, x, y, w, h, dotRadius, spacing, '#c5d9cc', 0.5)

  // Laurel leaves decoration
  drawLaurelLeaves(ctx, x, w, h, scale, '#008c44')

  // Photo — rendered on dark bg with hard-light blend
  const PHOTO_BG = '#002910'
  ctx.fillStyle = PHOTO_BG
  ctx.fillRect(x, y, w, h)

  if (profileImage) {
    const overscan = 4
    const ps = Math.max(
      (w + overscan * 2) / (profileImage.naturalWidth  || 1),
      (h + overscan * 2) / (profileImage.naturalHeight || 1),
    )
    const iw = profileImage.naturalWidth  * ps
    const ih = profileImage.naturalHeight * ps

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.globalCompositeOperation = 'hard-light'
    ctx.drawImage(profileImage, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }
}

// ── Text side
function drawTextSide(ctx, x, y, w, h, settings, M, scale, fontsReady) {
  const {
    firstName     = 'Lucy',
    lastName      = 'Hoyle',
    roleCompany   = 'Senior Content Engineer, Carta',
    championQuote = '"Content engineering changed the trajectory of my career."',
    champMoreLink = '',
  } = settings

  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'

  // Background
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  const pad = Math.round(72 * scale)
  const innerW = w - pad * 2

  // Clip to text side
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  // 1. First name — Serrif VF 400, ~140px
  const firstSz = Math.round(140 * scale)
  const firstLH = firstSz * 1.0
  ctx.font         = `400 ${firstSz}px ${serif}`
  ctx.letterSpacing = `${(-firstSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = M.text
  ctx.fillText(firstName, x + pad, y + pad)

  // 2. Last name — Saans 400, ~132px
  const lastSz = Math.round(132 * scale)
  const lastLH = lastSz * 1.0
  ctx.font         = `400 ${lastSz}px ${sans}`
  ctx.letterSpacing = `${(-lastSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = M.lastName
  ctx.fillText(lastName, x + pad, y + pad + firstLH + 4)

  // 3. Role/Company — Saans 400, ~36px, +2% tracking
  const roleSz = Math.round(36 * scale)
  const roleY  = y + pad + firstLH + 4 + lastLH + Math.round(24 * scale)
  ctx.font         = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(roleSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = M.roleColor
  ctx.fillText(roleCompany, x + pad, roleY)
  ctx.letterSpacing = '0px'

  // 4. Gap ~80px
  const labelY = roleY + roleSz * 1.2 + Math.round(80 * scale)

  // 5. "I'm a Champion because..." label — Saans 400, ~28px
  const labelSz = Math.round(28 * scale)
  ctx.font      = `400 ${labelSz}px ${sans}`
  ctx.fillStyle = M.text
  ctx.fillText("I'm a Champion because...", x + pad, labelY)

  // 6. Gap 16px
  const quoteY = labelY + labelSz * 1.3 + Math.round(16 * scale)

  // 7. Quote text — Serrif VF 400, ~52px, -1% tracking, line-height 1.15
  const quoteSzBase = Math.round(52 * scale)
  const quoteMaxH   = h - (quoteY - y) - pad - Math.round(48 * scale)

  let qFont = quoteSzBase
  let qLines
  ctx.letterSpacing = `${(-quoteSzBase * 0.01).toFixed(2)}px`
  for (let f = quoteSzBase; f >= Math.round(24 * scale); f -= 1) {
    ctx.font = `400 ${f}px ${serif}`
    ctx.letterSpacing = `${(-f * 0.01).toFixed(2)}px`
    qLines = wrapText(ctx, championQuote, innerW)
    if (qLines.length * f * 1.15 <= quoteMaxH) { qFont = f; break }
  }

  ctx.font         = `400 ${qFont}px ${serif}`
  ctx.letterSpacing = `${(-qFont * 0.01).toFixed(2)}px`
  qLines = wrapText(ctx, championQuote, innerW)
  const qLH = qFont * 1.15
  ctx.fillStyle = M.quote
  qLines.forEach((line, i) => {
    ctx.fillText(line, x + pad, quoteY + i * qLH)
  })
  ctx.letterSpacing = '0px'

  // 8. "More from [firstName] ↑" — bottom-aligned
  if (champMoreLink !== undefined) {
    const moreSz = Math.round(24 * scale)
    const moreY  = y + h - pad - moreSz
    const moreText = champMoreLink
      ? `More from ${firstName} — ${champMoreLink} ↑`
      : `More from ${firstName} ↑`
    ctx.font         = `500 ${moreSz}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle    = M.moreColor
    ctx.fillText(moreText, x + pad, moreY)
  }

  ctx.restore()
}

// ── Main export
export function drawChampionPostCanvas(canvas, settings, fontsReady, profileImage) {
  const {
    champColorMode = 'paper-light',
    champFlip      = false,
    dims           = { w: 1920, h: 1080 },
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1
  const s   = cw / 1920  // scale vs reference

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const M = CHAMP_MODES[champColorMode] ?? CHAMP_MODES['paper-light']

  // Overall background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  const halfW = Math.round(cw / 2)

  const photoX   = champFlip ? halfW : 0
  const textX    = champFlip ? 0     : halfW

  // Draw photo side
  drawPhotoSide(ctx, photoX, 0, halfW, ch, profileImage, M, s)

  // Draw text side
  drawTextSide(ctx, textX, 0, halfW, ch, settings, M, s, fontsReady)
}
