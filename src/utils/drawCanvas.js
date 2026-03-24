// ── Brand color modes (Figma spec)
export const MODES = {
  green:  { bg: '#f8fffb', text: '#000d05', pill: '#dfeae3', pillText: '#000d05', ctaText: '#002910', lineColor: '#008c44' },
  pink:   { bg: '#fff7ff', text: '#0d020a', pill: '#fee7fd', pillText: '#0d020a', ctaText: '#3a092c', lineColor: '#8c0044' },
  yellow: { bg: '#fdfff3', text: '#0c0d01', pill: '#eeff8c', pillText: '#0c0d01', ctaText: '#242603', lineColor: '#7a7200' },
  blue:   { bg: '#f5f6ff', text: '#02020c', pill: '#e5e5ff', pillText: '#02020c', ctaText: '#0e0e57', lineColor: '#0014a8' },
};

// ── AirOps logo SVG paths (from Figma, viewBox 784×252)
export const LOGO_PATHS = [
  'M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z',
  'M173.137 65.6494V204.987H208.252V65.6494H173.137Z',
  'M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z',
  'M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z',
  'M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z',
  'M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z',
  'M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z',
];

export function buildLogo(color, h) {
  const sw = 784, sh = 252, sc = h / sh;
  const oc = document.createElement('canvas');
  oc.width = Math.round(sw * sc);
  oc.height = Math.round(h);
  const c = oc.getContext('2d');
  c.scale(sc, sc);
  c.fillStyle = color;
  LOGO_PATHS.forEach(d => c.fill(new Path2D(d)));
  return oc;
}

