import { useState, useCallback, useEffect, useRef } from 'react'
import CanvasPreview from '../components/CanvasPreview'
import { loadFonts } from '../utils/loadFonts'
import { drawAnnouncementCanvas } from '../utils/drawAnnouncementCanvas'
import { generateBrandModes } from '../utils/brandPalette'
import '../components/Sidebar.css'
import './ChampionPost.css'

function compressImageToBase64(dataUrl, maxPx, quality) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.src = dataUrl
  })
}

const DEFAULT_SETTINGS = {
  firstName:      'Jordan',
  lastName:       'Miller',
  roleCompany:    'Senior Content Engineer, Carta',
  championQuote:  '\u201CContent engineering changed the trajectory of my career.\u201D',
  champColorMode: 'paper-light',
  champFlip:      false,
  brandColor:     '',
  dims:           { w: 1920, h: 1080 },
}

const CUSTOM_COLOR_MODES = [
  { key: 'custom-light', label: 'Brand Light' },
  { key: 'custom-dark',  label: 'Brand Dark'  },
  { key: 'custom-mint',  label: 'Brand Mint'  },
]

const COLOR_MODES = [
  { key: 'paper-light', label: 'Paper Light' },
  { key: 'paper-dark',  label: 'Paper Dark'  },
  { key: 'mint',        label: 'Mint'         },
]

const DIMS = [
  { w: 1920, h: 1080, label: '1920×1080', sub: 'LinkedIn Landscape' },
  { w: 1080, h: 1080, label: '1080×1080', sub: 'Square'             },
]

