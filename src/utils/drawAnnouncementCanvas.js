// ── Dot halftone
function drawDotPattern(ctx, x, y, w, h, color, s) {
  const sp = Math.round(16 * s)
  const r  = Math.max(1, Math.round(2.5 * s))
  ctx.fillStyle = color
  for (let dy = sp / 2; dy < h; dy += sp)
    for (let dx = sp / 2; dx < w; dx += sp) {
      ctx.beginPath()
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
      ctx.fill()
    }
}

// ── Color modes (exported so Assets.jsx can read wreathColor per mode)
export const MODES = {
  'paper-light': {
    bg:          '#f8fffb',
    border:      '#008c44',
    photoBorder: '#005e1f',
    champText:   '#002910',
    airopsText:  '#009b32',
    wreathColor: '#002910',
    dotColor:    '#009b32',
    firstName:   '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    roleBg:      '#eef9f3',
    logoBorder:  '#002910',
  },
  'paper-dark': {
    bg:          '#002910',
    border:      '#00ff64',
    photoBorder: '#00c850',
    champText:   '#dfeae3',
    airopsText:  '#00ff64',
    wreathColor: '#dfeae3',
    dotColor:    '#00c850',
    firstName:   '#f8fffb',
    lastName:    '#dfeae3',
    roleColor:   '#dfeae3',
    roleBg:      '#003d18',
    logoBorder:  '#dfeae3',
  },
  'mint': {
    bg:          '#dfeae3',
    border:      '#008c44',
    photoBorder: '#005e1f',
    champText:   '#002910',
    airopsText:  '#008c44',
    wreathColor: '#002910',
    dotColor:    '#008c44',
    firstName:   '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    roleBg:      '#c8dbd1',
    logoBorder:  '#002910',
  },
}

// ─────────────────────────────────────────────────────────────
// All measurements below are in the 1920×1080 reference space.
// Scale by s = cw/1920 to support other canvas sizes.
// ─────────────────────────────────────────────────────────────

// ── Canvas decorative border (from Figma: x:29 y:29 w:1858 h:1020)
function drawBorder(ctx, cw, ch, color, s) {
  const inset = Math.round(29 * s)
  ctx.strokeStyle = color
  ctx.lineWidth   = Math.round(2 * s)
  ctx.strokeRect(inset, inset, cw - inset * 2, ch - inset * 2)
}

