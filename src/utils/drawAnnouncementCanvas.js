// ── Leaf helpers (inlined so no external dep needed)
function _drawLeaf(ctx, cx, cy, leafW, leafH, angle) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, -leafH / 2)
  ctx.bezierCurveTo( leafW / 2, -leafH / 4,  leafW / 2, leafH / 4, 0, leafH / 2)
  ctx.bezierCurveTo(-leafW / 2,  leafH / 4, -leafW / 2, -leafH / 4, 0, -leafH / 2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function _drawLeafArc(ctx, cx, cy, radius, startAngle, endAngle, count, side, leafW, leafH) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const angle = startAngle + t * (endAngle - startAngle)
    const lx = cx + Math.cos(angle) * radius
    const ly = cy + Math.sin(angle) * radius
    const leafAngle = angle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2) + Math.PI / 2
    _drawLeaf(ctx, lx, ly, leafW, leafH, leafAngle)
  }
}

// Draw a laurel wreath (no bg, no text) centered at (cx, cy), sized by `size`
function drawWreath(ctx, cx, cy, size, color) {
  ctx.fillStyle = color
  const leafW     = size * 0.10
  const leafH     = size * 0.20
  const radius    = size * 0.35
  const leafCount = 9

  // Upper arc (left branch): upper-left → upper-right
  _drawLeafArc(ctx, cx, cy, radius,
    (210 * Math.PI) / 180, (330 * Math.PI) / 180,
    leafCount, 'left', leafW, leafH)

  // Lower arc (right branch): lower-left → lower-right
  _drawLeafArc(ctx, cx, cy, radius,
    (330 * Math.PI) / 180 + Math.PI, (210 * Math.PI) / 180 + Math.PI,
    leafCount, 'right', leafW, leafH)

  // Bottom connecting leaves
  const bottomY = cy + size * 0.34
  _drawLeaf(ctx, cx - size * 0.04, bottomY, size * 0.08, size * 0.16, -0.2)
  _drawLeaf(ctx, cx + size * 0.04, bottomY, size * 0.08, size * 0.16,  0.2)
}

// ── Color modes
const CHAMP_MODES = {
  'paper-light': {
    bg:          '#f8fffb',
    text:        '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    champText:   '#002910',
    airopsText:  '#009b32',
    wreathColor: '#002910',
    dotColor:    '#009b32',
    logoBorder:  '#002910',
  },
  'paper-dark': {
    bg:          '#002910',
    text:        '#f8fffb',
    lastName:    '#dfeae3',
    roleColor:   '#dfeae3',
    champText:   '#dfeae3',
    airopsText:  '#00ff64',
    wreathColor: '#dfeae3',
    dotColor:    '#00c850',
    logoBorder:  '#dfeae3',
  },
  'mint': {
    bg:          '#dfeae3',
    text:        '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    champText:   '#002910',
    airopsText:  '#008c44',
    wreathColor: '#002910',
    dotColor:    '#008c44',
    logoBorder:  '#002910',
  },
}

