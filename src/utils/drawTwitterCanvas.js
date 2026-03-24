import { MODES, buildLogo, wrapText, drawCtaPill } from './drawCanvas.js'
import { STIPPLE_COLORS } from './drawFleurons.js'

// Dark variants — bg is one visible step up from near-black, logo uses a light tint
const DARK_MODES = {
  'dark-green':  { bg: '#0f2412', lineColor: 'rgba(0,210,80,1)',    logoColor: '#e8f5ee' },
  'dark-pink':   { bg: '#230a1e', lineColor: 'rgba(210,0,160,1)',   logoColor: '#f5e8f2' },
  'dark-yellow': { bg: '#1c1d03', lineColor: 'rgba(190,190,0,1)',   logoColor: '#f5f5e0' },
  'dark-blue':   { bg: '#0f0f5a', lineColor: 'rgba(100,100,255,1)', logoColor: '#e5e5ff' },
}

const DARK_MODE_KEYS = new Set(Object.keys(DARK_MODES))

export function drawTwitterCanvas(canvas, settings, fontsReady, profileImage, floralia) {
  const {
    colorMode,
    dims,
    tweetText         = '',
    tweetAuthorName   = '',
    tweetAuthorHandle = '',
    tweetDate         = '',
    showCTA           = false,
    ctaText           = '',
  } = settings
  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx  = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)
  const isDark = DARK_MODE_KEYS.has(colorMode)
  // Content inside the white box always uses the light base colours
  const baseMode  = isDark ? colorMode.replace('dark-', '') : colorMode
  const M         = MODES[baseMode] || MODES['green']
  // Background, guides and logo use the dark variant when active
  const TM        = isDark ? DARK_MODES[colorMode] : M
  const bgColor   = TM.bg
  const lineColor = TM.lineColor
  const logoColor = isDark ? TM.logoColor : M.text

  const isLand  = cw > ch
  const isStory = ch > cw * 1.5

  const sans = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'

  // ── Same guide x-coordinates as quote template
  const guideX = 40
  const padY   = isStory ? 200 : 80

  const boxPadX  = isLand ? 52 : 64
  const boxPadY  = isLand ? 52 : 64
  const boxW     = cw - guideX * 2
  const contentW = boxW - boxPadX * 2

  // ── Background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, cw, ch)

  // ── Decoration (fleuron font fill)
  if (settings.showFloralia && floralia?.insideDots) {
    const rotAngle = ((settings.decorationRotation ?? 0) * Math.PI) / 180
    if (rotAngle !== 0) {
      ctx.save()
      ctx.translate(cw / 2, ch / 2)
      ctx.rotate(rotAngle)
      ctx.translate(-cw / 2, -ch / 2)
    }

    const scale  = Math.max(cw, ch) * 1.5
    const offX   = (cw - scale) / 2
    const offY   = (ch - scale) / 2
    const dotR   = Math.max(cw, ch) * (isLand ? 0.0016 : 0.0022)
    const accent = STIPPLE_COLORS[colorMode] ?? STIPPLE_COLORS['green']

    // Phase-shift the dot grid so a dot lands exactly on the 40px guide lines
    const stepNorm = 0.006
    const shiftX = ((guideX - offX) / scale) % stepNorm
    const shiftY = ((guideX - offY) / scale) % stepNorm

    const drawDots = (dots, alpha) => {
      ctx.fillStyle   = accent
      ctx.globalAlpha = alpha
      ctx.beginPath()
      dots.forEach(({ x, y }) => {
        const px = offX + (x + shiftX) * scale
        const py = offY + (y + shiftY) * scale
        if (px > -dotR && px < cw + dotR && py > -dotR && py < ch + dotR) {
          ctx.moveTo(px + dotR, py)
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
        }
      })
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (settings.decorationStyle === 'inverted') {
      // Dot grid covers entire canvas, solid glyph shapes cut through
      drawDots(floralia.outsideDots, 0.28)
      // Solid glyph shapes on top of the dot grid — exact background colour
      ctx.fillStyle    = bgColor
      ctx.globalAlpha  = 1
      ctx.textBaseline = 'middle'
      ctx.textAlign    = 'center'
      floralia.glyphs.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
        ctx.font = `${fontSizeNorm * scale}px Floralia`
        ctx.fillText(char, offX + cxNorm * scale, offY + cyNorm * scale)
      })
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'top'
      ctx.globalAlpha  = 1
    } else {
      // Dot fill inside glyph shapes only
      drawDots(floralia.insideDots, 0.35)
    }

    if (rotAngle !== 0) ctx.restore()
  }

  // ── Placeholder when nothing entered
  if (!tweetText.trim() && !tweetAuthorName.trim()) {
    ctx.font = `500 ${isLand ? 40 : 52}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle = isDark ? logoColor : M.pillText
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText('Enter tweet content to preview', cw / 2, ch / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    return
  }

  const authorName   = tweetAuthorName
  const authorHandle = tweetAuthorHandle.startsWith('@')
    ? tweetAuthorHandle
    : tweetAuthorHandle ? `@${tweetAuthorHandle}` : ''
  const initials = authorName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  // ── Sizes
  const nameSz    = isLand ? 36 : 46
  const handleSz  = isLand ? 24 : 30
  const avatarSz  = Math.round(nameSz * 1.15 + handleSz)
  const dateSz    = isLand ? 18 : 22
  const logoH     = 72

  const gapAuthorText = isStory ? 48 : 36
  const gapTextDate   = isStory ? 40 : 32
  const gapBoxFooter  = isLand  ? 28 : 56

  const authorH = avatarSz
  const dateH   = tweetDate ? dateSz * 1.4 : 0
  const dateGap = tweetDate ? gapTextDate   : 0

  // ── Available height for tweet text
  // Non-story: logo bottom is at ch - guideX (40px), so reserve that space symmetrically for centering
  // Story: use padY-based constraint (unchanged)
  const footerReserve = isStory ? padY + logoH + gapBoxFooter : guideX + logoH + gapBoxFooter
  const textAvailH = ch - footerReserve * 2 - boxPadY * 2 - authorH - gapAuthorText - dateGap - dateH

  // ── Measure + wrap tweet text
  const BASE_T = isLand ? 52 : 68
  let tFont = BASE_T
  let tLines

  ctx.textBaseline = 'top'
  for (let f = BASE_T; f >= 28; f -= 1) {
    ctx.font = `500 ${f}px ${sans}`
    ctx.letterSpacing = '0px'
    tLines = wrapText(ctx, tweetText, contentW)
    if (tLines.length * f * 1.2 <= textAvailH) { tFont = f; break }
  }
  ctx.font = `500 ${tFont}px ${sans}`
  ctx.letterSpacing = '0px'
  tLines = wrapText(ctx, tweetText, contentW)
  const tLH  = tFont * 1.2
  const textH = tLines.length * tLH

  // ── Compute box dimensions
  const boxH = boxPadY + authorH + gapAuthorText + textH + dateGap + dateH + boxPadY
  // Story: shift box above centre to account for Instagram bottom UI chrome
  // All other formats: perfect vertical centre
  const vCenter  = isStory ? ch * 0.42 : ch * 0.5
  const boxY     = Math.round(vCenter - boxH / 2)
  const boxXC    = Math.round((cw - boxW) / 2)
  const contentX = boxXC + boxPadX

  // ── Draw white content box (centred)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(boxXC, boxY, boxW, boxH)

  // ── Guide lines drawn ON TOP of box so they're never interrupted
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 2

  // Vertical guides — stroke shifted outward by half lineWidth so the inner
  // edge of the stroke sits exactly at x=40 and nothing inside bleeds over it
  const hw = ctx.lineWidth / 2
  ctx.beginPath(); ctx.moveTo(guideX - hw, 0);        ctx.lineTo(guideX - hw, ch);        ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cw - guideX + hw, 0);   ctx.lineTo(cw - guideX + hw, ch);   ctx.stroke()

  // Horizontal guides at top and bottom of box (full canvas width, responsive to centred position)
  // Stroke shifted outward so the inner edge sits exactly at boxY / boxY+boxH (same treatment as vertical guides)
  ctx.beginPath(); ctx.moveTo(0, boxY - hw);        ctx.lineTo(cw, boxY - hw);        ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, boxY + boxH + hw); ctx.lineTo(cw, boxY + boxH + hw); ctx.stroke()

  // ── Content inside box
  let y = boxY + boxPadY

  // Avatar circle
  const cx = contentX + avatarSz / 2
  const cy = y        + avatarSz / 2

  ctx.beginPath()
  ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
  ctx.fillStyle = M.pill
  ctx.fill()

  if (profileImage) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, avatarSz / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(profileImage, contentX, y, avatarSz, avatarSz)
    ctx.restore()
  } else {
    ctx.font = `500 ${Math.round(avatarSz * 0.38)}px ${sans}`
    ctx.letterSpacing = '0px'
    ctx.fillStyle = M.pillText
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, cx, cy)
    ctx.textAlign = 'left'
  }

  // Name + handle
  const nameX = contentX + avatarSz + 20
  const nameY = y + avatarSz / 2 - (nameSz * 1.15 + handleSz * 0.6) / 2

  ctx.font = `700 ${nameSz}px ${sans}`
  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.text
  ctx.textBaseline = 'top'
  ctx.fillText(authorName, nameX, nameY)

  ctx.globalAlpha = 0.55
  ctx.font = `500 ${handleSz}px ${mono}`
  ctx.letterSpacing = '0.02em'
  ctx.fillStyle = M.pillText
  ctx.fillText(authorHandle, nameX, nameY + nameSz * 1.15)
  ctx.globalAlpha = 1

  y += authorH + gapAuthorText

  // Tweet text
  ctx.font = `500 ${tFont}px ${sans}`
  ctx.letterSpacing = '0px'
  ctx.fillStyle = M.text
  ctx.textBaseline = 'top'
  tLines.forEach((line, i) => ctx.fillText(line, contentX, y + i * tLH))
  y += textH + dateGap

  // Date / time
  if (tweetDate) {
    ctx.globalAlpha = 0.4
    ctx.font = `500 ${dateSz}px ${mono}`
    ctx.letterSpacing = '0.04em'
    ctx.fillStyle = M.text
    ctx.textBaseline = 'top'
    ctx.fillText(tweetDate, contentX, y)
    ctx.globalAlpha = 1
  }

  // ── Footer: AirOps logo (outside box, on brand background)
  // Non-story: logo bottom aligns with guide x (40px from edge), matching quote template
  // Story: 40px below the bottom edge of the white box
  // Build at dpr× so the bitmap is sharp in the scaled context; draw at CSS dimensions.
  const logoW   = Math.round(784 * logoH / 252)
  const logoBmp = buildLogo(logoColor, Math.round(logoH * dpr))
  const footerY = isStory ? boxY + boxH + 40 : ch - guideX - logoH
  // Always clear background behind logo. When decoration is active (either style), snap the
  // fill rect to the dot grid so no dots are partially clipped at its edges.
  const logoX = guideX + 2
  ctx.fillStyle = bgColor
  if (settings.showFloralia && floralia?.insideDots) {
    const stepCanvas = 0.006 * Math.max(cw, ch) * 1.5
    const fy = Math.floor(footerY / stepCanvas) * stepCanvas
    const fh = Math.ceil((footerY + logoH - fy) / stepCanvas) * stepCanvas
    const fw = Math.ceil(logoW / stepCanvas) * stepCanvas
    ctx.fillRect(logoX, fy, fw, fh)
  } else {
    ctx.fillRect(logoX, footerY, logoW, logoH)
  }
  ctx.drawImage(logoBmp, logoX, footerY, logoW, logoH)

  // ── CTA pill (right-aligned to guide, bottom-aligned with logo)
  if (showCTA && ctaText) {
    drawCtaPill(ctx, cw - guideX, footerY + logoH, ctaText, M.ctaText, sans)
  }
}
