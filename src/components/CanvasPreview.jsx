import { useRef, useEffect, useState, useCallback } from 'react'
import { MODES } from '../utils/drawCanvas'
import { IJ_MODE_LABELS } from '../utils/drawIJoinedCanvas'
import './CanvasPreview.css'

const MODE_LABELS = {
  green: 'Green Paper', pink: 'Pink Paper', yellow: 'Yellow Paper', blue: 'Blue Paper',
  'dark-green': 'Dark Green', 'dark-pink': 'Dark Pink', 'dark-yellow': 'Dark Yellow', 'dark-blue': 'Dark Blue',
  'paper-light': 'Paper Light', 'paper-dark': 'Paper Dark', 'mint': 'Mint',
}
const TEMPLATE_LABELS = { quote: 'Quote Block', richquote: 'Rich Quote', titlecard: 'Title Card', twitter: 'Twitter Post', certificate: 'Certificate', ijoined: 'I Joined', 'champion-post': 'Champion Post' }

export default function CanvasPreview({ settings, fontsReady, draw, overlayFields }) {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const [scale, setScale]       = useState(1)
  const [activeField, setActiveField] = useState(null)

  const updateScale = useCallback(() => {
    if (!containerRef.current) return
    const { width, height } = containerRef.current.getBoundingClientRect()
    const maxW = width  - 48
    const maxH = height - 48
    const { w, h } = settings.dims
    setScale(Math.min(maxW / w, maxH / h, 1))
  }, [settings.dims])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { w, h } = settings.dims
    draw(canvas, { ...settings, dpr })
    canvas.style.width  = `${w}px`
    canvas.style.height = `${h}px`
  }, [settings, draw])

  // Dismiss active field when pressing Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setActiveField(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const { w, h } = settings.dims

  return (
    <div className="canvas-area">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <span className="tl">Preview</span>
        <span className="dbadge">{w} × {h}</span>
        <span className="mbadge">{TEMPLATE_LABELS[settings.templateType] ?? settings.templateType} · {settings.templateType === 'ijoined' ? IJ_MODE_LABELS[settings.ijMode] : (MODE_LABELS[settings.colorMode] ?? settings.colorMode)}</span>
        <span className={`fpill${fontsReady ? ' ready' : ''}`}>
          {fontsReady ? 'Fonts ready' : 'Loading fonts…'}
        </span>
        <svg className="toolbar-logo" viewBox="0 0 784 252" fill="none">
          <path d="M111.828 65.6415V88.4663C101.564 72.0112 85.627 61.9258 65.9084 61.9258C23.7703 61.9258 0 92.9782 0 134.647C0 176.581 24.0404 208.695 66.4487 208.695C86.1672 208.695 101.834 198.609 111.828 182.154V204.979H144.782V65.6415H111.828ZM72.9315 181.093C48.8911 181.093 35.1152 159.064 35.1152 134.647C35.1152 110.76 48.621 89.7933 73.4717 89.7933C94.0006 89.7933 111.558 104.391 111.558 134.116C111.558 163.31 94.8109 181.093 72.9315 181.093Z" fill="currentColor"/>
          <path d="M173.137 65.6494V204.987H208.252V65.6494H173.137Z" fill="currentColor"/>
          <path d="M272.998 100.141V65.6386H237.883V204.976H272.998V125.355C272.998 104.919 287.314 96.691 300.82 96.691C308.653 96.691 316.757 98.8143 321.079 100.407V63.25C298.119 63.25 279.211 76.7856 272.998 100.141Z" fill="currentColor"/>
          <path d="M329.629 108.115C329.629 151.377 359.882 182.163 403.371 182.163C447.13 182.163 477.115 151.377 477.115 108.115C477.115 65.6507 447.13 35.3945 403.371 35.3945C359.882 35.3945 329.629 65.6507 329.629 108.115ZM441.997 108.115C441.997 135.187 427.141 154.561 403.371 154.561C379.33 154.561 364.744 135.187 364.744 108.115C364.744 82.1058 379.33 63.2621 403.371 63.2621C427.141 63.2621 441.997 82.1058 441.997 108.115Z" fill="currentColor"/>
          <path d="M575.086 61.9258C554.557 61.9258 537.81 73.869 528.896 92.9782V65.6415H493.781V251.425H528.896V180.031C538.891 197.282 557.529 208.695 577.247 208.695C615.604 208.695 642.345 179.235 642.345 137.035C642.345 92.7128 614.523 61.9258 575.086 61.9258ZM568.874 182.685C545.374 182.685 528.896 163.31 528.896 135.708C528.896 107.31 545.374 87.4047 568.874 87.4047C591.293 87.4047 607.23 107.841 607.23 136.77C607.23 163.841 591.293 182.685 568.874 182.685Z" fill="currentColor"/>
          <path d="M653.555 156.675C653.555 181.889 676.244 208.695 721.624 208.695C767.274 208.695 783.751 182.42 783.751 161.983C783.751 130.666 746.205 125.092 721.084 120.315C704.066 117.395 693.262 115.007 693.262 105.452C693.262 94.5706 705.417 87.6701 718.383 87.6701C735.94 87.6701 742.693 99.6133 743.233 112.353H778.349C778.349 91.6511 763.492 61.9258 717.572 61.9258C677.865 61.9258 658.147 83.9544 658.147 107.575C658.147 141.282 696.233 144.732 721.354 149.509C735.94 152.163 748.636 155.348 748.636 165.699C748.636 176.05 736.21 182.95 722.975 182.95C710.549 182.95 688.67 176.05 688.67 156.675H653.555Z" fill="currentColor"/>
          <path d="M191.339 48.6576C176.921 48.6576 166.578 38.4949 166.578 24.6368C166.578 10.7786 176.921 0 191.339 0C205.13 0 216.1 10.7786 216.1 24.6368C216.1 38.4949 205.13 48.6576 191.339 48.6576Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Canvas display */}
      <div className="canvas-wrap" ref={containerRef}>
        <div
          className="canvas-scaler"
          style={{ width: w * scale, height: h * scale }}
          onClick={() => setActiveField(null)}
        >
          <canvas
            ref={canvasRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          />

          {overlayFields && overlayFields.map(f => {
            const isActive = activeField === f.key
            return (
              <div
                key={f.key}
                className={`cof${f.isPhoto ? ' cof-photo' : ''}${isActive ? ' cof-active' : ''}`}
                style={{
                  left:   Math.round(f.x * scale),
                  top:    Math.round(f.y * scale),
                  width:  Math.round(f.w * scale),
                  height: Math.round(f.h * scale),
                }}
                onClick={e => {
                  e.stopPropagation()
                  if (f.isPhoto) { f.onPhotoClick?.(); return }
                  setActiveField(f.key)
                }}
              >
                {f.isPhoto && (
                  <div className="cof-upload-hint">
                    <span className="cof-upload-icon">↑</span>
                    <span className="cof-upload-label">Upload photo</span>
                  </div>
                )}
                {isActive && !f.isPhoto && (
                  f.multiline ? (
                    <textarea
                      className="cof-input"
                      value={f.value}
                      onChange={e => { e.stopPropagation(); f.onChange(e.target.value) }}
                      onBlur={() => setActiveField(null)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <input
                      type="text"
                      className="cof-input"
                      value={f.value}
                      onChange={e => { e.stopPropagation(); f.onChange(e.target.value) }}
                      onBlur={() => setActiveField(null)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