export default function ChampionPost() {
  const [settings, setSettings]         = useState({ ...DEFAULT_SETTINGS })
  const [fontsReady, setFontsReady]     = useState(false)
  const [brandColorDraft, setBrandColorDraft] = useState(null)
  const [stippleLoading, setStippleLoading] = useState(false)
  const [stippleError, setStippleError] = useState(null)
  const [usingStipple, setUsingStipple] = useState(false)
  const profileImageRef                 = useRef(null)
  const companyLogoRef                  = useRef(null)
  const lockupImageRef                  = useRef(null)
  const laurelFrameRef                  = useRef(null)
  const photoInputRef                   = useRef(null)
  const logoInputRef                    = useRef(null)
  const originalPhotoUrlRef             = useRef(null)
  const stipplePhotoUrlRef              = useRef(null)

  useEffect(() => {
    loadFonts().then(() => setFontsReady(true)).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/HeadshotLaurelsOnly.svg')
      .then(r => r.text())
      .then(text => {
        const blob = new Blob([text], { type: 'image/svg+xml' })
        const url  = URL.createObjectURL(blob)
        const img  = new Image()
        img.onload = () => { laurelFrameRef.current = img; URL.revokeObjectURL(url); setSettings(prev => ({ ...prev })) }
        img.src = url
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => { lockupImageRef.current = img; setSettings(prev => ({ ...prev })) }
    img.src = '/ao_champion_lockup.svg'
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const loadPhotoIntoCanvas = useCallback((dataUrl) => {
    if (!dataUrl) { profileImageRef.current = null; update('champProfileImage', null); return }
    const img = new Image()
    img.onload = () => { profileImageRef.current = img; update('champProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handlePhotoChange = useCallback(async (dataUrl) => {
    if (!dataUrl) {
      originalPhotoUrlRef.current = null
      stipplePhotoUrlRef.current = null
      setUsingStipple(false)
      setStippleError(null)
      setStippleLoading(false)
      loadPhotoIntoCanvas(null)
      return
    }

    // Show original immediately
    originalPhotoUrlRef.current = dataUrl
    stipplePhotoUrlRef.current = null
    setUsingStipple(false)
    setStippleError(null)
    loadPhotoIntoCanvas(dataUrl)

    // Auto-run stipple in background
    setStippleLoading(true)
    try {
      const base64 = await compressImageToBase64(dataUrl, 1024, 0.85)
      const res = await fetch('/api/headshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (!data.imageBase64) throw new Error('No image returned')
      const stippleUrl = `data:image/png;base64,${data.imageBase64}`
      stipplePhotoUrlRef.current = stippleUrl
      loadPhotoIntoCanvas(stippleUrl)
      setUsingStipple(true)
    } catch (e) {
      setStippleError(e.message)
    } finally {
      setStippleLoading(false)
    }
  }, [loadPhotoIntoCanvas])

  const handleUseOriginal = useCallback(() => {
    loadPhotoIntoCanvas(originalPhotoUrlRef.current)
    setUsingStipple(false)
  }, [loadPhotoIntoCanvas])

  const handleUseStipple = useCallback(() => {
    if (stipplePhotoUrlRef.current) {
      loadPhotoIntoCanvas(stipplePhotoUrlRef.current)
      setUsingStipple(true)
    }
  }, [loadPhotoIntoCanvas])

  const handleLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { companyLogoRef.current = null; update('champCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { companyLogoRef.current = img; update('champCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    const sm = s.brandColor ? { ...s, brandModes: generateBrandModes(s.brandColor) } : s
    const mapped = {
      ...sm,
      annFirstName: sm.firstName,
      annLastName:  sm.lastName,
      annRole:      sm.roleCompany,
      annQuote:     sm.championQuote,
      annColorMode: sm.champColorMode,
    }
    drawAnnouncementCanvas(canvas, mapped, fontsReady, profileImageRef.current, laurelFrameRef.current, companyLogoRef.current, lockupImageRef.current)
  }, [fontsReady])

  const exportJpeg = useCallback(() => {
    const { w, h } = settings.dims
    const ec = document.createElement('canvas')
    draw(ec, { ...settings, dims: { w, h } })
    const a = document.createElement('a')
    a.download = `champion-post-${settings.champColorMode}-${w}x${h}.jpg`
    a.href = ec.toDataURL('image/jpeg', 0.95)
    a.click()
  }, [settings, draw])

  return (
    <div className="app light">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <span style={{ fontFamily: "'Saans Mono', monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--label)' }}>
            Champion Post
          </span>
        </div>

        <div className="sidebar-body">

          {/* Content */}
          <div className="sec">Content</div>

          <div className="field">
            <label>First Name</label>
            <input type="text" value={settings.firstName} onChange={e => update('firstName', e.target.value)} />
          </div>

          <div className="field">
            <label>Last Name</label>
            <input type="text" value={settings.lastName} onChange={e => update('lastName', e.target.value)} />
          </div>

          <div className="field">
            <label>Role &amp; Company</label>
            <input type="text" value={settings.roleCompany} onChange={e => update('roleCompany', e.target.value)} />
          </div>

          <div className="div" />

          {/* Champion Quote */}
          <div className="sec">Champion Quote</div>

          <div className="field">
            <label>Quote Text</label>
            <textarea
              value={settings.championQuote}
              onChange={e => update('championQuote', e.target.value)}
              style={{ minHeight: 100 }}
            />
          </div>

          <div className="div" />

          {/* Photo */}
          <div className="sec">Photo</div>

          <div className="field">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => handlePhotoChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => photoInputRef.current?.click()}>
              {settings.champProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
            </button>
            {settings.champProfileImage && (
              <button className="btn-clear-photo" onClick={() => handlePhotoChange(null)}>
                ✕ Remove photo
              </button>
            )}
          </div>

          {settings.champProfileImage && (
            <div className="field">
              {stippleLoading && (
                <div style={{ fontSize: 11, color: 'var(--label)', marginBottom: 4 }}>
                  ⏳ Generating stipple effect…
                </div>
              )}
              {!stippleLoading && stipplePhotoUrlRef.current && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`dim-btn${usingStipple ? ' active' : ''}`}
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={handleUseStipple}
                  >
                    Stipple
                  </button>
                  <button
                    className={`dim-btn${!usingStipple ? ' active' : ''}`}
                    style={{ flex: 1, fontSize: 11 }}
                    onClick={handleUseOriginal}
                  >
                    Original
                  </button>
                </div>
              )}
              {stippleError && (
                <div style={{ fontSize: 11, color: '#cc3333', marginTop: 4 }}>
                  ⚠ {stippleError}
                </div>
              )}
            </div>
          )}

          <div className="div" />

          {/* Company Logo */}
          <div className="sec">Company Logo</div>

          <div className="field">
            <label>Logo (SVG, PNG — dark/black version)</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = ev => handleLogoChange(ev.target.result)
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            <button className="btn-upload" onClick={() => logoInputRef.current?.click()}>
              {settings.champCompanyLogo ? '↺ Replace Logo' : '↑ Upload Logo'}
            </button>
            {settings.champCompanyLogo && (
              <button className="btn-clear-photo" onClick={() => handleLogoChange(null)}>
                ✕ Remove logo
              </button>
            )}
          </div>

          <div className="div" />

          {/* Layout */}
          <div className="sec">Layout</div>

          <div className="tog-row">
            <label>Flip Layout</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.champFlip}
                onChange={e => update('champFlip', e.target.checked)}
              />
              <div className="ttrack" />
              <div className="tthumb" />
            </label>
          </div>

          <div className="div" />

          {/* Brand Color */}
          <div className="sec">Brand Color</div>
          <div className="brand-color-field">
            <input
              type="color"
              className="brand-color-picker"
              value={settings.brandColor || '#008c44'}
              onChange={e => {
                update('brandColor', e.target.value)
                if (!settings.champColorMode.startsWith('custom-')) update('champColorMode', 'custom-light')
              }}
            />
            <input
              type="text"
              className="brand-color-hex"
              value={brandColorDraft !== null ? brandColorDraft : (settings.brandColor || '')}
              placeholder="#hex"
              onFocus={() => setBrandColorDraft(settings.brandColor || '')}
              onChange={e => setBrandColorDraft(e.target.value)}
              onBlur={e => {
                const v = e.target.value
                setBrandColorDraft(null)
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  update('brandColor', v)
                  if (!settings.champColorMode.startsWith('custom-')) update('champColorMode', 'custom-light')
                } else if (v === '') {
                  update('brandColor', '')
                  if (settings.champColorMode.startsWith('custom-')) update('champColorMode', 'paper-light')
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
            />
            {settings.brandColor && (
              <button className="brand-color-clear" onClick={() => {
                setBrandColorDraft('')
                if (settings.champColorMode.startsWith('custom-')) update('champColorMode', 'paper-light')
                update('brandColor', '')
              }}>✕</button>
            )}
          </div>

          <div className="div" />

          {/* Color Mode */}
          <div className="sec">Color Mode</div>

          <div className="dim-grid">
            {COLOR_MODES.map(m => (
              <button
                key={m.key}
                className={`dim-btn champ-mode-${m.key}${settings.champColorMode === m.key ? ' active' : ''}`}
                onClick={() => update('champColorMode', m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {settings.brandColor && (
            <div className="dim-grid" style={{ marginTop: 6 }}>
              {CUSTOM_COLOR_MODES.map(m => (
                <button
                  key={m.key}
                  className={`dim-btn brand-mode-btn${settings.champColorMode === m.key ? ' active' : ''}`}
                  style={{ '--brand-color': settings.brandColor }}
                  onClick={() => update('champColorMode', m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="div" />

          {/* Export Size */}
          <div className="sec">Export Size</div>

          <div className="dim-grid">
            {DIMS.map(({ w, h, label, sub }) => (
              <button
                key={label}
                className={`dim-btn${settings.dims.w === w && settings.dims.h === h ? ' active' : ''}`}
                onClick={() => update('dims', { w, h })}
              >
                {label}<span className="dim-sub">{sub}</span>
              </button>
            ))}
          </div>

          <div className="div" />

          <button className="btn-ex" onClick={exportJpeg} disabled={!fontsReady}>
            ↓ Export JPEG
          </button>

        </div>
      </div>

      {/* Canvas Preview */}
      <CanvasPreview
        settings={{ ...settings, templateType: 'champion-post', colorMode: settings.champColorMode, ijMode: 'paper' }}
        fontsReady={fontsReady}
        draw={draw}
      />
    </div>
  )
}
