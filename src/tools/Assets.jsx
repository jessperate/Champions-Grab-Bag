import { useState, useCallback, useEffect, useRef } from 'react'
import CanvasPreview from '../components/CanvasPreview'
import { loadFonts } from '../utils/loadFonts'
import { drawCanvas } from '../utils/drawCanvas'
import { drawTwitterCanvas } from '../utils/drawTwitterCanvas'
import { drawRichQuoteCanvas } from '../utils/drawRichQuoteCanvas'
import { drawTitleCardCanvas } from '../utils/drawTitleCardCanvas'
import { drawIJoinedCanvas } from '../utils/drawIJoinedCanvas'
import { generateFleuronFontDots } from '../utils/drawFleurons'
import { IJ_MODE_LABELS } from '../utils/drawIJoinedCanvas'
import '../components/Sidebar.css'

// ── Template picker
const TEMPLATES = [
  { value: 'quote',     label: 'Quote Block',  icon: '/Icon-BasicQuote.jpg'   },
  { value: 'richquote', label: 'Rich Quote',   icon: '/Icon-RichQuote.jpg'    },
  { value: 'titlecard', label: 'Title Card',   icon: '/Icon-TitleCard.jpg'    },
  { value: 'twitter',   label: 'Twitter Post', icon: '/Icon-Twitter.jpg'      },
  { value: 'ijoined',   label: 'I Joined',     icon: '/Icon-IJoined.jpg'      },
]

const MODE_LABELS = {
  green:        'Green Paper',
  pink:         'Pink Paper',
  yellow:       'Yellow Paper',
  blue:         'Blue Paper',
  'dark-green': 'Dark Green',
  'dark-pink':  'Dark Pink',
  'dark-yellow':'Dark Yellow',
  'dark-blue':  'Dark Blue',
}

const DIMS = [
  { w: 1080, h: 1080, label: '1080×1080', sub: 'Square' },
  { w: 1080, h: 1350, label: '1080×1350', sub: 'Portrait 4:5' },
  { w: 1080, h: 1920, label: '1080×1920', sub: 'Story 9:16' },
  { w: 1920, h: 1080, label: '1920×1080', sub: 'Landscape 16:9' },
]

const DEFAULT_SETTINGS = {
  templateType:     'quote',
  quote:            '\u201CThe most successful marketing teams in the AI era will be those who build content for how the internet actually works.\u201D',
  firstName:        'Nicole',
  lastName:         'Baer',
  roleCompany:      'CMO, Carta',
  ctaText:          'See AirOps in Action',
  colorMode:        'green',
  showCTA:          false,
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
  ijMode:            'night',
  ijName:            'Nicole Baer',
  ijRole:            'Marketing Strategist',
  ijShowHiring:      true,
  ijProfileImage:    null,
}