// ── Header: "airOps" logo centered + "Champion[wreath]" auto-sized
// Figma: airOps box at x:784 y:91 w:351 h:112  (center x=959.5≈960)
// Figma: header boundary at y:557
function drawHeader(ctx, cw, ch, M, s, fontsReady, wreathImage, airOpsLogoImage) {
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'
  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'

  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, Math.round(560 * s))

  // ── "airOps" logo — centered in Figma box (x:784 y:91 w:351 h:112)
  const airBoxX = Math.round(784 * s)
  const airBoxY = Math.round(91  * s)
  const airBoxW = Math.round(351 * s)
  const airBoxH = Math.round(112 * s)

  if (airOpsLogoImage) {
    // Scale logo to fit within the box while preserving aspect ratio
    const logoNW = airOpsLogoImage.naturalWidth  || 352
    const logoNH = airOpsLogoImage.naturalHeight || 113
    const logoA  = logoNW / logoNH
    let lw = airBoxW
    let lh = lw / logoA
    if (lh > airBoxH) { lh = airBoxH; lw = lh * logoA }
    const lx = airBoxX + (airBoxW - lw) / 2
    const ly = airBoxY + (airBoxH - lh) / 2
    ctx.drawImage(airOpsLogoImage, lx, ly, lw, lh)
  } else {
    // Fallback: text
    const airSz = Math.round(72 * s)
    ctx.font          = `500 ${airSz}px ${sans}`
    ctx.letterSpacing = `${(-airSz * 0.005).toFixed(2)}px`
    ctx.fillStyle     = M.airopsText
    ctx.textBaseline  = 'middle'
    ctx.textAlign     = 'center'
    ctx.fillText('airOps', cw / 2, airBoxY + airBoxH / 2)
    ctx.letterSpacing = '0px'
  }

  // ── "Champion[wreath]" — auto-size to fill from x:29 to near right edge
  // baseline at y:540 (just above photo at y:557)
  const marginX  = Math.round(29 * s)
  const baseline = Math.round(540 * s)
  const maxWidth = cw - marginX * 2

  let fontSize = Math.round(520 * s)
  ctx.font = `700 ${fontSize}px ${sans}`
  // scale down until "Champion" (with 'o' slot) fits
  let totalW = ctx.measureText('Champion').width
  if (totalW > maxWidth) {
    fontSize = Math.round(fontSize * maxWidth / totalW)
  }

  ctx.font          = `700 ${fontSize}px ${sans}`
  ctx.letterSpacing = `${(-fontSize * 0.01).toFixed(2)}px`

  const prefixW = ctx.measureText('Champi').width
  const oW      = ctx.measureText('o').width
  const capH    = fontSize * 0.73  // approximate cap height

  // Draw "Champi"
  ctx.fillStyle    = M.champText
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign    = 'left'
  ctx.fillText('Champi', marginX, baseline)

  // Draw wreath in the 'o' slot using the Figma SVG asset
  const wreathSize = capH * 1.02
  const wreathCX   = marginX + prefixW + oW * 0.5
  const wreathCY   = baseline - capH * 0.5

  ctx.letterSpacing = '0px'
  if (wreathImage) {
    // Draw the SVG wreath, tinted to the current mode color via offscreen canvas
    const sz = Math.ceil(wreathSize)
    const off = document.createElement('canvas')
    off.width = sz; off.height = sz
    const offCtx = off.getContext('2d')
    offCtx.drawImage(wreathImage, 0, 0, sz, sz)
    // Recolor: keep the wreath shape but fill with wreathColor
    // source-in: new fill shows only where existing (wreath) pixels are
    offCtx.globalCompositeOperation = 'source-in'
    offCtx.fillStyle = M.wreathColor
    offCtx.fillRect(0, 0, sz, sz)
    ctx.save()
    ctx.drawImage(off, wreathCX - wreathSize / 2, wreathCY - wreathSize / 2, wreathSize, wreathSize)
    ctx.restore()
  }
  ctx.letterSpacing = `${(-fontSize * 0.01).toFixed(2)}px`

  // Draw "n"
  ctx.fillStyle    = M.champText
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('n', marginX + prefixW + oW, baseline)
  ctx.letterSpacing = '0px'
}

// ── Photo card
// Figma: x:479 y:560 w:481 h:488  border stroke:#005e1f
function drawPhotoCard(ctx, M, s, profileImage, photoBgImage) {
  const px = Math.round(479 * s)
  const py = Math.round(560 * s)
  const pw = Math.round(481 * s)
  const ph = Math.round(488 * s)

  // Card background
  ctx.fillStyle = M.bg
  ctx.fillRect(px, py, pw, ph)

  // Dot pattern at 20% opacity
  ctx.save()
  ctx.globalAlpha = 0.2
  drawDotPattern(ctx, px, py, pw, ph, M.dotColor, s)
  ctx.restore()

  // Stippled headshot
  if (profileImage) {
    const imgScale = (pw * 0.95) / (profileImage.naturalWidth || 1)
    const iw = profileImage.naturalWidth  * imgScale
    const ih = profileImage.naturalHeight * imgScale
    ctx.save()
    ctx.beginPath()
    ctx.rect(px, py, pw, ph)
    ctx.clip()
    ctx.drawImage(profileImage, px + (pw - iw) / 2, py + ph * 0.05, iw, ih)
    ctx.restore()
  }

  // Laurel wreath PNG foreground
  if (photoBgImage) {
    const ba = photoBgImage.naturalWidth / photoBgImage.naturalHeight
    const ca = pw / ph
    let bw, bh
    if (ba > ca) { bh = ph; bw = ph * ba }
    else         { bw = pw; bh = pw / ba }
    ctx.save()
    ctx.beginPath()
    ctx.rect(px, py, pw, ph)
    ctx.clip()
    ctx.drawImage(photoBgImage, px + (pw - bw) / 2, py + (ph - bh) / 2, bw, bh)
    ctx.restore()
  }

  // Card border (Figma: stroke #005e1f, 0.82px → use 1px at scale 1)
  ctx.strokeStyle = M.photoBorder
  ctx.lineWidth   = Math.max(1, Math.round(1 * s))
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1)
}

