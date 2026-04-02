import { useState, useCallback, useEffect, useRef } from 'react'
import CanvasPreview from '../components/CanvasPreview'
import { loadFonts } from '../utils/loadFonts'
import { drawCanvas } from '../utils/drawCanvas'
import { drawTwitterCanvas } from '../utils/drawTwitterCanvas'
import { drawRichQuoteCanvas } from '../utils/drawRichQuoteCanvas'
import { drawTitleCardCanvas } from '../utils/drawTitleCardCanvas'
import { drawAnnouncementCanvas } from '../utils/drawAnnouncementCanvas'
import { generateFleuronFontDots } from '../utils/drawFleurons'
import { generateBrandModes } from '../utils/brandPalette'
import '../components/Sidebar.css'

// ── Template picker
const TEMPLATES = [
  { value: 'announcement', label: 'Announcement', icon: '/Icon-Announcement.svg' },
  { value: 'quote',        label: 'Quote Block',  icon: '/Icon-BasicQuote.jpg'   },
  { value: 'richquote',    label: 'Rich Quote',   icon: '/Icon-RichQuote.jpg'    },
  { value: 'titlecard',    label: 'Title Card',   icon: '/Icon-TitleCard.jpg'    },
  { value: 'twitter',      label: 'Twitter Post', icon: '/Icon-Twitter.jpg'      },
]

const MODE_LABELS = {
  green:          'Green Paper',
  pink:           'Pink Paper',
  yellow:         'Yellow Paper',
  blue:           'Blue Paper',
  'dark-green':   'Dark Green',
  'dark-pink':    'Dark Pink',
  'dark-yellow':  'Dark Yellow',
  'dark-blue':    'Dark Blue',
  'custom-light': 'Brand Light',
  'custom-dark':  'Brand Dark',
}

const DIMS = [
  { w: 1080, h: 1080, label: '1080×1080', sub: 'Square' },
  { w: 1080, h: 1350, label: '1080×1350', sub: 'Portrait 4:5' },
  { w: 1080, h: 1920, label: '1080×1920', sub: 'Story 9:16' },
  { w: 1920, h: 1080, label: '1920×1080', sub: 'Landscape 16:9' },
]

const ANN_COLOR_MODES = [
  { key: 'paper-light', label: 'Paper Light' },
  { key: 'paper-dark',  label: 'Paper Dark'  },
  { key: 'mint',        label: 'Mint'         },
]
const ANN_BRAND_MODES = [
  { key: 'custom-light', label: 'Brand Light' },
  { key: 'custom-dark',  label: 'Brand Dark'  },
  { key: 'custom-mint',  label: 'Brand Mint'  },
]

function compressImageToBase64(dataUrl, maxPx, quality) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', quality).split(',')[1])
    }
    img.src = dataUrl
  })
}