export default function Assets() {
  const [settings, setSettings]       = useState({ ...DEFAULT_SETTINGS })
  const [fontsReady, setFontsReady]   = useState(false)
  const [uiMode, setUiMode]           = useState('light')

  const profileImageRef      = useRef(null)
  const richProfileImageRef  = useRef(null)
  const richCompanyLogoRef   = useRef(null)
  const ijProfileImageRef    = useRef(null)
  const floraliaDotsRef      = useRef([])
  const [floraliaReady, setFloraliaReady] = useState(0)

  const fileInputRef      = useRef(null)
  const richPhotoInputRef = useRef(null)
  const richLogoInputRef  = useRef(null)
  const ijPhotoInputRef   = useRef(null)

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
      ijProfileImageRef.current   = portrait
      setSettings(prev => ({ ...prev, richProfileImage: '/GTMGen-NicoleBaerPortrait.jpg', ijProfileImage: '/GTMGen-NicoleBaerPortrait.jpg' }))
    }
    portrait.src = '/GTMGen-NicoleBaerPortrait.jpg'

    const logo = new Image()
    logo.onload = () => {
      richCompanyLogoRef.current = logo
      setSettings(prev => ({ ...prev, richCompanyLogo: '/GTMGen-carta_logo.svg.svg' }))
    }
    logo.src = '/GTMGen-carta_logo.svg.svg'
  }, [])

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'templateType' && ['quote', 'richquote'].includes(value) && next.colorMode.startsWith('dark-')) {
        next.colorMode = next.colorMode.replace('dark-', '')
      }
      if (key === 'templateType' && value === 'ijoined') {
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

  const handleRichProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) { richProfileImageRef.current = null; update('richProfileImage', null); return }
    const img = new Image()
    img.onload = () => { richProfileImageRef.current = img; update('richProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleRichCompanyLogoChange = useCallback((dataUrl) => {
    if (!dataUrl) { richCompanyLogoRef.current = null; update('richCompanyLogo', null); return }
    const img = new Image()
    img.onload = () => { richCompanyLogoRef.current = img; update('richCompanyLogo', dataUrl) }
    img.src = dataUrl
  }, [update])

  const handleIJProfileImageChange = useCallback((dataUrl) => {
    if (!dataUrl) { ijProfileImageRef.current = null; update('ijProfileImage', null); return }
    const img = new Image()
    img.onload = () => { ijProfileImageRef.current = img; update('ijProfileImage', dataUrl) }
    img.src = dataUrl
  }, [update])

  const draw = useCallback((canvas, s) => {
    if (s.templateType === 'twitter')        drawTwitterCanvas(canvas, s, fontsReady, profileImageRef.current, floraliaDotsRef.current)
    else if (s.templateType === 'richquote') drawRichQuoteCanvas(canvas, s, fontsReady, richProfileImageRef.current, richCompanyLogoRef.current)
    else if (s.templateType === 'titlecard') drawTitleCardCanvas(canvas, s, fontsReady, floraliaDotsRef.current)
    else if (s.templateType === 'ijoined')   drawIJoinedCanvas(canvas, s, fontsReady, ijProfileImageRef.current, floraliaDotsRef.current)
    else                                     drawCanvas(canvas, s, fontsReady)
  }, [fontsReady, floraliaReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const exportJpeg = useCallback((w, h, filename) => {
    const ew = w ?? settings.dims.w
    const eh = h ?? settings.dims.h
    const s  = { ...settings, dims: { w: ew, h: eh } }
    const ec = document.createElement('canvas')
    draw(ec, s)
    const prefix = settings.templateType === 'twitter'    ? 'airops-tweet'
      : settings.templateType === 'richquote'             ? 'airops-richquote'
      : settings.templateType === 'titlecard'             ? 'airops-titlecard'
      : settings.templateType === 'ijoined'               ? 'airops-ijoined'
      : 'airops-quote'
    const modeTag = settings.templateType === 'ijoined' ? settings.ijMode : settings.colorMode
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

          {/* I Joined */}
          {settings.templateType === 'ijoined' && <>
            <div className="sec">Content</div>
            <div className="field">
              <label>Full Name</label>
              <input type="text" value={settings.ijName} onChange={e => update('ijName', e.target.value)} />
            </div>
            <div className="field">
              <label>Role</label>
              <input type="text" value={settings.ijRole} onChange={e => update('ijRole', e.target.value)} />
            </div>
            <div className="tog-row">
              <label>(We're Hiring)</label>
              <label className="toggle">
                <input type="checkbox" checked={settings.ijShowHiring} onChange={e => update('ijShowHiring', e.target.checked)} />
                <div className="ttrack" /><div className="tthumb" />
              </label>
            </div>
            <div className="div" />
            <div className="sec">Photo</div>
            <div className="field">
              <input ref={ijPhotoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => handleIJProfileImageChange(ev.target.result)
                  reader.readAsDataURL(file); e.target.value = ''
                }}
              />
              <button className="btn-upload" onClick={() => ijPhotoInputRef.current?.click()}>
                {settings.ijProfileImage ? '↺ Replace Photo' : '↑ Upload Photo'}
              </button>
              {settings.ijProfileImage && (
                <button className="btn-clear-photo" onClick={() => handleIJProfileImageChange(null)}>✕ Remove photo</button>
              )}
            </div>
            <div className="div" />
            <div className="sec">Color Variant</div>
            <div className="mode-grid mode-grid-wide">
              {Object.entries(IJ_MODE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`mode-btn mode-ij-${key}${settings.ijMode === key ? ' active' : ''}`}
                  onClick={() => update('ijMode', key)}
                >
                  {label}
                </button>
              ))}
            </div>
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

          {/* Color Mode — not for I Joined (own palette) */}
          {settings.templateType !== 'ijoined' && <>
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
                </div>
              )
            })()}
            <div className="div" />
          </>}

          {/* Export Size */}
          <div className="sec">Export Size</div>
          <div className="dim-grid">
            {DIMS
              .filter(({ w, h }) => {
                if (settings.templateType === 'ijoined') return w === 1920 && h === 1080
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
          {settings.templateType !== 'ijoined' && (
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
