import { wrapText } from './drawCanvas.js'

// ── Color modes (matches Champion Post)
const CHAMP_MODES = {
  'paper-light': {
    bg:        '#f8fffb',
    text:      '#000d05',
    lastName:  '#002910',
    quote:     '#009b32',
    roleColor: '#002910',
    dotColor:  '#009b32',
    headingColor: '#002910',
  },
  'paper-dark': {
    bg:        '#002910',
    text:      '#f8fffb',
    lastName:  '#dfeae3',
    quote:     '#00ff64',
    roleColor: '#dfeae3',
    dotColor:  '#00c850',
    headingColor: '#dfeae3',
  },
  'mint': {
    bg:        '#dfeae3',
    text:      '#000d05',
    lastName:  '#002910',
    quote:     '#008c44',
    roleColor: '#002910',
    dotColor:  '#008c44',
    headingColor: '#002910',
  },
}

// ── Dot halftone pattern
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

// ── Photo panel (bottom-left)
function drawPhotoPanel(ctx, x, y, w, h, profileImage, photoBgImage, M, scale) {
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  // Dot pattern at low opacity
  ctx.save()
  ctx.globalAlpha = 0.2
  drawDotPattern(ctx, x, y, w, h, M.dotColor, scale)
  ctx.restore()

  // Stippled headshot
  if (profileImage) {
    const imgScale = (w * 0.95) / (profileImage.naturalWidth || 1)
    const iw = profileImage.naturalWidth  * imgScale
    const ih = profileImage.naturalHeight * imgScale
    const px = x + (w - iw) / 2
    const py = y + h * 0.05

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(profileImage, px, py, iw, ih)
    ctx.restore()
  }

  // Laurel wreath in foreground
  if (photoBgImage) {
    const bgAspect   = photoBgImage.naturalWidth / photoBgImage.naturalHeight
    const areaAspect = w / h
    let bw, bh
    if (bgAspect > areaAspect) { bh = h; bw = h * bgAspect }
    else                       { bw = w; bh = w / bgAspect }
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(photoBgImage, x + (w - bw) / 2, y + (h - bh) / 2, bw, bh)
    ctx.restore()
  }
}

