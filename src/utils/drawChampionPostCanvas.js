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

// ── Photo side: background image + centered headshot on top
function drawPhotoSide(ctx, x, y, w, h, profileImage, photoBgImage, M) {
  // Fallback solid fill
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  // Draw the laurel-wreath background image scaled to cover the photo side
  if (photoBgImage) {
    const bgAspect    = photoBgImage.naturalWidth / photoBgImage.naturalHeight
    const sideAspect  = w / h
    let bw, bh
    if (bgAspect > sideAspect) {
      bh = h; bw = h * bgAspect
    } else {
      bw = w; bh = w / bgAspect
    }
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(photoBgImage, x + (w - bw) / 2, y + (h - bh) / 2, bw, bh)
    ctx.restore()
  }

  // Draw uploaded headshot: scale to fill frame width, top-aligned so face shows prominently
  if (profileImage) {
    const scale = (w * 0.95) / (profileImage.naturalWidth || 1)
    const iw = profileImage.naturalWidth  * scale
    const ih = profileImage.naturalHeight * scale
    const px = x + (w - iw) / 2
    const py = y + h * 0.05

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
    ctx.drawImage(profileImage, px, py, iw, ih)
    ctx.restore()
  }
}

// ── Text side
function drawTextSide(ctx, x, y, w, h, settings, M, scale, fontsReady, companyLogoImage) {
  const {
    firstName     = 'Lucy',
    lastName      = 'Hoyle',
    roleCompany   = 'Senior Content Engineer, Carta',
    championQuote = '"Content engineering changed the trajectory of my career."',
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
  // Reserve space at bottom for logo if present
  const logoReserve = companyLogoImage ? Math.round(80 * scale) : 0
  const quoteSzBase = Math.round(52 * scale)
  const quoteMaxH   = h - (quoteY - y) - pad - logoReserve - Math.round(24 * scale)

  let qFont = quoteSzBase
  let qLines
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

  // 8. Company logo — bottom-left aligned
  if (companyLogoImage) {
    const maxLogoH = Math.round(56 * scale)
    const maxLogoW = Math.round(240 * scale)
    const logoAspect = (companyLogoImage.naturalWidth || 1) / (companyLogoImage.naturalHeight || 1)
    let lw = Math.min(maxLogoW, maxLogoH * logoAspect)
    let lh = lw / logoAspect
    if (lh > maxLogoH) { lh = maxLogoH; lw = lh * logoAspect }
    const logoY = y + h - pad - lh
    ctx.drawImage(companyLogoImage, x + pad, logoY, lw, lh)
  }

  ctx.restore()
}

// ── Main export
export function drawChampionPostCanvas(canvas, settings, fontsReady, profileImage, photoBgImage, companyLogoImage) {
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
  drawPhotoSide(ctx, photoX, 0, halfW, ch, profileImage, photoBgImage, M)

  // Draw text side
  drawTextSide(ctx, textX, 0, halfW, ch, settings, M, s, fontsReady, companyLogoImage)
}
