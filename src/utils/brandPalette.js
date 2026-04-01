// ── Brand color palette generator
// Given a brand hex color, produces mode objects that slot directly into each
// template's existing MODES lookup. All generated modes follow the same color
// key contracts as the hand-crafted presets.

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else                h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s * 100, l * 100]
}

function hsl(h, s, l) {
  s = Math.max(0, Math.min(100, s)) / 100
  l = Math.max(0, Math.min(100, l)) / 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
      .toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generateBrandModes(brandHex) {
  if (!brandHex || !/^#[0-9a-fA-F]{6}$/.test(brandHex)) return null

  const [h, rawS, rawL] = hexToHsl(brandHex)

  // Normalize saturation/lightness so pale or neon inputs still yield
  // usable palettes — the hue is always faithfully preserved.
  const aS = Math.max(55, Math.min(rawS, 88))  // accent saturation
  const aL = Math.max(33, Math.min(rawL, 55))  // accent lightness

  // ── Derived tokens ────────────────────────────────────────────────────────
  const accent       = hsl(h, aS, aL)
  const accentDark   = hsl(h, aS, Math.max(aL - 14, 16))
  const accentBright = hsl(h, 92, Math.min(aL + 14, 64))

  const lightBg   = hsl(h, 12, 98)
  const lightText = hsl(h, aS, 7)
  const lightPill = hsl(h, 14, 92)
  const lightDeep = hsl(h, aS, 9)

  const mintBg   = hsl(h, 16, 88)
  const mintPill = hsl(h, 12, 82)

  const darkBg   = hsl(h, Math.min(aS, 65), 7)
  const darkBg2  = hsl(h, Math.min(aS, 50), 13)
  const darkText = hsl(h, 12, 92)
  const darkText2 = hsl(h, 10, 97)

  // ── Quote / RichQuote / Twitter / TitleCard base palette ─────────────────
  const quoteLight = {
    bg: lightBg, text: lightText, pill: lightPill, pillText: lightText,
    ctaText: lightDeep, lineColor: accent, logoColor: lightText,
  }
  const quoteDark = {
    bg: darkBg, text: darkText, pill: darkBg2, pillText: darkText,
    ctaText: darkText, lineColor: accentBright, logoColor: darkText,
    eyebrowBg: hsl(h, aS, 4),
  }

  return {
    // ── Shared quote palette (quote, richquote, twitter, titlecard) ─────────
    quote: {
      'custom-light': quoteLight,
      'custom-dark':  quoteDark,
    },

    // ── Announcement ─────────────────────────────────────────────────────────
    announcement: {
      'custom-light': {
        bg: lightBg, border: accent, photoBorder: accentDark,
        champText: lightText, airopsText: accent, wreathColor: lightText,
        dotColor: accent, firstName: hsl(h, aS, 4), lastName: lightText,
        roleColor: lightText, roleBg: lightPill, logoBorder: lightText,
      },
      'custom-dark': {
        bg: darkBg, border: accentBright, photoBorder: hsl(h, 80, Math.min(aL + 8, 57)),
        champText: darkText, airopsText: accentBright, wreathColor: darkText,
        dotColor: hsl(h, 75, Math.min(aL + 5, 55)), firstName: darkText2, lastName: darkText,
        roleColor: darkText, roleBg: darkBg2, logoBorder: darkText,
      },
      'custom-mint': {
        bg: mintBg, border: accent, photoBorder: accentDark,
        champText: lightText, airopsText: accent, wreathColor: lightText,
        dotColor: accent, firstName: hsl(h, aS, 4), lastName: lightText,
        roleColor: lightText, roleBg: mintPill, logoBorder: lightText,
      },
    },

    // ── I Joined ─────────────────────────────────────────────────────────────
    ijoined: {
      'custom-light': {
        bg: lightBg, text: lightText, logoColor: lightText,
        frameBorder: accent, hiringColor: accent,
      },
      'custom-dark': {
        bg: darkBg, text: darkText, logoColor: darkText,
        frameBorder: accent, hiringColor: accentBright,
      },
    },

    // ── TitleCard-specific accent values ──────────────────────────────────────
    eyebrowAccent:   accent,        // eyebrow pill border/text in light mode
    emphasizeLight:  accent,        // sans title emphasis in light mode
    emphasizeDark:   accentBright,  // sans title emphasis in dark mode
  }
}