// ── Text panel
// Figma: text left x:1013, text group top y:632
//        role text at y:808 (from Figma layout), logo x:1013 y:932 w:197 h:86
function drawTextPanel(ctx, cw, M, s, fontsReady, settings, companyLogoImage) {
  const {
    annFirstName = 'Lucy',
    annLastName  = 'Hoyle',
    annRole      = 'Senior Content Engineer',
  } = settings

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'

  const tx = Math.round(1013 * s)

  ctx.save()
  ctx.beginPath()
  ctx.rect(tx, 0, cw - tx - Math.round(29 * s), cw)  // clip to text column
  ctx.clip()

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  // ── First name — Serrif VF 400, 81px, top at y:632 (Figma)
  const firstSz = Math.round(81 * s)
  ctx.font          = `400 ${firstSz}px ${serif}`
  ctx.letterSpacing = `${(-firstSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.firstName
  ctx.fillText(annFirstName, tx, Math.round(632 * s))

  // ── Last name — Saans 400, 81px, tight below first name (leading 1.1)
  const lastSz = Math.round(81 * s)
  const lastY  = Math.round(632 * s) + Math.round(firstSz * 1.1)
  ctx.font          = `400 ${lastSz}px ${sans}`
  ctx.letterSpacing = `${(-lastSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.lastName
  ctx.fillText(annLastName, tx, lastY)

  ctx.letterSpacing = '0px'

  // ── Role — Saans 400, inside tinted pill background
  // Figma: y = firstNameY + firstSz*1.1 + lastSz*1.0 + gap(9)
  const roleBgX = tx
  const roleBgY = Math.round(632 * s) + Math.round(firstSz * 1.1) + lastSz + Math.round(9 * s)
  const roleBgW = Math.round(307 * s)
  const roleBgH = Math.round(35  * s)
  const roleSz  = Math.round(27  * s)

  ctx.fillStyle = M.roleBg
  ctx.fillRect(roleBgX, roleBgY, roleBgW, roleBgH)

  ctx.font          = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(roleSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.roleColor
  ctx.textBaseline  = 'middle'
  ctx.fillText(annRole, roleBgX + Math.round(10 * s), roleBgY + roleBgH / 2)
  ctx.letterSpacing = '0px'
  ctx.textBaseline  = 'top'

  // ── Company logo
  // Figma: clip x:1013 y:929 w:197 h:86
  if (companyLogoImage) {
    const logoClipX = Math.round(1013 * s)
    const logoClipY = Math.round(932  * s)
    const logoClipW = Math.round(197  * s)
    const logoClipH = Math.round(86   * s)

    const logoPad = Math.round(14 * s)
    const maxLW   = logoClipW - logoPad * 2
    const maxLH   = logoClipH - logoPad * 2
    const logoA   = (companyLogoImage.naturalWidth || 1) / (companyLogoImage.naturalHeight || 1)
    let lw = Math.min(maxLW, maxLH * logoA)
    let lh = lw / logoA
    if (lh > maxLH) { lh = maxLH; lw = lh * logoA }

    // Bordered box
    ctx.strokeStyle = M.logoBorder
    ctx.lineWidth   = Math.round(2 * s)
    ctx.strokeRect(logoClipX, logoClipY, logoClipW, logoClipH)

    // Logo centered in box
    ctx.drawImage(
      companyLogoImage,
      logoClipX + (logoClipW - lw) / 2,
      logoClipY + (logoClipH - lh) / 2,
      lw, lh
    )
  }

  ctx.restore()
}

// ── Main export
// wreathImage: pre-loaded Image of ChampionWordmarkWreath.svg (for the 'o' slot)
// photoBgImage: pre-loaded Image of ChampionPhotoBackground.png (for the photo card overlay)
export function drawAnnouncementCanvas(canvas, settings, fontsReady, profileImage, photoBgImage, companyLogoImage, wreathImage, airOpsLogoImage) {
  const {
    annColorMode = 'paper-light',
    dims         = { w: 1920, h: 1080 },
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1
  const s   = cw / 1920  // scale relative to 1920 reference

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const M = MODES[annColorMode] ?? MODES['paper-light']

  // Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // Decorative border (Figma: x:30 y:30 w:1856 h:1018 stroke:#008C44)
  drawBorder(ctx, cw, ch, M.border, s)

  // Header (uses wreathImage for the 'o' slot, airOpsLogoImage for the logo)
  drawHeader(ctx, cw, ch, M, s, fontsReady, wreathImage, airOpsLogoImage)

  // Photo card (uses photoBgImage for the laurel overlay)
  drawPhotoCard(ctx, M, s, profileImage, photoBgImage)

  // Text panel
  drawTextPanel(ctx, cw, M, s, fontsReady, settings, companyLogoImage)
}
