import { buildLockup, wrapText } from './drawCanvas.js'

// ── Color modes
export const MODES = {
  'paper-light': {
    bg:          '#f8fffb',
    border:      '#008c44',
    champText:   '#002910',
    airopsText:  '#009b32',
    wreathColor: '#002910',
    firstName:   '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    quoteColor:  '#008c44',
  },
  'paper-dark': {
    bg:          '#002910',
    border:      '#00ff64',
    champText:   '#dfeae3',
    airopsText:  '#00ff64',
    wreathColor: '#dfeae3',
    firstName:   '#f8fffb',
    lastName:    '#dfeae3',
    roleColor:   '#dfeae3',
    quoteColor:  '#00ff64',
  },
  'mint': {
    bg:          '#dfeae3',
    border:      '#008c44',
    champText:   '#002910',
    airopsText:  '#008c44',
    wreathColor: '#002910',
    firstName:   '#000d05',
    lastName:    '#002910',
    roleColor:   '#002910',
    quoteColor:  '#008c44',
  },
}

// ── Canvas decorative border
function drawBorder(ctx, cw, ch, color, s) {
  const inset = Math.round(29 * s)
  ctx.strokeStyle = color
  ctx.lineWidth   = Math.round(2 * s)
  ctx.strokeRect(inset, inset, cw - inset * 2, ch - inset * 2)
}

// ── Left photo panel — fills left ~52% of canvas, full height
function drawPhotoPanel(ctx, M, cw, ch, profileImage) {
  const pw = Math.round(cw * 0.527)  // matches Figma x:1013 divider

  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, pw, ch)

  if (!profileImage) {
    // Upload placeholder
    const s = cw / 1920
    ctx.save()
    ctx.setLineDash([Math.round(8 * s), Math.round(8 * s)])
    ctx.strokeStyle = M.border
    ctx.globalAlpha = 0.35
    ctx.lineWidth   = Math.round(2 * s)
    const inset = Math.round(pw * 0.1)
    ctx.strokeRect(inset, Math.round(ch * 0.1), pw - inset * 2, Math.round(ch * 0.8))
    ctx.setLineDash([])
    const sz = Math.round(28 * s)
    ctx.font         = `400 ${sz}px sans-serif`
    ctx.fillStyle    = M.border
    ctx.globalAlpha  = 0.45
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('↑  Upload photo', pw / 2, ch / 2)
    ctx.restore()
    return
  }

  if (profileImage) {
    const iA = (profileImage.naturalWidth || 1) / (profileImage.naturalHeight || 1)
    const cA = pw / ch
    let iw, ih
    if (iA > cA) { ih = ch; iw = ch * iA }
    else          { iw = pw; ih = pw / iA }
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, pw, ch)
    ctx.clip()
    ctx.drawImage(profileImage, (pw - iw) / 2, (ch - ih) / 2, iw, ih)
    ctx.restore()
  }
}

// ── Laurel frame — HeadshotLaurelsOnly.svg scaled over the photo panel
function drawLaurelFrame(ctx, cw, ch, laurelFrameImage) {
  if (!laurelFrameImage) return
  const pw = Math.round(cw * 0.527)
  const FRAME_H = laurelFrameImage.naturalHeight || 836
  const FRAME_W = laurelFrameImage.naturalWidth  || 824
  // Scale to full panel height; clip to panel width
  const fScale = ch / FRAME_H
  const fw = Math.round(FRAME_W * fScale)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, pw, ch)
  ctx.clip()
  ctx.drawImage(laurelFrameImage, 0, 0, fw, ch)
  ctx.restore()
}

