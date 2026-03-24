import { buildLogo, wrapText } from './drawCanvas.js'

// ── Per-mode palette (5 AirOps brand variants)
const IJ_MODES = {
  paper:  { bg: '#f8fffb', text: '#002910', logoColor: '#002910', frameBorder: '#008c44', hiringColor: '#008c44' },
  mint:   { bg: '#dfeae3', text: '#002910', logoColor: '#002910', frameBorder: '#008c44', hiringColor: '#008c44' },
  green:  { bg: '#008c44', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#dfeae3', hiringColor: '#00ff64' },
  forest: { bg: '#002910', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#008c44', hiringColor: '#00ff64' },
  night:  { bg: '#000d05', text: '#ffffff', logoColor: '#ffffff', frameBorder: '#008c44', hiringColor: '#00ff64' },
}

// Photo frame bg — near-dark green base so lighter blend lifts highlights through cleanly
const PHOTO_BG = '#002910'

export const IJ_MODE_LABELS = {
  paper:  'Paper',
  mint:   'Mint',
  green:  'Green',
  forest: 'Forest',
  night:  'Night',
}

export function drawIJoinedCanvas(canvas, settings, fontsReady, profileImage, floralia) {
  const {
    dims,
    ijMode       = 'night',
    ijName       = 'Firstname Lastname',
    ijRole       = 'Role',
    ijShowHiring = true,
  } = settings

  const { w: cw, h: ch } = dims
  const dpr = settings.dpr ?? 1
  const s   = cw / 1920  // scale vs Figma 1920×1080 reference

  canvas.width  = cw * dpr
  canvas.height = ch * dpr

  const ctx = canvas.getContext('2d')
  if (dpr !== 1) ctx.scale(dpr, dpr)

  const M     = IJ_MODES[ijMode] ?? IJ_MODES.night
  const sans  = fontsReady ? "'Saans', sans-serif"                : 'sans-serif'
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace" : 'monospace'
  const serif = fontsReady ? "'Serrif VF', Georgia, serif"        : 'Georgia, serif'

  // ── Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // ── Layout constants (Figma reference 1920×1080)
  const guideX    = Math.round(40   * s)
  const contentY  = Math.round(40   * s)
  const contentH  = Math.round(1006 * s)
  const colGap    = Math.round(32   * s)
  const colW      = Math.round(904  * s)   // (1840 − 32) / 2
  const leftColX  = guideX
  const rightColX = guideX + colW + colGap

  // ── Decoration (floralia — identical logic to Twitter template)
  if (settings.showFloralia && floralia?.insideDots) {
    const rotAngle = ((settings.decorationRotation ?? 0) * Math.PI) / 180
    if (rotAngle !== 0) {
      ctx.save()
      ctx.translate(cw / 2, ch / 2)
      ctx.rotate(rotAngle)
      ctx.translate(-cw / 2, -ch / 2)
    }

    const isLand   = cw > ch
    const fscale   = Math.max(cw, ch) * 1.5
    const offX     = (cw - fscale) / 2 + Math.round(80 * s)  // nudge pattern right
    const offY     = (ch - fscale) / 2
    const dotR     = Math.max(cw, ch) * (isLand ? 0.0016 : 0.0022)
    const accent   = M.hiringColor
    const stepNorm = 0.006
    const shiftX   = ((guideX - offX) / fscale) % stepNorm
    const shiftY   = ((guideX - offY) / fscale) % stepNorm

    const drawDots = (dots, alpha) => {
      ctx.fillStyle   = accent
      ctx.globalAlpha = alpha
      ctx.beginPath()
      dots.forEach(({ x, y }) => {
        const px = offX + (x + shiftX) * fscale
        const py = offY + (y + shiftY) * fscale
        if (px > -dotR && px < cw + dotR && py > -dotR && py < ch + dotR) {
          ctx.moveTo(px + dotR, py)
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
        }
      })
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (settings.decorationStyle === 'inverted') {
      drawDots(floralia.outsideDots, 0.28)
      ctx.fillStyle    = M.bg
      ctx.globalAlpha  = 1
      ctx.textBaseline = 'middle'
      ctx.textAlign    = 'center'
      floralia.glyphs.forEach(({ char, fontSizeNorm, cxNorm, cyNorm }) => {
        ctx.font = `${fontSizeNorm * fscale}px Floralia`
        ctx.fillText(char, offX + cxNorm * fscale, offY + cyNorm * fscale)
      })
      ctx.textAlign    = 'left'
      ctx.textBaseline = 'top'
      ctx.globalAlpha  = 1
    } else {
      drawDots(floralia.insideDots, 0.35)
    }

    if (rotAngle !== 0) ctx.restore()
  }

  // ── Left column — "I joined" + logo (top)
  const ijTextSz = Math.round(192 * s)
  const ijLH     = Math.round(192 * 0.94 * s)   // line-height advance
  const logoH    = Math.round(178 * s)
  const logoW    = Math.round(logoH * 784 / 252)
  const logoGap  = Math.round(8 * s)
  const logoBmp  = buildLogo(M.logoColor, Math.round(logoH * dpr))

  const logoY = contentY + ijLH + logoGap

  // Draw logo bg rect FIRST so the "I joined" text (incl. J descender) renders on top of it
  ctx.fillStyle = M.bg
  if (settings.showFloralia && floralia?.insideDots) {
    const stepCanvas = 0.006 * Math.max(cw, ch) * 1.5
    const fy = Math.floor(logoY / stepCanvas) * stepCanvas
    const fh = Math.ceil((logoY + logoH - fy) / stepCanvas) * stepCanvas
    const fw = Math.ceil(logoW / stepCanvas) * stepCanvas + Math.round(1 * s)
    ctx.fillRect(leftColX, fy, fw, fh)
  } else {
    ctx.fillRect(leftColX, logoY, logoW + Math.round(1 * s), logoH)
  }

  // "I joined" text — drawn after logo bg so descender isn't clipped by it
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'
  ctx.font         = `400 ${ijTextSz}px ${sans}`
  ctx.letterSpacing = `${(-ijTextSz * 0.04).toFixed(2)}px`   // tracking −4%
  ctx.fillStyle    = M.bg
  ctx.fillRect(leftColX, contentY - Math.round(1 * s), Math.ceil(ctx.measureText('I joined').width), ijLH + Math.round(1 * s))
  ctx.fillStyle    = M.text
  ctx.fillText('I joined', leftColX, contentY)
  ctx.letterSpacing = '0px'

  // Logo image drawn last — transparent bitmap so descender shows through any gap
  ctx.drawImage(logoBmp, leftColX, logoY, logoW, logoH)

  // ── Left column — name / role / hiring (bottom-aligned)
  const nameSz      = Math.round(84 * s)
  const nameLH      = Math.round(80 * 0.94 * s)
  const roleSz      = Math.round(80 * s)
  const roleLH      = Math.round(80 * 0.94 * s)
  const nameRoleGap = Math.round(14 * s)        // gap between name block and role block
  const hireSz      = Math.round(40 * s)
  const hireLH      = Math.round(40 * 0.94 * s)
  const hireGap     = Math.round(25 * s)        // Figma: gap-[24.773px]

  // Max text width — left col width minus 24px margin before the photo frame
  const maxTextW = rightColX - leftColX - Math.round(24 * s)

  // Pre-wrap name and role so we know actual line counts before computing bottomGroupY
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`
  const nameLines  = wrapText(ctx, ijName, maxTextW)
  ctx.font         = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(-roleSz * 0.02).toFixed(2)}px`
  const roleLines  = wrapText(ctx, ijRole, maxTextW)
  ctx.letterSpacing = '0px'

  const contentBottom = contentY + contentH
  const hiringH       = ijShowHiring ? hireGap + hireLH : 0
  const nameH         = nameLines.length * nameLH
  const roleH         = roleLines.length * roleLH
  const bottomGroupH  = nameH + nameRoleGap + roleH + hiringH
  const bottomGroupY  = contentBottom - bottomGroupH

  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  // Name — Serrif VF: all bg rects first, then all text on top so descenders aren't clipped
  ctx.font         = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = M.bg
  nameLines.forEach((line, i) => {
    ctx.fillRect(leftColX, bottomGroupY + i * nameLH, Math.ceil(ctx.measureText(line).width), nameLH)
  })
  ctx.fillStyle    = M.text
  nameLines.forEach((line, i) => {
    ctx.fillText(line, leftColX, bottomGroupY + i * nameLH)
  })
  ctx.letterSpacing = '0px'

  // Role — Saans: same two-pass approach
  ctx.font         = `400 ${roleSz}px ${sans}`
  ctx.letterSpacing = `${(-roleSz * 0.02).toFixed(2)}px`
  ctx.fillStyle    = M.bg
  roleLines.forEach((line, i) => {
    ctx.fillRect(leftColX, bottomGroupY + nameH + nameRoleGap + i * roleLH, Math.ceil(ctx.measureText(line).width), roleLH)
  })
  ctx.fillStyle    = M.text
  roleLines.forEach((line, i) => {
    ctx.fillText(line, leftColX, bottomGroupY + nameH + nameRoleGap + i * roleLH)
  })
  ctx.letterSpacing = '0px'

  // (WE'RE HIRING) — Saans Mono Medium
  if (ijShowHiring) {
    const hireText = "(WE'RE HIRING)"
    const hireY    = bottomGroupY + nameH + nameRoleGap + roleH + hireGap
    ctx.font         = `500 ${hireSz}px ${mono}`
    ctx.letterSpacing = `${(-hireSz * 0.04).toFixed(2)}px`  // tracking −4%
    ctx.fillStyle    = M.bg
    ctx.fillRect(leftColX, hireY, Math.ceil(ctx.measureText(hireText).width), hireLH)
    ctx.fillStyle    = M.hiringColor
    ctx.fillText(hireText, leftColX, hireY)
    ctx.letterSpacing = '0px'
  }

  // ── Right column — photo frame
  const borderW = 3
  const pad     = Math.round(9 * s)   // Figma: p-[8.964px]
  const frameX  = rightColX
  const frameY  = contentY
  const frameW  = colW
  const frameH  = contentH

  // Frame container fill — M.bg fills the whole frame area, clearing floralia and
  // also acting as the fill for the padding gap between the stroke and the photo
  ctx.fillStyle = M.bg
  ctx.fillRect(frameX, frameY, frameW, frameH)

  // Border
  ctx.strokeStyle = M.frameBorder
  ctx.lineWidth   = borderW
  ctx.strokeRect(frameX + borderW / 2, frameY + borderW / 2, frameW - borderW, frameH - borderW)
  ctx.lineWidth = 1

  // Inner background
  const innerX = frameX + borderW + pad
  const innerY = frameY + borderW + pad
  const innerW = frameW - (borderW + pad) * 2
  const innerH = frameH - (borderW + pad) * 2

  // Inner background — per-mode near-dark base so lighter blend produces the right headshot depth
  ctx.fillStyle = PHOTO_BG
  ctx.fillRect(innerX, innerY, innerW, innerH)

  // Photo — aspect-fill with 4px overscan + lighten blend
  if (profileImage) {
    const overscan = 4
    const ps = Math.max(
      (innerW + overscan * 2) / (profileImage.naturalWidth  || 1),
      (innerH + overscan * 2) / (profileImage.naturalHeight || 1),
    )
    const iw = profileImage.naturalWidth  * ps
    const ih = profileImage.naturalHeight * ps
    ctx.save()
    ctx.beginPath()
    ctx.rect(innerX, innerY, innerW, innerH)
    ctx.clip()
    ctx.globalCompositeOperation = 'hard-light'
    ctx.drawImage(profileImage, innerX + (innerW - iw) / 2, innerY + (innerH - ih) / 2, iw, ih)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
  }

  // Reset
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0px'
}
