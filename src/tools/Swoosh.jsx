import { useState, useCallback } from 'react'
import './Swoosh.css'

const VARIANTS = [
  {
    key:   'light',
    label: 'Light',
    src:   '/Champions-LinkedInBadge-light.png',
    file:  'airops-champion-badge-light.png',
  },
  {
    key:   'dark',
    label: 'Dark',
    src:   '/Champions-LinkedInBadge-dark.png',
    file:  'airops-champion-badge-dark.png',
  },
]

// Original badge green hue ≈ 149° (hue of #008c44)
const BADGE_GREEN_HUE = 149

function hexToHue(hex) {
  const r = parseInt(hex.slice(1,3),16)/255
  const g = parseInt(hex.slice(3,5),16)/255
  const b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  if (max === min) return 0
  const d = max - min
  let h = 0
  if (max === r) h = ((g-b)/d + (g<b ? 6 : 0)) / 6
  else if (max === g) h = ((b-r)/d + 2) / 6
  else h = ((r-g)/d + 4) / 6
  return h * 360
}

function handleDownload(src, filename) {
  fetch(src)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    })
}

function downloadBrandBadge(src, filename, brandHex) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const cv = document.createElement('canvas')
    cv.width = img.naturalWidth
    cv.height = img.naturalHeight
    const cx = cv.getContext('2d')
    const rotate = hexToHue(brandHex) - BADGE_GREEN_HUE
    cx.filter = `hue-rotate(${rotate}deg)`
    cx.drawImage(img, 0, 0)
    cv.toBlob(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
  img.src = src
}

export default function Swoosh() {
  const [brandColor, setBrandColor] = useState('')

  const handleHexInput = useCallback((v) => {
    if (v === '' || /^#[0-9a-fA-F]{6}$/.test(v)) setBrandColor(v)
  }, [])

  const rotate = brandColor ? `hue-rotate(${hexToHue(brandColor) - BADGE_GREEN_HUE}deg)` : null

  return (
    <div className="swoosh-page">
      <div className="swoosh-inner">
        <div className="swoosh-header">
          <h1 className="swoosh-title">Champion Badge</h1>
          <p className="swoosh-subtitle">
            Download the AirOps Champion laurel wreath badge to overlay on your LinkedIn profile photo
          </p>
        </div>

        {/* Brand color */}
        <div className="swoosh-brand-section">
          <div className="swoosh-section-label">Brand Color (optional)</div>
          <div className="swoosh-brand-row">
            <input
              type="color"
              className="swoosh-brand-picker"
              value={brandColor || '#008c44'}
              onChange={e => setBrandColor(e.target.value)}
            />
            <input
              type="text"
              className="swoosh-brand-hex"
              value={brandColor}
              placeholder="#hex — tints badge to your brand color"
              onChange={e => handleHexInput(e.target.value.trim())}
            />
            {brandColor && (
              <button className="swoosh-brand-clear" onClick={() => setBrandColor('')}>✕</button>
            )}
          </div>
        </div>

        <div className="swoosh-variants">
          {VARIANTS.map(v => (
            <div key={v.key} className="swoosh-variant">
              <div className="swoosh-variant-label">{v.label}</div>
              <div className="swoosh-img-wrap">
                <img
                  src={v.src}
                  alt={`${v.label} badge`}
                  className="swoosh-img"
                  draggable={false}
                  style={rotate ? { filter: rotate } : undefined}
                />
              </div>
              <button
                className="swoosh-download-btn"
                onClick={() => brandColor
                  ? downloadBrandBadge(v.src, `airops-champion-badge-${v.key}-brand.png`, brandColor)
                  : handleDownload(v.src, v.file)
                }
              >
                ↓ Download {v.label}{brandColor ? ' (Brand)' : ''}
              </button>
            </div>
          ))}
        </div>

        <div className="swoosh-instructions">
          <div className="swoosh-section-label">How to use</div>
          <ol className="swoosh-steps">
            <li>Download either badge above</li>
            <li>Use a tool like Canva or Photoshop to overlay it on your LinkedIn headshot</li>
            <li>Upload the combined image as your LinkedIn profile photo</li>
            <li>Share your Champion status with your network!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
