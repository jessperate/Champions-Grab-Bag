import { MODES, buildLockup, wrapText, smartQuotes } from './drawCanvas.js'

// ── Draw photo region: darkest brand color per colorway (M.ctaText) + blend
// Stipple images (black-on-white) use multiply so white bg disappears into panel bg
function drawPhotoSection(ctx, profileImage, x, y, w, h, M, isStipple) {
  ctx.fillStyle = M.ctaText
  ctx.fillRect(x, y, w, h)

  if (!profileImage) {
    // Upload placeholder
    ctx.save()
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = '#ffffff'
    ctx.globalAlpha = 0.3
    ctx.lineWidth   = 2
    const inset = Math.round(w * 0.1)
    ctx.strokeRect(x + inset, y + Math.round(h * 0.1), w - inset * 2, Math.round(h * 0.8))
    ctx.setLineDash([])
    ctx.font         = `400 ${Math.round(w * 0.06)}px sans-serif`
    ctx.fillStyle    = '#ffffff'
    ctx.globalAlpha  = 0.45
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('↑  Upload photo', x + w / 2, y + h / 2)
    ctx.restore()
    return
  }

  const overscan = 4
  const s  = Math.max((w + overscan * 2) / (profileImage.naturalWidth  || 1),
                      (h + overscan * 2) / (profileImage.naturalHeight || 1))
  const iw = profileImage.naturalWidth  * s
  const ih = profileImage.naturalHeight * s

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.globalCompositeOperation = isStipple ? 'multiply' : 'hard-light'
  ctx.drawImage(profileImage, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

// ── Lockup panel — sits below the headshot, shows champion lockup centered
function drawLockupPanel(ctx, lockupImage, lockupColor, dpr, x, y, w, h, M) {
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  if (!lockupImage) return

  const lkH   = Math.round(h * 0.42)
  const lkW   = Math.round(1179 * lkH / 291)
  const lkBmp = buildLockup(lockupImage, lockupColor, Math.round(lkW * dpr), Math.round(lkH * dpr))
  const lkX   = x + Math.round((w - lkW) / 2)
  const lkY   = y + Math.round((h - lkH) / 2)
  ctx.drawImage(lkBmp, lkX, lkY, lkW, lkH)
}

// ── Content panel: name + role pill + company logo (top), quote (bottom)
function drawContent(ctx, { x, y, w, h, pad, firstName, lastName, roleCompany, quote,
                            nameSz, quoteSzBase, quoteLH, M, serif, sans, mono,
                            companyLogoImage, isDark, dpr }) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  const innerW       = w - pad * 2
  const nameTracking = `${(-0.04 * nameSz).toFixed(2)}px`
  const nameLH       = nameSz * 0.84
  const PILL_SZ      = 32
  const PILL_PAD_X   = 16
  const PILL_PAD_Y   = 2
  const pillH        = Math.round(PILL_SZ * 1.3 + PILL_PAD_Y * 2)

  const logoH   = companyLogoImage ? Math.round(nameSz * 0.36) : 0
  const logoGap = companyLogoImage ? Math.round(nameSz * 0.28) : 0

  // ── Customer block (top)
  let cy = y + pad

  // First name — Serrif VF 400
  ctx.fillStyle     = M.text
  ctx.font          = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = nameTracking
  ctx.textBaseline  = 'top'
  ctx.fillText(firstName, x + pad, cy)
  cy += nameLH + 4

  // Last name — Saans 400
  ctx.font = `400 ${nameSz}px ${sans}`
  ctx.fillText(lastName, x + pad, cy)
  cy += nameLH + 24

  // Role pill
  const pillText = roleCompany.toUpperCase()
  ctx.font          = `500 ${PILL_SZ}px ${mono}`
  ctx.letterSpacing = '1.92px'
  const pillTW = ctx.measureText(pillText).width
  const pillW  = pillTW + PILL_PAD_X * 2

  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.pill
  ctx.fillRect(x + pad, cy, pillW, pillH)

  ctx.font          = `500 ${PILL_SZ}px ${mono}`
  ctx.letterSpacing = '1.92px'
  ctx.fillStyle     = M.pillText
  ctx.textBaseline  = 'top'
  ctx.fillText(pillText, x + pad + PILL_PAD_X, cy + PILL_PAD_Y)
  ctx.letterSpacing = '0px'
  cy += pillH + 20

  // ── Company logo below pill
  if (companyLogoImage) {
    const logoW = Math.round(companyLogoImage.naturalWidth * (logoH / companyLogoImage.naturalHeight))
    if (isDark) {
      const logoBmp = buildLockup(companyLogoImage, M.text, Math.round(logoW * dpr), Math.round(logoH * dpr))
      ctx.drawImage(logoBmp, x + pad, cy, logoW, logoH)
    } else {
      ctx.drawImage(companyLogoImage, x + pad, cy, logoW, logoH)
    }
  }

  // ── Quote (bottom — justify-between)
  const customerH = nameLH + 4 + nameLH + 24 + pillH + 20 + logoH + logoGap
  const availH    = h - pad * 2 - customerH - 32

  let qFont = quoteSzBase
  let qLines
  for (let f = quoteSzBase; f >= 28; f--) {
    ctx.font          = `400 ${f}px ${serif}`
    ctx.letterSpacing = '0px'
    qLines = wrapText(ctx, quote, innerW)
    const heightFits = qLines.length * f * quoteLH <= availH
    const widthFits  = qLines.every(l => ctx.measureText(l).width <= innerW)
    if (heightFits && widthFits) { qFont = f; break }
  }

  ctx.font          = `400 ${qFont}px ${serif}`
  ctx.letterSpacing = '0px'
  qLines = wrapText(ctx, quote, innerW)
  const qLineH = qFont * quoteLH
  const quoteH = qLines.length * qLineH
  const quoteY = y + h - pad - quoteH

  ctx.fillStyle    = M.ctaText
  ctx.textBaseline = 'top'
  qLines.forEach((line, i) => ctx.fillText(line, x + pad, quoteY + i * qLineH))

  ctx.restore()
}

// ── Guideline helper
function strokeLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

// ── Main renderer
export function drawRichQuoteCanvas(canvas, settings, fontsReady, profileImage, companyLogoImage, lockupImage) {
  const {
    richFirstName    = 'Alex',
    richLastName     = 'Rodmell',
    richRoleCompany  = 'Growth, Venn',
    richFlip         = false,
    richIsStipple    = false,
    colorMode, dims,
  } = settings
  const richQuoteText = smartQuotes(settings.richQuoteText ?? '"Enter a quote here."')

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const isLand     = cw > ch
  const isStory    = ch > cw * 1.5
  const isPortrait = !isLand && !isStory && ch > cw

  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  const M           = settings.brandModes?.quote?.[colorMode] ?? MODES[colorMode] ?? MODES.green
  const isDark      = colorMode === 'custom-dark'
  const lockupColor = isDark ? '#ffffff' : M.text

  // ── Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  ctx.strokeStyle = M.lineColor
  ctx.lineWidth   = 2

  const contentArgs = {
    firstName: richFirstName, lastName: richLastName,
    roleCompany: richRoleCompany, quote: richQuoteText,
    M, serif, sans, mono,
    companyLogoImage, isDark, dpr,
  }

  if (isLand) {
    // ── Landscape: content | photo + lockup panel  (flip swaps left/right)
    const splitX      = Math.round(cw / 2)
    const lockupPanelH = 203
    const photoH      = ch - lockupPanelH
    const mediaX      = richFlip ? 0      : splitX
    const contentX    = richFlip ? splitX : 0

    drawPhotoSection(ctx, profileImage, mediaX, 0,      splitX, photoH,      M, richIsStipple)
    drawLockupPanel(ctx, lockupImage, lockupColor, dpr, mediaX, photoH, splitX, lockupPanelH, M)
    drawContent(ctx, { x: contentX, y: 0, w: splitX, h: ch, pad: 53,
      ...contentArgs, nameSz: 120, quoteSzBase: 64, quoteLH: 1.2 })

    strokeLine(ctx, splitX, 0,      splitX, ch)
    strokeLine(ctx, mediaX === 0 ? 0 : splitX, photoH, mediaX === 0 ? splitX : cw, photoH)

  } else if (isStory) {
    // ── Story 9:16: content | headshot + lockup row  (flip swaps top/bottom)
    const topPad       = 240
    const contentH     = 618
    const headshotRowH = 540
    const splitX       = Math.round(cw / 2)
    const rowY         = richFlip ? topPad                : topPad + contentH
    const contentY     = richFlip ? topPad + headshotRowH : topPad

    drawPhotoSection(ctx, profileImage, 0,      rowY, splitX, headshotRowH, M, richIsStipple)
    drawLockupPanel(ctx, lockupImage, lockupColor, dpr, splitX, rowY, splitX, headshotRowH, M)
    drawContent(ctx, { x: 0, y: contentY, w: cw, h: contentH, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    strokeLine(ctx, 0,      rowY,                cw,     rowY)
    strokeLine(ctx, splitX, rowY,                splitX, rowY + headshotRowH)
    strokeLine(ctx, 0,      rowY + headshotRowH, cw,     rowY + headshotRowH)

  } else if (isPortrait) {
    // ── Portrait 4:5: content | headshot + lockup row  (flip swaps top/bottom)
    const headshotRowH = 540
    const contentH     = ch - headshotRowH
    const splitX       = Math.round(cw / 2)
    const rowY         = richFlip ? 0           : contentH
    const contentY     = richFlip ? headshotRowH : 0

    drawPhotoSection(ctx, profileImage, 0,      rowY, splitX, headshotRowH, M, richIsStipple)
    drawLockupPanel(ctx, lockupImage, lockupColor, dpr, splitX, rowY, splitX, headshotRowH, M)
    drawContent(ctx, { x: 0, y: contentY, w: cw, h: contentH, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    const divY = richFlip ? rowY + headshotRowH : rowY
    strokeLine(ctx, 0,      divY, cw,     divY)
    strokeLine(ctx, splitX, rowY, splitX, rowY + headshotRowH)

  } else {
    // ── Square: content | photo + lockup panel  (flip swaps left/right)
    const splitX       = Math.round(cw / 2)
    const lockupPanelH = 158
    const photoH       = ch - lockupPanelH
    const mediaX       = richFlip ? 0      : splitX
    const contentX     = richFlip ? splitX : 0

    drawPhotoSection(ctx, profileImage, mediaX, 0,      splitX, photoH,      M, richIsStipple)
    drawLockupPanel(ctx, lockupImage, lockupColor, dpr, mediaX, photoH, splitX, lockupPanelH, M)
    drawContent(ctx, { x: contentX, y: 0, w: splitX, h: ch, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    strokeLine(ctx, splitX,                          0,      splitX,                          ch)
    strokeLine(ctx, mediaX === 0 ? 0 : splitX, photoH, mediaX === 0 ? splitX : cw, photoH)
  }
}
