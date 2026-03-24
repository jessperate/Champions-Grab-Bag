import { useState, useCallback, useEffect, useRef } from 'react'
import CanvasPreview from '../components/CanvasPreview'
import { loadFonts } from '../utils/loadFonts'
import { drawChampionPostCanvas } from '../utils/drawChampionPostCanvas'
import '../components/Sidebar.css'
import './ChampionPost.css'

const DEFAULT_SETTINGS = {
  firstName:      'Lucy',
  lastName:       'Hoyle',
  roleCompany:    'Senior Content Engineer, Carta',
  championQuote:  '\u201CContent engineering changed the trajectory of my career.\u201D',
  champColorMode: 'paper-light',
  champFlip:      false,
  dims:           { w: 1920, h: 1080 },
}

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
  const [settings, setSettings]     = useState({ ...DEFAULT_SETTINGS })
  const [fontsReady, setFontsReady] = useState(false)
  const profileImageRef             = useRef(null)
  const photoBgImageRef             = useRef(null)
  const companyLogoRef              = useRef(null)
  const photoInputRef               = useRef(null)
  const logoInputRef                = useRef(null)

  useEffect(() => {
    loadFonts().then(() => setFontsReady(true)).catch(() => {})
  }, [])

  // Preload the laurel-wreath background image
  useEffect(() => {
    const img = new Image()
    img.onload = () => { photoBgImageRef.current = img; setSettings(prev => ({ ...prev })) }
    img.src = '/ChampionPhotoBackground.png'
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handlePhotoChange = useCallback((dataUrl) => {
    if (!dataUrl) { profileImageRef.current = null; update('champProfileImage', null); return }
    const img = new Image()
    img.onload = () => { profileImageRef.current = img; update('champProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { companyLogoRef.current = null; update('champCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { companyLogoRef.current = img; update('champCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    drawChampionPostCanvas(canvas, s, fontsReady, profileImageRef.current, photoBgImageRef.current, companyLogoRef.current)
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