// ── Dot halftone background
function drawDotPattern(ctx, x, y, w, h, dotColor, scale) {
  const spacing = Math.round(16 * scale)
  const radius  = Math.max(1, Math.round(2.5 * scale))
  ctx.fillStyle = dotColor
  for (let dy = spacing / 2; dy < h; dy += spacing) {
    for (let dx = spacing / 2; dx < w; dx += spacing) {
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

// ── Header: "airOps" + "Champion[wreath]"
function drawHeader(ctx, cw, headerH, M, scale, fontsReady) {
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'
  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'

  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, headerH)

  const marginX = Math.round(18 * scale)

  // 1. "airOps" — centered, Saans 500, bright green
  const airSz = Math.round(72 * scale)
  ctx.font          = `500 ${airSz}px ${sans}`
  ctx.letterSpacing = `${(-airSz * 0.01).toFixed(2)}px`
  ctx.fillStyle     = M.airopsText
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'center'
  ctx.fillText('airOps', cw / 2, Math.round(44 * scale))
  ctx.textAlign    = 'left'
  ctx.letterSpacing = '0px'

  // 2. "Champion" — Saans 700, auto-sized to fill canvas width
  // We draw "Champi" + wreath (replacing 'o') + "n"
  const baseline = headerH - Math.round(30 * scale)
  const available = cw - marginX * 2

  // Find font size so full "Champion" width ≈ available
  let fontSize = Math.round(500 * scale)
  ctx.font = `700 ${fontSize}px ${sans}`
  let totalW = ctx.measureText('Champion').width
  if (totalW > available) {
    fontSize = Math.round(fontSize * (available / totalW))
    ctx.font = `700 ${fontSize}px ${sans}`
  }

  ctx.letterSpacing = `${(-fontSize * 0.01).toFixed(2)}px`

  const prefixW  = ctx.measureText('Champi').width
  const oW       = ctx.measureText('o').width
  // Cap height approx 73% of font size
  const capH     = fontSize * 0.73

  // Draw "Champi"
  ctx.fillStyle    = M.champText
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('Champi', marginX, baseline)

  // Draw wreath in 'o' slot — size based on cap height, centered vertically on cap
  const wreathSize = capH * 1.05  // slightly larger than cap height for visual impact
  const wreathCX   = marginX + prefixW + oW * 0.5
  const wreathCY   = baseline - capH * 0.5

  ctx.letterSpacing = '0px'
  drawWreath(ctx, wreathCX, wreathCY, wreathSize, M.wreathColor)
  ctx.letterSpacing = `${(-fontSize * 0.01).toFixed(2)}px`

  // Draw "n"
  ctx.fillStyle    = M.champText
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('n', marginX + prefixW + oW, baseline)
  ctx.letterSpacing = '0px'
}

// ── Bottom: photo card + text
function drawBottomContent(ctx, cw, ch, headerH, settings, M, scale, fontsReady, profileImage, photoBgImage, companyLogoImage) {
  const {
    annFirstName = 'Lucy',
    annLastName  = 'Hoyle',
    annRole      = 'Senior Content Engineer',
  } = settings

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'

  const contentH = ch - headerH

  // ── Photo card ──────────────────────────────────────────
  const photoSize = Math.round(375 * scale)
  const photoX    = Math.round(350 * scale)
  const photoY    = Math.round(headerH + (contentH - photoSize) / 2)

  // Card background
  ctx.fillStyle = M.bg
  ctx.fillRect(photoX, photoY, photoSize, photoSize)

  // Dot pattern at 20% opacity
  ctx.save()
  ctx.globalAlpha = 0.2
  drawDotPattern(ctx, photoX, photoY, photoSize, photoSize, M.dotColor, scale)
  ctx.restore()

  // Stippled headshot — 95% width, top-aligned with 5% padding
  if (profileImage) {
    const imgScale = (photoSize * 0.95) / (profileImage.naturalWidth || 1)
    const iw = profileImage.naturalWidth  * imgScale
    const ih = profileImage.naturalHeight * imgScale
    const px = photoX + (photoSize - iw) / 2
    const py = photoY + photoSize * 0.05
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoSize, photoSize)
    ctx.clip()
    ctx.drawImage(profileImage, px, py, iw, ih)
    ctx.restore()
  }

  // Laurel wreath PNG in foreground
  if (photoBgImage) {
    const bgAspect = photoBgImage.naturalWidth / photoBgImage.naturalHeight
    const areaAspect = 1  // square card
    let bw, bh
    if (bgAspect > areaAspect) { bh = photoSize; bw = photoSize * bgAspect }
    else                       { bw = photoSize; bh = photoSize / bgAspect }
    ctx.save()
    ctx.beginPath()
    ctx.rect(photoX, photoY, photoSize, photoSize)
    ctx.clip()
    ctx.drawImage(photoBgImage, photoX + (photoSize - bw) / 2, photoY + (photoSize - bh) / 2, bw, bh)
    ctx.restore()
  }

  // ── Text panel ───────────────────────────────────────────
  const textX = photoX + photoSize + Math.round(50 * scale)
  const textY = photoY
  const textW = cw - textX - Math.round(40 * scale)

  ctx.save()
  ctx.beginPath()
  ctx.rect(textX, 0, textW, ch)
  ctx.clip()

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  // First name — Serrif VF 400, ~130px
  const firstSz = Math.round(130 * scale)
  ctx.font          = `400 ${firstSz}px ${serif}`
  ctx.letterSpacing = `${(-firstSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.text
  ctx.fillText(annFirstName, textX, textY)

  // Last name — Saans 400, ~115px
  const lastSz = Math.round(115 * scale)
  const lastY  = textY + firstSz * 1.0 + Math.round(4 * scale)
  ctx.font          = `400 ${lastSz}px ${sans}`
  ctx.letterSpacing = `${(-lastSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.lastName
  ctx.fillText(annLastName, textX, lastY)

  // Role — Saans 400, ~32px, +2% tracking
  const roleSz = Math.round(32 * scale)
  const roleY  = lastY + lastSz * 1.0 + Math.round(20 * scale)
  ctx.font          = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(roleSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.roleColor
  ctx.fillText(annRole, textX, roleY)
  ctx.letterSpacing = '0px'

  // Company logo in bordered box
  if (companyLogoImage) {
    const logoGap   = Math.round(40 * scale)
    const boxH      = Math.round(65 * scale)
    const boxPad    = Math.round(16 * scale)
    const maxLogoH  = boxH - boxPad * 2
    const maxLogoW  = Math.round(240 * scale)
    const logoAspect = (companyLogoImage.naturalWidth || 1) / (companyLogoImage.naturalHeight || 1)
    let lw = Math.min(maxLogoW, maxLogoH * logoAspect)
    let lh = lw / logoAspect
    if (lh > maxLogoH) { lh = maxLogoH; lw = lh * logoAspect }

    const boxW  = lw + boxPad * 2
    const boxY  = roleY + roleSz * 1.2 + logoGap
    const logoX = textX + boxPad
    const logoY = boxY + (boxH - lh) / 2

    // Bordered box
    ctx.strokeStyle = M.logoBorder
    ctx.lineWidth   = Math.round(2 * scale)
    ctx.strokeRect(textX, boxY, boxW, boxH)

    ctx.drawImage(companyLogoImage, logoX, logoY, lw, lh)
  }

  ctx.restore()
}

// ── Main export
export function drawAnnouncementCanvas(canvas, settings, fontsReady, profileImage, photoBgImage, companyLogoImage) {
  const {
    annColorMode = 'paper-light',
    dims         = { w: 1920, h: 1080 },
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1
  const s   = cw / 1920

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const M = CHAMP_MODES[annColorMode] ?? CHAMP_MODES['paper-light']

  // Full background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // Header height: ~43% of canvas height
  const headerH = Math.round(ch * 0.43)

  drawHeader(ctx, cw, headerH, M, s, fontsReady)
  drawBottomContent(ctx, cw, ch, headerH, settings, M, s, fontsReady, profileImage, photoBgImage, companyLogoImage)
}