// ── Right text panel
function drawTextPanel(ctx, cw, ch, M, s, dpr, fontsReady, settings, companyLogoImage) {
  const {
    annFirstName  = 'Jordan',
    annLastName   = 'Miller',
    annRole       = 'Senior SEO Manager, LegalZoom',
    annQuote      = '\u201CGetting other people excited about the possibilities in this space has been my biggest win.\u201D',
    annColorMode  = 'paper-light',
  } = settings

  const serif = fontsReady ? "'Serrif VF', Georgia, serif" : 'Georgia, serif'
  const sans  = fontsReady ? "'Saans', sans-serif"         : 'sans-serif'

  const tx   = Math.round(1013 * s) + Math.round(40 * s)
  const padR = Math.round(60 * s)
  const maxW = cw - tx - padR

  ctx.save()
  ctx.beginPath()
  ctx.rect(tx, 0, maxW + padR, ch)
  ctx.clip()
  ctx.textBaseline = 'top'
  ctx.textAlign    = 'left'

  let ty = Math.round(56 * s)

  // ── First name — Serrif VF 400
  const nameSz = Math.round(134 * s)
  ctx.font          = `400 ${nameSz}px ${serif}`
  ctx.letterSpacing = `${(-nameSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.firstName
  ctx.fillText(annFirstName, tx, ty)
  ty += Math.round(nameSz * 1.05)

  // ── Last name — Serrif VF 400
  ctx.font          = `400 ${nameSz}px ${serif}`
  ctx.fillStyle     = M.lastName
  ctx.fillText(annLastName, tx, ty)
  ty += Math.round(nameSz * 1.2)

  ctx.letterSpacing = '0px'

  // ── Role — plain sans text
  const roleSz = Math.round(32 * s)
  ctx.font      = `400 ${roleSz}px ${sans}`
  ctx.fillStyle = M.roleColor
  ctx.fillText(annRole, tx, ty)
  ty += Math.round(roleSz * 1.5)

  // ── Company logo — drawn below role, left-aligned; recolored on dark bg
  if (companyLogoImage) {
    const logoH = Math.round(54 * s)
    const logoW = Math.round(companyLogoImage.naturalWidth * (logoH / companyLogoImage.naturalHeight))
    const isDark = annColorMode === 'paper-dark'
    if (isDark) {
      const logoBmp = buildLockup(companyLogoImage, M.lastName, Math.round(logoW * dpr), Math.round(logoH * dpr))
      ctx.drawImage(logoBmp, tx, ty, logoW, logoH)
    } else {
      ctx.drawImage(companyLogoImage, tx, ty, logoW, logoH)
    }
    ty += Math.round(logoH * 1.8)
  } else {
    ty += Math.round(roleSz * 0.9)
  }

  // ── Push "I'm a Champion because…" down to at least 52% of canvas height
  ty = Math.max(ty, Math.round(ch * 0.52))

  // ── "I'm a Champion because…" label
  const labelSz = Math.round(34 * s)
  ctx.font      = `400 ${labelSz}px ${sans}`
  ctx.fillStyle = M.champText
  ctx.fillText('\u201CI\u2019m a Champion because\u2026', tx, ty)
  ty += Math.round(labelSz * 1.8)

  // ── Quote — large serif, brand green, wrapped
  const quoteSz = Math.round(52 * s)
  ctx.font          = `400 ${quoteSz}px ${serif}`
  ctx.letterSpacing = `${(-quoteSz * 0.02).toFixed(2)}px`
  ctx.fillStyle     = M.quoteColor
  const qLines = wrapText(ctx, annQuote, maxW)
  qLines.forEach((line, i) => {
    ctx.fillText(line, tx, ty + i * Math.round(quoteSz * 1.15))
  })

  ctx.letterSpacing = '0px'
  ctx.restore()
}

// ── AirOps Champion lockup — bottom-left of photo panel
function drawLockup(ctx, cw, ch, M, s, dpr, lockupImage) {
  if (!lockupImage) return
  const lkH = Math.round(ch * 0.14)      // ~14% canvas height = slightly larger
  const lkW = Math.round(1179 * lkH / 291)
  const lkColor = M.champText
  const lkBmp = buildLockup(lockupImage, lkColor, Math.round(lkW * dpr), Math.round(lkH * dpr))
  const lkX = Math.round(32 * s)
  const lkY = ch - Math.round(32 * s) - lkH
  // Small bg rect so lockup reads cleanly over photo
  ctx.fillStyle = M.bg
  ctx.globalAlpha = 0.85
  ctx.fillRect(lkX - Math.round(8 * s), lkY - Math.round(8 * s), lkW + Math.round(16 * s), lkH + Math.round(16 * s))
  ctx.globalAlpha = 1
  ctx.drawImage(lkBmp, lkX, lkY, lkW, lkH)
}

// ── Main export
export function drawAnnouncementCanvas(canvas, settings, fontsReady, profileImage, laurelFrameImage, companyLogoImage, lockupImage) {
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

  const M = settings.brandModes?.announcement?.[annColorMode] ?? MODES[annColorMode] ?? MODES['paper-light']

  // Background
  ctx.fillStyle = M.bg
  ctx.fillRect(0, 0, cw, ch)

  // Photo panel (left side)
  drawPhotoPanel(ctx, M, cw, ch, profileImage)

  // Laurel frame overlay on photo
  drawLaurelFrame(ctx, cw, ch, laurelFrameImage)

  // Champion lockup (bottom-left of photo panel)
  drawLockup(ctx, cw, ch, M, s, dpr, lockupImage)

  // Vertical divider between photo and text panels
  const divX = Math.round(cw * 0.527)
  ctx.strokeStyle = M.border
  ctx.lineWidth   = Math.round(2 * s)
  ctx.beginPath()
  ctx.moveTo(divX, 0)
  ctx.lineTo(divX, ch)
  ctx.stroke()

  // Border
  drawBorder(ctx, cw, ch, M.border, s)

  // Text panel (right side)
  drawTextPanel(ctx, cw, ch, M, s, dpr, fontsReady, settings, companyLogoImage)
}
