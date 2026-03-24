// ── Draw a single pointed leaf (almond shape)
function drawLeafShape(ctx, cx, cy, leafW, leafH, angle) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, -leafH / 2)
  ctx.bezierCurveTo(leafW / 2, -leafH / 4, leafW / 2, leafH / 4, 0, leafH / 2)
  ctx.bezierCurveTo(-leafW / 2, leafH / 4, -leafW / 2, -leafH / 4, 0, -leafH / 2)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// ── Draw one arc of leaves (left or right side of wreath)
// centerX, centerY: center of the wreath badge
// radius: distance from center to leaf center
// startAngle, endAngle: angular range (radians)
// leafCount: number of leaves in this arc
// side: 'left' | 'right' — controls leaf angle offset
function drawLeafArc(ctx, centerX, centerY, radius, startAngle, endAngle, leafCount, side, leafW, leafH) {
  for (let i = 0; i < leafCount; i++) {
    const t = i / (leafCount - 1)
    const angle = startAngle + t * (endAngle - startAngle)
    const lx = centerX + Math.cos(angle) * radius
    const ly = centerY + Math.sin(angle) * radius
    // Leaf points tangentially along the arc, perpendicular to radius
    const leafAngle = angle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2) + Math.PI / 2
    drawLeafShape(ctx, lx, ly, leafW, leafH, leafAngle)
  }
}

// ── Main export: draw a laurel wreath badge on a canvas
// bgColor: null = transparent, otherwise fills background circle
// wreathColor: color of the leaves
// textColor: color of the "ao" text
export function drawLaurelWreathBadge(canvas, bgColor, wreathColor, textColor, fontsReady) {
  const size = canvas.width
  const ctx  = canvas.getContext('2d')

  ctx.clearRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const r  = size / 2

  // Background
  if (bgColor) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = bgColor
    ctx.fill()
  }

  // Leaf parameters scaled to canvas size
  const leafW     = size * 0.10
  const leafH     = size * 0.20
  const radius    = size * 0.35
  const leafCount = 9

  ctx.fillStyle = wreathColor

  // Left arc: from ~7 o'clock to ~11 o'clock (math angles: ~225° to ~315° going CCW)
  // In canvas coords (y-down): left side goes from bottom-left to top-left
  const leftStart = (210 * Math.PI) / 180
  const leftEnd   = (330 * Math.PI) / 180
  drawLeafArc(ctx, cx, cy, radius, leftStart, leftEnd, leafCount, 'left', leafW, leafH)

  // Right arc: mirrored
  const rightStart = (330 * Math.PI) / 180 + Math.PI
  const rightEnd   = (210 * Math.PI) / 180 + Math.PI
  drawLeafArc(ctx, cx, cy, radius, rightStart, rightEnd, leafCount, 'right', leafW, leafH)

  // Small connecting leaves at bottom center
  ctx.fillStyle = wreathColor
  const bottomLeafW = size * 0.08
  const bottomLeafH = size * 0.16
  const bottomY     = cy + size * 0.34
  drawLeafShape(ctx, cx - size * 0.04, bottomY, bottomLeafW, bottomLeafH, -0.2)
  drawLeafShape(ctx, cx + size * 0.04, bottomY, bottomLeafW, bottomLeafH, 0.2)

  // "ao" text
  const sans = fontsReady ? "'Saans', sans-serif" : 'sans-serif'
  const textSz = Math.round(size * 0.28)
  ctx.font         = `700 ${textSz}px ${sans}`
  ctx.fillStyle    = textColor
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = `${(-textSz * 0.02).toFixed(2)}px`
  ctx.fillText('ao', cx, cy - size * 0.02)
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = '0px'
}