// Convert straight quotes to typographic curly quotes matching Serrif VF glyphs
export function smartQuotes(str) {
  return str
    .replace(/(^|[\s\u2014([\u201C])"/g, '$1\u201C')  // opening " after space/start
    .replace(/"/g, '\u201D');                           // remaining " → closing
}

export function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Shared CTA pill — call after all text/logo is drawn.
//    rightX:   right edge the pill should align to
//    bottomY:  bottom edge the pill should align to
export function drawCtaPill(ctx, rightX, bottomY, text, ctaTextColor, sans) {
  const ctaH = 104, ctaR = ctaH / 2;
  ctx.font = `600 40px ${sans}`;
  ctx.letterSpacing = '0px';
  const ctaW = ctx.measureText(text).width + 96;
  const ctaX = rightX - ctaW;
  const ctaY = bottomY - ctaH;

  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaR);
  ctx.fillStyle = '#00ff64';
  ctx.fill();

  ctx.fillStyle = ctaTextColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, ctaX + ctaW / 2, ctaY + ctaH / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
}

// ── Main draw function — always renders at full canvas resolution.
// Call with the preview <canvas> ref, or an offscreen canvas for export.
export function drawCanvas(canvas, settings, fontsReady) {
  const { firstName, lastName, roleCompany, ctaText, showCTA, colorMode, dims } = settings;
  const quote = smartQuotes(settings.quote ?? '');
  const { w: cw, h: ch } = dims;
  const dpr = settings.dpr ?? 1;

  canvas.width  = cw * dpr;
  canvas.height = ch * dpr;

  const ctx = canvas.getContext('2d');
  if (dpr !== 1) ctx.scale(dpr, dpr);

  const isLand  = cw > ch;
  const isStory = ch > cw * 1.5;

  // Font stacks — fall back to system fonts until custom fonts are ready
  const serif = fontsReady ? "'Serrif VF', Georgia, serif"           : 'Georgia, serif';
  const sans  = fontsReady ? "'Saans', sans-serif"                   : 'sans-serif';
  const mono  = fontsReady ? "'Saans Mono', 'DM Mono', monospace"    : 'monospace';

  const M   = MODES[colorMode];
  const pad = 40;
  const padY = isStory ? 240 : 40;
  const innerW = cw - pad * 2;

  // ── Background
  ctx.fillStyle = M.bg;
  ctx.fillRect(0, 0, cw, ch);

  // ── Vertical guide lines (Figma: x=40 and x=w-40, full height)
  ctx.strokeStyle = M.lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad, 0);      ctx.lineTo(pad, ch);      ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cw - pad, 0); ctx.lineTo(cw - pad, ch); ctx.stroke();

  // ── Quote: auto-shrink from base size down to 36px to fit available height
  const BASE_Q   = isLand ? 120 : 96;
  const qTracking = isLand ? -2.4 / 120 : -1.92 / 96;  // em ratio

  const footerH = isLand ? 80 : 120;
  const attrH   = 64 * 1.3 + 8 + 32 * 1.3;
  const availH  = ch - padY * 2 - footerH - attrH - 32 - 10;

  let qFont = BASE_Q;
  let qLines;
  ctx.textBaseline = 'top';
  for (let f = BASE_Q; f >= 36; f -= 1) {
    ctx.font = `400 ${f}px ${serif}`;
    ctx.letterSpacing = `${f * qTracking}px`;
    qLines = wrapText(ctx, quote, innerW);
    if (qLines.length * f * 1.08 <= availH) { qFont = f; break; }
  }

  ctx.font = `400 ${qFont}px ${serif}`;
  ctx.letterSpacing = `${qFont * qTracking}px`;
  qLines = wrapText(ctx, quote, innerW);

  const qLH = qFont * 1.08;
  let y = padY;
  ctx.fillStyle = M.text;
  ctx.textBaseline = 'top';
  qLines.forEach((line, i) => ctx.fillText(line, pad, y + i * qLH));
  y += qLines.length * qLH + 32;

  // ── Attribution — reset tracking before measuring
  ctx.letterSpacing = '0px';
  const nameSz = 64;
  const dashSz = 56;

  // Measure dash width (Serrif VF 400) including gap
  ctx.font = `400 ${dashSz}px ${serif}`;
  ctx.letterSpacing = `${dashSz * (-1.12 / 56)}px`;
  const dashW = ctx.measureText('—').width + 8;

  // Measure first name width (Serrif VF 400) including gap
  ctx.font = `400 ${nameSz}px ${serif}`;
  ctx.letterSpacing = `${nameSz * (-1.28 / 64)}px`;
  const fnW = ctx.measureText(firstName).width + 8;

  ctx.fillStyle = M.text;
  ctx.textBaseline = 'top';
  let nx = pad;

  // Dash — Serrif VF 400
  ctx.font = `400 ${dashSz}px ${serif}`;
  ctx.letterSpacing = `${dashSz * (-1.12 / 56)}px`;
  ctx.fillText('—', nx, y);
  nx += dashW;

  // First name — Serrif VF 400
  ctx.font = `400 ${nameSz}px ${serif}`;
  ctx.letterSpacing = `${nameSz * (-1.28 / 64)}px`;
  ctx.fillText(firstName, nx, y);
  nx += fnW;

  // Last name — Saans Regular 400
  ctx.font = `400 ${nameSz}px ${sans}`;
  ctx.letterSpacing = '0px';
  ctx.fillText(lastName, nx, y);

  y += nameSz * 1.3 + 4;

  // ── Position pill — Saans Mono 500
  const pillFontSz = 32;
  const pillText   = roleCompany.toUpperCase();
  ctx.font = `500 ${pillFontSz}px ${mono}`;
  ctx.letterSpacing = '1.92px';
  const pillTW   = ctx.measureText(pillText).width;
  const pillPadX = 16, pillPadY = 2;
  const pillW    = pillTW + pillPadX * 2;
  const pillH    = pillFontSz * 1.3 + pillPadY * 2;
  const pillX    = pad + dashW;

  ctx.letterSpacing = '0px';
  ctx.fillStyle = M.pill;
  ctx.fillRect(pillX, y, pillW, pillH);

  ctx.font = `500 ${pillFontSz}px ${mono}`;
  ctx.letterSpacing = '1.92px';
  ctx.fillStyle = M.pillText;
  ctx.textBaseline = 'top';
  ctx.fillText(pillText, pillX + pillPadX, y + pillPadY);
  ctx.letterSpacing = '0px';

  // ── Footer: logo (left) + CTA pill (right)
  const logoH   = 72;
  const logoW   = Math.round(784 * logoH / 252);
  const logoBmp = buildLogo(M.text, Math.round(logoH * dpr));
  // Non-story: logo bottom aligns with guide x (40px from edge)
  // Story: keep existing vertical positioning
  const logoY = isStory
    ? ch - padY - Math.max(logoH, 104) + (Math.max(logoH, 104) - logoH) / 2
    : ch - pad - logoH;
  ctx.fillStyle = M.bg;
  ctx.fillRect(pad + 2, logoY, logoW, logoH);
  ctx.drawImage(logoBmp, pad + 2, logoY, logoW, logoH);

  if (showCTA) {
    drawCtaPill(ctx, cw - pad, ch - padY, ctaText, M.ctaText, sans);
  }
}