// Strip near-white background from a stipple dataUrl (Gemini returns white bg)
function removeWhiteFromDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const id = ctx.getImageData(0, 0, c.width, c.height)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) d[i + 3] = 0
      }
      ctx.putImageData(id, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

const DEFAULT_SETTINGS = {
  templateType:     'quote',
  quote:            '\u201CThe most successful marketing teams in the AI era will be those who build content for how the internet actually works.\u201D',
  firstName:        'Nicole',
  lastName:         'Baer',
  roleCompany:      'CMO, Carta',
  ctaText:          'See AirOps in Action',
  colorMode:        'green',
  showCTA:          false,
  quoteCompanyLogo: null,
  dims:             { w: 1920, h: 1080 },
  tweetText:        "Giving AI to sales and marketing teams is easy. Giving AI to the operating layer of revenue is hard, that's why AirOps will quietly create more enterprise value than most flashy AI tools.",
  tweetAuthorName:  'Sushil Krishna',
  tweetAuthorHandle:'@ksushil7',
  tweetDate:        '2:47 AM · Feb 24, 2026',
  tweetProfileImage: null,
  showFloralia:       true,
  richQuoteText:    '\u201CThe most successful marketing teams in the AI era will be those who build content for how the internet actually works.\u201D',
  richFirstName:    'Nicole',
  richLastName:     'Baer',
  richRoleCompany:  'CMO, Carta',
  richProfileImage:  null,
  richCompanyLogo:   null,
  richFlip:          false,
  tcEyebrow:         'Deadline extended',
  tcShowEyebrow:     true,
  tcSerifTitle:      'Submit your',
  tcShowSerifTitle:  true,
  tcSansTitle:       'workflow',
  tcShowSansTitle:   true,
  tcEmphasizeSans:   true,
  tcSubheadline:     'Friday @7pm EST',
  tcShowSubheadline: true,
  tcBody:            '\u201CLLM-sourced traffic has better time-to-conversions and sessions-to-conversions than organic traffic from Google.\u201D',
  tcShowBody:        false,
  tcShowLogo:        false,
  tcCTAText:         'See AirOps in Action',
  tcShowCTA:         false,
  decorationStyle:    'fill',
  decorationRotation: 0,
  // Announcement
  annFirstName:      'Lucy',
  annLastName:       'Hoyle',
  annRole:           'Senior Content Engineer',
  annColorMode:      'paper-light',
  annProfileImage:   null,
  brandColor:        '',
  annCompanyLogo:    null,
}

export default function Assets() {
  const [settings, setSettings]       = useState({ ...DEFAULT_SETTINGS })
  const [fontsReady, setFontsReady]   = useState(false)
  const [uiMode, setUiMode]           = useState('light')

  const profileImageRef      = useRef(null)
  const richProfileImageRef  = useRef(null)
  const richCompanyLogoRef   = useRef(null)
  const annProfileImageRef   = useRef(null)
  const annPhotoBgRef        = useRef(null)
  const annWreathRef         = useRef(null)
  const annAirOpsLogoRef     = useRef(null)
  const lockupImageRef       = useRef(null)
  const quoteCompanyLogoRef  = useRef(null)
  const quoteLogoInputRef    = useRef(null)
  const annCompanyLogoRef    = useRef(null)
  const annOriginalUrlRef    = useRef(null)
  const annStippleUrlRef     = useRef(null)
  const richOriginalUrlRef   = useRef(null)
  const richStippleUrlRef    = useRef(null)
  const floraliaDotsRef      = useRef([])
  const [floraliaReady, setFloraliaReady] = useState(0)
  const [annStippleLoading, setAnnStippleLoading] = useState(false)
  const [annStippleError, setAnnStippleError]     = useState(null)
  const [annUsingStipple, setAnnUsingStipple]     = useState(false)
  const [richStippleLoading, setRichStippleLoading] = useState(false)
  const [richStippleError, setRichStippleError]     = useState(null)
  const [richUsingStipple, setRichUsingStipple]     = useState(false)

  const fileInputRef      = useRef(null)
  const richPhotoInputRef = useRef(null)
  const richLogoInputRef  = useRef(null)
  const annPhotoInputRef  = useRef(null)
  const annLogoInputRef   = useRef(null)

  useEffect(() => {
    loadFonts().then(() => setFontsReady(true)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!fontsReady) return
    floraliaDotsRef.current = generateFleuronFontDots()
    setFloraliaReady(v => v + 1)
  }, [fontsReady])

  useEffect(() => {
    const portrait = new Image()
    portrait.onload = () => {
      richProfileImageRef.current = portrait
      setSettings(prev => ({ ...prev, richProfileImage: '/GTMGen-NicoleBaerPortrait.jpg' }))
    }
    portrait.src = '/GTMGen-NicoleBaerPortrait.jpg'

    const logo = new Image()
    logo.onload = () => {
      richCompanyLogoRef.current = logo
      setSettings(prev => ({ ...prev, richCompanyLogo: '/GTMGen-carta_logo.svg.svg' }))
    }
    logo.src = '/GTMGen-carta_logo.svg.svg'
  }, [])

  useEffect(() => {
    const bg = new Image()
    bg.onload = () => { annPhotoBgRef.current = bg; setSettings(prev => ({ ...prev })) }
    bg.src = '/ChampionPhotoBackground.png'
  }, [])

  useEffect(() => {
    const w = new Image()
    w.onload = () => { annWreathRef.current = w; setSettings(prev => ({ ...prev })) }
    w.src = '/ChampionWordmarkWreath.svg'
  }, [])

  useEffect(() => {
    const logo = new Image()
    logo.onload = () => { annAirOpsLogoRef.current = logo; setSettings(prev => ({ ...prev })) }
    logo.src = '/AirOpsLogoGreen.svg'
  }, [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => { lockupImageRef.current = img; setSettings(prev => ({ ...prev })) }
    img.src = '/ao_champion_lockup.svg'
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'templateType' && ['quote', 'richquote'].includes(value) && next.colorMode.startsWith('dark-') && !next.colorMode.startsWith('custom-')) {
        next.colorMode = next.colorMode.replace('dark-', '')
      }
      if (key === 'templateType' && value === 'announcement') {
        next.dims = { w: 1920, h: 1080 }
      }
      return next
    })
  }, [])

  const handleRefleuron = useCallback(() => {
    if (!fontsReady) return
    floraliaDotsRef.current = generateFleuronFontDots()
    setSettings(prev => ({ ...prev, showFloralia: true }))
    setFloraliaReady(v => v + 1)
  }, [fontsReady])

  const handleProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) { profileImageRef.current = null; update('tweetProfileImage', null); return }
    const img = new Image()
    img.onload = () => { profileImageRef.current = img; update('tweetProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const loadRichPhoto = useCallback((dataUrl) => {
    if (!dataUrl) { richProfileImageRef.current = null; update('richProfileImage', null); return }
    const img = new Image()
    img.onload = () => { richProfileImageRef.current = img; update('richProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleRichProfileImageChange = useCallback(async (dataUrl) => {
    if (!dataUrl) {
      richOriginalUrlRef.current = null
      richStippleUrlRef.current = null
      setRichUsingStipple(false)
      setRichStippleError(null)
      setRichStippleLoading(false)
      loadRichPhoto(null)
      return
    }
    richOriginalUrlRef.current = dataUrl
    richStippleUrlRef.current = null
    setRichUsingStipple(false)
    setRichStippleError(null)
    loadRichPhoto(dataUrl)

    setRichStippleLoading(true)
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
      const stippleNoBg = await removeWhiteFromDataUrl(stippleUrl)
      richStippleUrlRef.current = stippleNoBg
      loadRichPhoto(stippleNoBg)
      setRichUsingStipple(true)
    } catch (e) {
      setRichStippleError(e.message)
    } finally {
      setRichStippleLoading(false)
    }
  }, [loadRichPhoto])

  const handleRichUseOriginal = useCallback(() => {
    loadRichPhoto(richOriginalUrlRef.current)
    setRichUsingStipple(false)
  }, [loadRichPhoto])

  const handleRichUseStipple = useCallback(() => {
    if (richStippleUrlRef.current) {
      loadRichPhoto(richStippleUrlRef.current)
      setRichUsingStipple(true)
    }
  }, [loadRichPhoto])

  const handleQuoteLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { quoteCompanyLogoRef.current = null; update('quoteCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { quoteCompanyLogoRef.current = img; update('quoteCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleRichCompanyLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { richCompanyLogoRef.current = null; update('richCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { richCompanyLogoRef.current = img; update('richCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const loadAnnPhoto = useCallback((dataUrl) => {
    return new Promise((resolve) => {
      if (!dataUrl) { annProfileImageRef.current = null; update('annProfileImage', null); resolve(); return }
      const img = new Image()
      img.onload  = () => { annProfileImageRef.current = img; update('annProfileImage', dataUrl); resolve() }
      img.onerror = () => resolve()
      img.src = dataUrl
    })
  }, [update])

  const handleAnnPhotoChange = useCallback(async (dataUrl) => {
    if (!dataUrl) {
      annOriginalUrlRef.current = null
      annStippleUrlRef.current = null
      setAnnUsingStipple(false)
      setAnnStippleError(null)
      setAnnStippleLoading(false)
      loadAnnPhoto(null)
      return
    }
    annOriginalUrlRef.current = dataUrl
    annStippleUrlRef.current = null
    setAnnUsingStipple(false)
    setAnnStippleError(null)

    // Load original into canvas first, then start stipple generation
    await loadAnnPhoto(dataUrl)

    setAnnStippleLoading(true)
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
      const stippleNoBg = await removeWhiteFromDataUrl(stippleUrl)
      annStippleUrlRef.current = stippleNoBg
      loadAnnPhoto(stippleNoBg)
      setAnnUsingStipple(true)
    } catch (e) {
      setAnnStippleError(e.message)
    } finally {
      setAnnStippleLoading(false)
    }
  }, [loadAnnPhoto])

  const handleAnnUseOriginal = useCallback(() => {
    loadAnnPhoto(annOriginalUrlRef.current)
    setAnnUsingStipple(false)
  }, [loadAnnPhoto])

  const handleAnnUseStipple = useCallback(() => {
    if (annStippleUrlRef.current) {
      loadAnnPhoto(annStippleUrlRef.current)
      setAnnUsingStipple(true)
    }
  }, [loadAnnPhoto])

  const handleAnnLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { annCompanyLogoRef.current = null; update('annCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { annCompanyLogoRef.current = img; update('annCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    const sm = s.brandColor ? { ...s, brandModes: generateBrandModes(s.brandColor) } : s
    if (sm.templateType === 'announcement')   drawAnnouncementCanvas(canvas, sm, fontsReady, annProfileImageRef.current, annPhotoBgRef.current, annCompanyLogoRef.current, annWreathRef.current, annAirOpsLogoRef.current)
    else if (sm.templateType === 'twitter')   drawTwitterCanvas(canvas, sm, fontsReady, profileImageRef.current, floraliaDotsRef.current, lockupImageRef.current)
    else if (sm.templateType === 'richquote') drawRichQuoteCanvas(canvas, sm, fontsReady, richProfileImageRef.current, richCompanyLogoRef.current, lockupImageRef.current)
    else if (sm.templateType === 'titlecard') drawTitleCardCanvas(canvas, sm, fontsReady, floraliaDotsRef.current, lockupImageRef.current)
    else                                      drawCanvas(canvas, sm, fontsReady, lockupImageRef.current, quoteCompanyLogoRef.current)
  }, [fontsReady, floraliaReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportJpeg = useCallback((w, h, filename) => {
    const ew = w ?? settings.dims.w
    const eh = h ?? settings.dims.h
    const s  = { ...settings, dims: { w: ew, h: eh } }
    const ec = document.createElement('canvas')
    draw(ec, s)
    const prefix = settings.templateType === 'announcement' ? 'airops-announcement'
      : settings.templateType === 'twitter'                 ? 'airops-tweet'
      : settings.templateType === 'richquote'               ? 'airops-richquote'
      : settings.templateType === 'titlecard'               ? 'airops-titlecard'
      : 'airops-quote'
    const modeTag = settings.templateType === 'announcement'  ? settings.annColorMode
      : settings.colorMode
    const a = document.createElement('a')
    a.download = filename ?? `${prefix}-${modeTag}-${ew}x${eh}.jpg`
    a.href = ec.toDataURL('image/jpeg', 0.95)
    a.click()
  }, [settings, draw])

  const exportAll = useCallback(() => {
    const presets = [[1080, 1080, 'sq'], [1080, 1350, 'p45'], [1080, 1920, 's916'], [1920, 1080, 'l169']]
    const prefix = settings.templateType === 'twitter'    ? 'airops-tweet'
      : settings.templateType === 'richquote'             ? 'airops-richquote'
      : settings.templateType === 'titlecard'             ? 'airops-titlecard'
      : 'airops-quote'
    presets.forEach(([w, h, label], i) => {
      setTimeout(() => exportJpeg(w, h, `${prefix}-${settings.colorMode}-${label}-${w}x${h}.jpg`), i * 350)
    })
  }, [exportJpeg, settings.colorMode, settings.templateType])

  const { dims } = settings

  return (
    <div className={`app${uiMode === 'light' ? ' light' : ' dark'}`}>
      {/* ── Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-gtmgen" role="img" aria-label="AirOps" />
        </div>

        <div className="sidebar-body">
          {/* Template Type */}
          <div className="sec" style={{ display: 'flex', justifyContent: 'space-between' }}>
            Asset Type
            <span style={{ fontFamily: "'Saans Mono', 'DM Mono', monospace" }}>{TEMPLATES.length}</span>
          </div>
          <div className="asset-picker">
            {TEMPLATES.map(t => (
              <button
                key={t.value}
                className={`asset-card${settings.templateType === t.value ? ' active' : ''}`}
                onClick={() => update('templateType', t.value)}
              >
                <div className="asset-card-img">
                  <img src={t.icon} alt={t.label} draggable={false} />
                </div>
                <span className="asset-card-name">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="div" />

          {/* Announcement */}
          {settings.templateType === 'announcement' && <>
            <div className="sec">Content</div>
            <div className="field">
              <label>First Name</label>
              <input type="text" value={settings.annFirstName} onChange={e => update('annFirstName', e.target.value)} />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" value={settings.annLastName} onChange={e => update('annLastName', e.target.value)} />
            </div>
            <div className="field">
              <label>Title</label>
              <input type="text" value={settings.annRole} onChange={e => update('annRole', e.target.value)} />
            </div>
            <div className="div" />
            <div className="sec">Photo</div>
            <div className="field">
              <input
                ref={annPhotoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  handleAnnPhotoChange(URL.createObjectURL(file))
                  e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => annPhotoInputRef.current?.click()}>
                {settings.annProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
              </button>
              {settings.annProfileImage && (
                <button className="btn-clear-photo" onClick={() => handleAnnPhotoChange(null)}>✕ Remove photo</button>
              )}
            </div>
            {settings.annProfileImage && (
              <div className="field">
                {annStippleLoading && (
                  <div style={{ fontSize: 11, color: 'var(--label)', marginBottom: 4 }}>
                    ⏳ Generating stipple effect…
                  </div>
                )}
                {!annStippleLoading && annStippleUrlRef.current && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`dim-btn${annUsingStipple ? ' active' : ''}`}
                      style={{ flex: 1, fontSize: 11 }}
                      onClick={handleAnnUseStipple}
                    >
                      Stipple
                    </button>
                    <button
                      className={`dim-btn${!annUsingStipple ? ' active' : ''}`}
                      style={{ flex: 1, fontSize: 11 }}
                      onClick={handleAnnUseOriginal}
                    >
                      Original
                    </button>
                  </div>
                )}
                {annStippleError && (
                  <div style={{ fontSize: 11, color: '#cc3333', marginTop: 4 }}>
                    ⚠ {annStippleError}
                  </div>
                )}
              </div>
            )}
            <div className="div" />
            <div className="sec">Company Logo</div>
            <div className="field">
              <label>Logo (SVG, PNG — dark/black version)</label>
              <input
                ref={annLogoInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => handleAnnLogoChange(ev.target.result)
                  reader.readAsDataURL(file); e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => annLogoInputRef.current?.click()}>
                {settings.annCompanyLogo ? '↺ Replace Logo' : '↑ Upload Logo'}
              </button>
              {settings.annCompanyLogo && (
                <button className="btn-clear-photo" onClick={() => handleAnnLogoChange(null)}>✕ Remove logo</button>
              )}
            </div>
            <div className="div" />
            <div className="sec">Color Mode</div>
            <div className="dim-grid">
              {ANN_COLOR_MODES.map(m => (
                <button
                  key={m.key}
                  className={`dim-btn${settings.annColorMode === m.key ? ' active' : ''}`}
                  onClick={() => update('annColorMode', m.key)}
                >
                  {m.label}
                </button>
              ))}
              {settings.brandColor && ANN_BRAND_MODES.map(m => (
                <button
                  key={m.key}
                  className={`dim-btn brand-mode-btn${settings.annColorMode === m.key ? ' active' : ''}`}
                  style={{ '--brand-color': settings.brandColor }}
                  onClick={() => update('annColorMode', m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="div" />
          </>}

          {/* Quote Block */}
          {settings.templateType === 'quote' && <>
            <div className="sec">Content</div>
            <div className="field">
              <label>Quote</label>
              <textarea value={settings.quote} onChange={e => update('quote', e.target.value)} />
            </div>
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
            <div className="field">
              <label>CTA Text</label>
              <input type="text" value={settings.ctaText} onChange={e => update('ctaText', e.target.value)} />
            </div>
            <div className="div" />
            <div className="sec">Options</div>
            <div className="tog-row">
              <label>Show CTA pill</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.showCTA} onChange={e => update('showCTA', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            <div className="field">
              <label>Company Logo</label>
              <input
                ref={quoteLogoInputRef}
                type="file"
                accept="image/svg+xml,image/png,image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const url = URL.createObjectURL(file)
                  handleQuoteLogoChange(url)
                  e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => quoteLogoInputRef.current?.click()}>
                {settings.quoteCompanyLogo ? '↺ Replace Logo' : '↑ Upload Logo'}
              </button>
              {settings.quoteCompanyLogo && (
                <button className="btn-upload" style={{ marginTop: 4 }} onClick={() => handleQuoteLogoChange(null)}>
                  ✕ Remove
                </button>
              )}
            </div>
            <div className="div" />
          </>}

          {/* Rich Quote */}
          {settings.templateType === 'richquote' && <>
            <div className="sec">Quote</div>
            <div className="field">
              <label>Quote Text</label>
              <textarea value={settings.richQuoteText} onChange={e => update('richQuoteText', e.target.value)} />
            </div>
            <div className="div" />
            <div className="sec">Speaker</div>
            <div className="field">
              <label>First Name</label>
              <input type="text" value={settings.richFirstName} onChange={e => update('richFirstName', e.target.value)} />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" value={settings.richLastName} onChange={e => update('richLastName', e.target.value)} />
            </div>
            <div className="field">
              <label>Title &amp; Company</label>
              <input type="text" value={settings.richRoleCompany} onChange={e => update('richRoleCompany', e.target.value)} />
            </div>
            <div className="field">
              <label>Headshot Photo</label>
              <input ref={richPhotoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => handleRichProfileImageChange(ev.target.result)
                  reader.readAsDataURL(file); e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => richPhotoInputRef.current?.click()}>
                {settings.richProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
              </button>
              {settings.richProfileImage && (
                <button className="btn-clear-photo" onClick={() => handleRichProfileImageChange(null)}>✕ Remove photo</button>
              )}
            </div>
            {settings.richProfileImage && (
              <div className="field">
                {richStippleLoading && (
                  <div style={{ fontSize: 11, color: 'var(--label)', marginBottom: 4 }}>⏳ Generating stipple effect…</div>
                )}
                {!richStippleLoading && richStippleUrlRef.current && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className={`dim-btn${richUsingStipple ? ' active' : ''}`} style={{ flex: 1, fontSize: 11 }} onClick={handleRichUseStipple}>Stipple</button>
                    <button className={`dim-btn${!richUsingStipple ? ' active' : ''}`} style={{ flex: 1, fontSize: 11 }} onClick={handleRichUseOriginal}>Original</button>
                  </div>
                )}
                {richStippleError && (
                  <div style={{ fontSize: 11, color: '#cc3333', marginTop: 4 }}>⚠ {richStippleError}</div>
                )}
              </div>
            )}
            <div className="div" />
            <div className="sec">Company Logo</div>
            <div className="field">
              <label>Logo (SVG or PNG)</label>
              <input ref={richLogoInputRef} type="file" accept="image/svg+xml,image/png,image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => handleRichCompanyLogoChange(ev.target.result)
                  reader.readAsDataURL(file); e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => richLogoInputRef.current?.click()}>
                {settings.richCompanyLogo ? '↺ Replace Logo' : '↑ Upload Logo'}
              </button>
              {settings.richCompanyLogo && (
                <button className="btn-clear-photo" onClick={() => handleRichCompanyLogoChange(null)}>✕ Remove logo</button>
              )}
            </div>
            <div className="div" />
            <div className="tog-row">
              <label>Flip Layout</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.richFlip ?? false} onChange={e => update('richFlip', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            <div className="div" />
          </>}

          {/* Title Card */}
          {settings.templateType === 'titlecard' && <>
            <div className="sec">Content</div>
            <div className="tog-row">
              <label>Logo &amp; CTA</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowLogo} onChange={e => { update('tcShowLogo', e.target.checked); update('tcShowCTA', e.target.checked) }} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            <div className="tog-row">
              <label>Eyebrow</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowEyebrow} onChange={e => update('tcShowEyebrow', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.tcShowEyebrow && (
              <div className="field"><input type="text" value={settings.tcEyebrow} onChange={e => update('tcEyebrow', e.target.value)} /></div>
            )}
            <div className="tog-row">
              <label>Serif Title</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowSerifTitle} onChange={e => update('tcShowSerifTitle', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.tcShowSerifTitle && (
              <div className="field"><input type="text" value={settings.tcSerifTitle} onChange={e => update('tcSerifTitle', e.target.value)} /></div>
            )}
            <div className="tog-row">
              <label>Sans Title</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowSansTitle} onChange={e => update('tcShowSansTitle', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.tcShowSansTitle && (
              <div className="field"><input type="text" value={settings.tcSansTitle} onChange={e => update('tcSansTitle', e.target.value)} /></div>
            )}
            {settings.tcShowSansTitle && (
              <div className="tog-row">
                <label>Emphasize Sans</label>
                <label className="toggle">
                  <input type="checkbox" checked={settings.tcEmphasizeSans ?? false} onChange={e => update('tcEmphasizeSans', e.target.checked)} />
                  <div className="ttrack" /><div className="tthumb" />
                </label>
              </div>
            )}
            <div className="tog-row">
              <label>Subheadline</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowSubheadline} onChange={e => update('tcShowSubheadline', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.tcShowSubheadline && (
              <div className="field"><input type="text" value={settings.tcSubheadline} onChange={e => update('tcSubheadline', e.target.value)} /></div>
            )}
            <div className="tog-row">
              <label>Body</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.tcShowBody} onChange={e => update('tcShowBody', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.tcShowBody && (
              <div className="field"><textarea value={settings.tcBody} onChange={e => update('tcBody', e.target.value)} /></div>
            )}
            {settings.tcShowCTA && (
              <div className="field">
                <label>CTA Text</label>
                <input type="text" value={settings.tcCTAText} onChange={e => update('tcCTAText', e.target.value)} />
              </div>
            )}
            <div className="div" />
            <div className="sec">Decoration</div>
            <div className="tog-row">
              <label>Decoration</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.showFloralia && (
              <div style={{ paddingLeft: 12 }}>
                <div className="tog-row">
                  <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                    <div className="ttrack" /><div className="tthumb" />
                  </label>
                </div>
                <button className="btn-all" onClick={handleRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
              </div>
            )}
            <div className="div" />
          </>}

          {/* Twitter Post */}
          {settings.templateType === 'twitter' && <>
            <div className="sec">Tweet Content</div>
            <div className="field">
              <label>Tweet Text</label>
              <textarea value={settings.tweetText} onChange={e => update('tweetText', e.target.value)} />
            </div>
            <div className="div" />
            <div className="sec">Author</div>
            <div className="field">
              <label>Name</label>
              <input type="text" value={settings.tweetAuthorName} onChange={e => update('tweetAuthorName', e.target.value)} />
            </div>
            <div className="field">
              <label>Handle</label>
              <input type="text" placeholder="@username" value={settings.tweetAuthorHandle} onChange={e => update('tweetAuthorHandle', e.target.value)} />
            </div>
            <div className="field">
              <label>Profile Photo</label>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => handleProfileImageChange(ev.target.result)
                  reader.readAsDataURL(file); e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                {settings.tweetProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
              </button>
              {settings.tweetProfileImage && (
                <button className="btn-clear-photo" onClick={() => handleProfileImageChange(null)}>✕ Remove photo</button>
              )}
            </div>
            <div className="field">
              <label>Date &amp; Time</label>
              <input type="text" placeholder="2:47 AM · Feb 24, 2026" value={settings.tweetDate} onChange={e => update('tweetDate', e.target.value)} />
            </div>
            <div className="div" />
            <div className="sec">Options</div>
            <div className="tog-row">
              <label>Show CTA pill</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.showCTA} onChange={e => update('showCTA', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.showCTA && (
              <div className="field">
                <label>CTA Text</label>
                <input type="text" value={settings.ctaText} onChange={e => update('ctaText', e.target.value)} />
              </div>
            )}
            <div className="tog-row">
              <label>Decoration</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.showFloralia} onChange={e => update('showFloralia', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            {settings.showFloralia && (
              <div style={{ paddingLeft: 12 }}>
                <div className="tog-row">
                  <label>Fill style — {settings.decorationStyle === 'inverted' ? 'Negative' : 'Positive'}</label>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.decorationStyle === 'inverted'} onChange={e => update('decorationStyle', e.target.checked ? 'inverted' : 'fill')} />
                    <div className="ttrack" /><div className="tthumb" />
                  </label>
                </div>
                <button className="btn-all" onClick={handleRefleuron} disabled={!fontsReady}>↻ Redecorate</button>
              </div>
            )}
            <div className="div" />
          </>}


          {/* Color Mode — not for Announcement (own palette) */}
          {settings.templateType !== 'announcement' && <>
            <div className="sec">Color Mode</div>
            {(() => {
              const modes = ['twitter', 'titlecard'].includes(settings.templateType)
                ? ['green', 'pink', 'yellow', 'blue', 'dark-green', 'dark-pink', 'dark-yellow', 'dark-blue']
                : ['green', 'pink', 'yellow', 'blue']
              return (
                <div className="mode-grid mode-grid-wide">
                  {modes.map(m => (
                    <button
                      key={m}
                      className={`mode-btn mode-${m}${settings.colorMode === m ? ' active' : ''}`}
                      onClick={() => update('colorMode', m)}
                    >
                      {MODE_LABELS[m].split(' ')[0]}<br />{MODE_LABELS[m].split(' ')[1]}
                    </button>
                  ))}
                  {settings.brandColor && ['custom-light', 'custom-dark'].map(m => (
                    <button
                      key={m}
                      className={`mode-btn brand-mode-btn${settings.colorMode === m ? ' active' : ''}`}
                      style={{ '--brand-color': settings.brandColor }}
                      onClick={() => update('colorMode', m)}
                    >
                      {MODE_LABELS[m].split(' ')[0]}<br />{MODE_LABELS[m].split(' ')[1]}
                    </button>
                  ))}
                </div>
              )
            })()}
            <div className="div" />
          </>}

          {/* Brand Color */}
          <div className="sec">Brand Color</div>
          <div className="field brand-color-field">
            <input
              type="color"
              className="brand-color-picker"
              value={settings.brandColor || '#008c44'}
              onChange={e => update('brandColor', e.target.value)}
            />
            <input
              type="text"
              className="brand-color-hex"
              placeholder="#rrggbb"
              value={settings.brandColor}
              maxLength={7}
              onChange={e => {
                const v = e.target.value
                update('brandColor', v)
              }}
            />
            {settings.brandColor && (
              <button className="btn-clear-photo" onClick={() => update('brandColor', '')}>✕</button>
            )}
          </div>
          <div className="div" />

          {/* Export Size */}
          <div className="sec">Export Size</div>
          <div className="dim-grid">
            {DIMS
              .filter(({ w, h }) => {
                if (settings.templateType === 'announcement') return w === 1920 && h === 1080
                return true
              })
              .map(({ w, h, label, sub }) => (
                <button
                  key={label}
                  className={`dim-btn${dims.w === w && dims.h === h ? ' active' : ''}`}
                  onClick={() => update('dims', { w, h })}
                >
                  {label}<span className="dim-sub">{sub}</span>
                </button>
              ))}
          </div>

          <div className="div" />

          <button className="btn-ex" onClick={() => exportJpeg()}>↓ Export JPEG</button>
          {settings.templateType !== 'announcement' && (
            <button className="btn-all" onClick={exportAll}>↓ Export All 4 Sizes</button>
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="tog-row">
            <label>Light Mode</label>
            <label className="toggle">
              <input type="checkbox" checked={uiMode === 'light'} onChange={() => setUiMode(m => m === 'dark' ? 'light' : 'dark')} />
              <div className="ttrack" /><div className="tthumb" />
            </label>
          </div>
        </div>
      </div>

      <CanvasPreview settings={settings} fontsReady={fontsReady} draw={draw} />
    </div>
  )
}
