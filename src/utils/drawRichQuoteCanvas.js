import { MODES, buildLogo, wrapText, smartQuotes } from './drawCanvas.js'

// ── Draw photo region: darkest brand color per colorway (M.ctaText) + hard-light blend
function drawPhotoSection(ctx, profileImage, x, y, w, h, M) {
  ctx.fillStyle = M.ctaText
  ctx.fillRect(x, y, w, h)

  if (!profileImage) return

  // Aspect-fill with a small overscan so JPEG edge artifacts land outside the
  // clip region and are never visible at the section boundaries.
  const overscan = 4
  const s  = Math.max((w + overscan * 2) / (profileImage.naturalWidth  || 1),
                      (h + overscan * 2) / (profileImage.naturalHeight || 1))
  const iw = profileImage.naturalWidth  * s
  const ih = profileImage.naturalHeight * s

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.globalCompositeOperation = 'hard-light'
  ctx.drawImage(profileImage, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih)
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

// ── Draw logo panel: paper bg + uploaded logo recolored to M.text
function drawLogoSection(ctx, companyLogoImg, x, y, w, h, M) {
  ctx.fillStyle = M.bg
  ctx.fillRect(x, y, w, h)

  if (!companyLogoImg) return

  const nw = companyLogoImg.naturalWidth  || 300
  const nh = companyLogoImg.naturalHeight || 150
  const padX = Math.round(w * 0.14)
  const padY = Math.round(h * 0.20)
  const s     = Math.min((w - padX * 2) / nw, (h - padY * 2) / nh, 1)
  const logoW = Math.round(nw * s)
  const logoH = Math.round(nh * s)
  const logoX = x + Math.round((w - logoW) / 2)
  const logoY = y + Math.round((h - logoH) / 2)

  // Recolor: draw image then source-atop fill → logo appears in M.text
  const off = document.createElement('canvas')
  off.width  = logoW
  off.height = logoH
  const oc   = off.getContext('2d')
  oc.drawImage(companyLogoImg, 0, 0, logoW, logoH)
  oc.globalCompositeOperation = 'source-atop'
  oc.fillStyle = M.text
  oc.fillRect(0, 0, logoW, logoH)

  ctx.drawImage(off, logoX, logoY)
}

// ── Draw the content (name + role pill + quote) within a given rect
// justify-between: customer block at top, quote at bottom
function drawContent(ctx, { x, y, w, h, pad, firstName, lastName, roleCompany, quote, nameSz, quoteSzBase, quoteLH, M, serif, sans, mono }) {
  // Hard-clip to this section so nothing can overflow into adjacent photo/logo regions
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  const innerW      = w - pad * 2
  const nameTracking = `${(-0.04 * nameSz).toFixed(2)}px`
  const nameLH      = nameSz * 0.84   // Figma: leading-[0.84]
  const PILL_SZ     = 32              // matches Quote Block: Saans Mono 500 32px
  const PILL_PAD_X  = 16
  const PILL_PAD_Y  = 2
  const pillH       = Math.round(PILL_SZ * 1.3 + PILL_PAD_Y * 2)

  // ── Customer block (top)
  let cy = y + pad

  // First name — Serrif VF 400
  ctx.fillStyle    = M.text
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = nameTracking
  ctx.textBaseline = 'top'
  ctx.fillText(firstName, x + pad, cy)
  cy += nameLH + 4

  // Last name — Saans 400
  ctx.font = `400 ${nameSz}px ${sans}`
  ctx.fillText(lastName, x + pad, cy)
  cy += nameLH + 24

  // Role pill — Saans Mono 500 32px uppercase, matches Quote Block exactly
  const pillText = roleCompany.toUpperCase()
  ctx.font         = `500 ${PILL_SZ}px ${mono}`
  ctx.letterSpacing = '1.92px'
  const pillTW = ctx.measureText(pillText).width
  const pillW  = pillTW + PILL_PAD_X * 2

  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.pill
  ctx.fillRect(x + pad, cy, pillW, pillH)

  ctx.font         = `500 ${PILL_SZ}px ${mono}`
  ctx.letterSpacing = '1.92px'
  ctx.fillStyle    = M.pillText
  ctx.textBaseline = 'top'
  ctx.fillText(pillText, x + pad + PILL_PAD_X, cy + PILL_PAD_Y)
  ctx.letterSpacing = '0px'

  // ── Quote (bottom — justify-between)
  // Auto-shrink to fit available height above the quote region
  const customerH = nameLH + 4 + nameLH + 24 + pillH
  const availH    = h - pad * 2 - customerH - 32  // 32 = minimum gap between blocks

  let qFont = quoteSzBase
  let qLines
  for (let f = quoteSzBase; f >= 28; f--) {
    ctx.font = `400 ${f}px ${serif}`
    ctx.letterSpacing = '0px'
    qLines = wrapText(ctx, quote, innerW)
    const heightFits = qLines.length * f * quoteLH <= availH
    const widthFits  = qLines.every(l => ctx.measureText(l).width <= innerW)
    if (heightFits && widthFits) { qFont = f; break }
  }

  ctx.font         = `400 ${qFont}px ${serif}`
  ctx.letterSpacing = '0px'
  qLines = wrapText(ctx, quote, innerW)
  const qLineH    = qFont * quoteLH
  const quoteH    = qLines.length * qLineH
  const quoteY    = y + h - pad - quoteH

  ctx.fillStyle    = M.ctaText   // Figma: color-4 (dark accent) for quote text
  ctx.textBaseline = 'top'
  qLines.forEach((line, i) => ctx.fillText(line, x + pad, quoteY + i * qLineH))

  ctx.restore()  // release clip
}

// ── Guideline helper: drawn last so lines sit on top of all section fills
function strokeLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

// ── Main renderer
export function drawRichQuoteCanvas(canvas, settings, fontsReady, profileImage, companyLogoImage) {
  const {
    richFirstName    = 'Alex',
    richLastName     = 'Rodmell',
    richRoleCompany  = 'Growth, Venn',
    richFlip         = false,
    colorMode, dims,
  } = settings
  const richQuoteText = smartQuotes(settings.richQuoteText ?? '"Enter a quote here."')

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const isLand    = cw > ch
  const isStory   = ch > cw * 1.5
  const isPortrait = !isLand && !isStory && ch > cw   // 1080×1350

  const serif = fontsReady ? "'Serrif VF', Georgia, serif"         : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"                 : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace"  : 'monospace'

  const M  = MODES[colorMode] ?? MODES['green']

  // ── Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  ctx.strokeStyle = M.lineColor
  ctx.lineWidth   = 2

  const contentArgs = {
    firstName: richFirstName, lastName: richLastName,
    roleCompany: richRoleCompany, quote: richQuoteText,
    M, serif, sans, mono,
  }

  if (isLand) {
    // ── Landscape: content | photo+logo  (flip swaps left/right)
    const splitX     = Math.round(cw / 2)
    const logoPanelH = 203
    const photoH     = ch - logoPanelH
    const mediaX     = richFlip ? 0      : splitX
    const contentX   = richFlip ? splitX : 0

    drawPhotoSection(ctx, profileImage,    mediaX, 0,      splitX, photoH,     M)
    drawLogoSection(ctx, companyLogoImage, mediaX, photoH, splitX, logoPanelH, M)
    drawContent(ctx, { x: contentX, y: 0, w: splitX, h: ch, pad: 53,
      ...contentArgs, nameSz: 120, quoteSzBase: 64, quoteLH: 1.2 })

    strokeLine(ctx, splitX,           0,      splitX,           ch)
    strokeLine(ctx, mediaX === 0 ? 0 : splitX, photoH, mediaX === 0 ? splitX : cw, photoH)

  } else if (isStory) {
    // ── Story 9:16: content | headshot row  (flip swaps top/bottom)
    const topPad       = 240
    const contentH     = 618
    const headshotRowH = 540
    const splitX       = Math.round(cw / 2)
    const rowY         = richFlip ? topPad                 : topPad + contentH
    const contentY     = richFlip ? topPad + headshotRowH  : topPad

    drawPhotoSection(ctx, profileImage,    0,      rowY, splitX, headshotRowH, M)
    drawLogoSection(ctx, companyLogoImage, splitX, rowY, splitX, headshotRowH, M)
    drawContent(ctx, { x: 0, y: contentY, w: cw, h: contentH, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    // AirOps logo — story-only (matches Figma)
    const logoH   = 72
    const logoW   = Math.round(784 * logoH / 252)
    const logoBmp = buildLogo(M.text, Math.round(logoH * dpr))
    const logoY   = ch - 40 - logoH
    ctx.fillStyle = M.bg
    ctx.fillRect(40, logoY, logoW, logoH)
    ctx.drawImage(logoBmp, 40, logoY, logoW, logoH)

    strokeLine(ctx, 0,      rowY,                   cw, rowY)
    strokeLine(ctx, splitX, rowY,                   splitX, rowY + headshotRowH)
    strokeLine(ctx, 0,      rowY + headshotRowH,    cw, rowY + headshotRowH)

  } else if (isPortrait) {
    // ── Portrait 4:5: content | headshot row  (flip swaps top/bottom)
    const headshotRowH = 540
    const contentH     = ch - headshotRowH
    const splitX       = Math.round(cw / 2)
    const rowY         = richFlip ? 0          : contentH
    const contentY     = richFlip ? headshotRowH : 0

    drawPhotoSection(ctx, profileImage,    0,      rowY, splitX, headshotRowH, M)
    drawLogoSection(ctx, companyLogoImage, splitX, rowY, splitX, headshotRowH, M)
    drawContent(ctx, { x: 0, y: contentY, w: cw, h: contentH, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    // Only draw the horizontal that separates content from headshot row — not the canvas-edge line
    const divY = richFlip ? rowY + headshotRowH : rowY
    strokeLine(ctx, 0,      divY, cw,     divY)
    strokeLine(ctx, splitX, rowY, splitX, rowY + headshotRowH)

  } else {
    // ── Square: content | photo+logo  (flip swaps left/right)
    const splitX     = Math.round(cw / 2)
    const logoPanelH = 158
    const photoH     = ch - logoPanelH
    const mediaX     = richFlip ? 0      : splitX
    const contentX   = richFlip ? splitX : 0

    drawPhotoSection(ctx, profileImage,    mediaX, 0,      splitX, photoH,     M)
    drawLogoSection(ctx, companyLogoImage, mediaX, photoH, splitX, logoPanelH, M)
    drawContent(ctx, { x: contentX, y: 0, w: splitX, h: ch, pad: 40,
      ...contentArgs, nameSz: 96, quoteSzBase: 56, quoteLH: 1.14 })

    strokeLine(ctx, splitX,                          0,      splitX,                          ch)
    strokeLine(ctx, mediaX === 0 ? 0 : splitX, photoH, mediaX === 0 ? splitX : cw, photoH)
  }
}