// ── Text panel (bottom-right)
function drawTextPanel(ctx, x, y, w, h, settings, M, scale, fontsReady, companyLogoImage) {
  const {
    annFirstName   = 'Lucy',
    annLastName    = 'Hoyle',
    annRoleCompany = 'Senior Content Engineer, Carta',
    annText        = "\u201CI\u2019m now an AirOps Champion.\u201D",
  } = settings

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'

  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  const pad    = Math.round(72 * scale)
  const innerW = w - pad * 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  // 1. First name — Serrif VF 400, ~140px
  const firstSz = Math.round(140 * scale)
  const firstLH = firstSz * 1.0
  ctx.font          = `400 ${firstSz}px ${serif}`
  ctx.letterSpacing = `${(-firstSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.text
  ctx.fillText(annFirstName, x + pad, y + pad)

  // 2. Last name — Saans 400, ~132px
  const lastSz = Math.round(132 * scale)
  const lastLH = lastSz * 1.0
  ctx.font          = `400 ${lastSz}px ${sans}`
  ctx.letterSpacing = `${(-lastSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.lastName
  ctx.fillText(annLastName, x + pad, y + pad + firstLH + 4)

  // 3. Role/Company — Saans 400, ~36px, +2% tracking
  const roleSz = Math.round(36 * scale)
  const roleY  = y + pad + firstLH + 4 + lastLH + Math.round(24 * scale)
  ctx.font          = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(roleSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.roleColor
  ctx.fillText(annRoleCompany, x + pad, roleY)
  ctx.letterSpacing = '0px'

  // 4. Gap
  const labelY = roleY + roleSz * 1.2 + Math.round(80 * scale)

  // 5. Label — Saans 400, ~28px
  const labelSz = Math.round(28 * scale)
  ctx.font      = `400 ${labelSz}px ${sans}`
  ctx.fillStyle = M.text
  ctx.fillText('Champion because...', x + pad, labelY)

  // 6. Announcement / quote text — Serrif VF 400, ~52px
  const logoReserve = companyLogoImage ? Math.round(80 * scale) : 0
  const quoteSzBase = Math.round(52 * scale)
  const quoteY      = labelY + labelSz * 1.3 + Math.round(16 * scale)
  const quoteMaxH   = h - (quoteY - y) - pad - logoReserve - Math.round(24 * scale)

  let qFont = quoteSzBase
  let qLines
  for (let f = quoteSzBase; f >= Math.round(24 * scale); f -= 1) {
    ctx.font          = `400 ${f}px ${serif}`
    ctx.letterSpacing = `${(-f * 0.01).toFixed(2)}px`
    qLines = wrapText(ctx, annText, innerW)
    if (qLines.length * f * 1.15 <= quoteMaxH) { qFont = f; break }
  }

  ctx.font          = `400 ${qFont}px ${serif}`
  ctx.letterSpacing = `${(-qFont * 0.01).toFixed(2)}px`
  qLines = wrapText(ctx, annText, innerW)
  const qLH = qFont * 1.15
  ctx.fillStyle = M.quote
  qLines.forEach((line, i) => {
    ctx.fillText(line, x + pad, quoteY + i * qLH)
  })
  ctx.letterSpacing = '0px'

  // 7. Company logo — bottom-left aligned
  if (companyLogoImage) {
    const maxLogoH   = Math.round(56 * scale)
    const maxLogoW   = Math.round(240 * scale)
    const logoAspect = (companyLogoImage.naturalWidth || 1) / (companyLogoImage.naturalHeight || 1)
    let lw = Math.min(maxLogoW, maxLogoH * logoAspect)
    let lh = lw / logoAspect
    if (lh > maxLogoH) { lh = maxLogoH; lw = lh * logoAspect }
    ctx.drawImage(companyLogoImage, x + pad, y + h - pad - lh, lw, lh)
  }

  ctx.restore()
}

// ── Top header band (full width)
function drawHeader(ctx, cw, headerH, M, scale, fontsReady) {
  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'

  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, headerH)

  const pad = Math.round(80 * scale)

  // "AirOps" eyebrow — Saans 400, ~28px, wide tracking
  const eyebrowSz = Math.round(28 * scale)
  ctx.font          = `400 ${eyebrowSz}px ${sans}`
  ctx.letterSpacing = `${(eyebrowSz * 0.12).toFixed(2)}px`
  ctx.fillStyle     = M.quote
  ctx.textBaseline  = 'top'
  ctx.textAlign     = 'left'
  ctx.fillText('AIROPS', pad, pad)
  ctx.letterSpacing = '0px'

  // "Champions" — Serrif VF 400, fills most of the header height
  const champSz = Math.round(Math.min(220 * scale, (headerH - pad * 2.5) * 0.85))
  ctx.font          = `400 ${champSz}px ${serif}`
  ctx.letterSpacing = `${(-champSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.headingColor
  ctx.textBaseline  = 'alphabetic'
  ctx.fillText('Champions', pad, headerH - pad)
  ctx.letterSpacing = '0px'

  ctx.textBaseline = 'top'
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

  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  const halfW   = Math.round(cw / 2)
  const headerH = Math.round(ch * 0.5)

  // Top header — full width
  drawHeader(ctx, cw, headerH, M, s, fontsReady)

  // Bottom-left — photo panel
  drawPhotoPanel(ctx, 0, headerH, halfW, ch - headerH, profileImage, photoBgImage, M, s)

  // Bottom-right — text panel
  drawTextPanel(ctx, halfW, headerH, cw - halfW, ch - headerH, settings, M, s, fontsReady, companyLogoImage)
}
