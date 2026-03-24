import { useState, useEffect, useRef, useCallback } from 'react'
import { drawLaurelWreathBadge } from '../utils/drawLaurelWreath'
import { loadFonts } from '../utils/loadFonts'
import './Swoosh.css'

const SIZES = [
  { px: 400, label: '400×400', sub: 'LinkedIn frame' },
  { px: 800, label: '800×800', sub: 'High resolution' },
]

const VARIANTS = [
  { key: 'dark',        label: 'Dark',        bg: '#000d05', wreath: '#008c44', text: '#f8fffb' },
  { key: 'light',       label: 'Light',       bg: '#ffffff', wreath: '#008c44', text: '#000d05' },
  { key: 'transparent', label: 'Transparent', bg: null,      wreath: '#008c44', text: '#000d05' },
]

export default function Swoosh() {
  const [fontsReady, setFontsReady] = useState(false)
  const [selectedSize, setSelectedSize] = useState(400)
  const canvasRefs = {
    dark:        useRef(null),
    light:       useRef(null),
    transparent: useRef(null),
  }

  useEffect(() => {
    loadFonts().then(() => setFontsReady(true)).catch(() => {})
  }, [])

  // Draw all variants whenever fonts or size changes
  useEffect(() => {
    VARIANTS.forEach(v => {
      const canvas = canvasRefs[v.key].current
      if (!canvas) return
      canvas.width  = selectedSize
      canvas.height = selectedSize
      drawLaurelWreathBadge(canvas, v.bg, v.wreath, v.text, fontsReady)
    })
  }, [fontsReady, selectedSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = useCallback((variantKey, bg) => {
    const canvas = canvasRefs[variantKey].current
    if (!canvas) return
    const mime = bg === null ? 'image/png' : 'image/png'
    const a = document.createElement('a')
    a.download = `airops-champion-badge-${variantKey}-${selectedSize}x${selectedSize}.png`
    a.href = canvas.toDataURL(mime)
    a.click()
  }, [selectedSize]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="swoosh-page">
      <div className="swoosh-inner">
        <div className="swoosh-header">
          <h1 className="swoosh-title">Champion Swoosh</h1>
          <p className="swoosh-subtitle">
            Download the AirOps Champion laurel wreath to overlay on your LinkedIn profile photo
          </p>
        </div>

        {/* Size picker */}
        <div className="swoosh-size-section">
          <div className="swoosh-section-label">Export Size</div>
          <div className="swoosh-size-grid">
            {SIZES.map(s => (
              <button
                key={s.px}
                className={`swoosh-size-btn${selectedSize === s.px ? ' active' : ''}`}
                onClick={() => setSelectedSize(s.px)}
              >
                <span className="swoosh-size-dims">{s.label}</span>
                <span className="swoosh-size-sub">{s.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Badge variants */}
        <div className="swoosh-variants">
          {VARIANTS.map(v => (
            <div key={v.key} className="swoosh-variant">
              <div className="swoosh-variant-label">{v.label}</div>
              <div
                className="swoosh-canvas-wrap"
                style={{ background: v.bg === null ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px' : v.bg }}
              >
                <canvas
                  ref={canvasRefs[v.key]}
                  width={selectedSize}
                  height={selectedSize}
                  className="swoosh-canvas"
                />
              </div>
              <button
                className="swoosh-download-btn"
                onClick={() => handleDownload(v.key, v.bg)}
                disabled={!fontsReady}
              >
                ↓ Download {v.label}
              </button>
            </div>
          ))}
        </div>

        <div className="swoosh-instructions">
          <div className="swoosh-section-label">How to use</div>
          <ol className="swoosh-steps">
            <li>Download the Transparent version of the badge</li>
            <li>Use a tool like Canva or Photoshop to overlay it on your LinkedIn headshot</li>
            <li>Upload the combined image as your LinkedIn profile photo</li>
            <li>Share your Champion status with your network!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
