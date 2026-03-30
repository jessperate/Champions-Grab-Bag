import { useState, useCallback, useRef } from 'react'
import './Headshot.css'

const SIZE = 1080

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function compositeWithLaurel(stippleDataUrl) {
  const [laurel, stipple] = await Promise.all([
    loadImage('/ChampionPhotoBackground.png'),
    loadImage(stippleDataUrl),
  ])

  const c = document.createElement('canvas')
  c.width = SIZE; c.height = SIZE
  const ctx = c.getContext('2d')

  // Draw stipple first
  const scale = (SIZE * 0.95) / (stipple.naturalWidth || 1)
  const iw = stipple.naturalWidth  * scale
  const ih = stipple.naturalHeight * scale
  const px = (SIZE - iw) / 2
  const py = SIZE * 0.05
  ctx.drawImage(stipple, px, py, iw, ih)

  // Draw laurel in foreground so leaves appear over the stipple
  const bgAspect = laurel.naturalWidth / laurel.naturalHeight
  let bw, bh
  if (bgAspect > 1) { bh = SIZE; bw = SIZE * bgAspect }
  else              { bw = SIZE; bh = SIZE / bgAspect }
  ctx.drawImage(laurel, (SIZE - bw) / 2, (SIZE - bh) / 2, bw, bh)

  return c.toDataURL('image/png')
}

export default function Headshot() {
  const [originalImage, setOriginalImage] = useState(null)
  const [compositeImage, setCompositeImage] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const originalFileRef         = useRef(null)
  const fileInputRef            = useRef(null)

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setOriginalImage(dataUrl)
      setCompositeImage(null)
      setError(null)
      originalFileRef.current = dataUrl

      // Auto-generate on upload
      setLoading(true)
      try {
        const base64 = await compressImageToBase64(dataUrl, 1024, 0.85)
        const res = await fetch('/api/headshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
        if (!data.imageBase64) throw new Error('No image returned from API')
        const stippleUrl = `data:image/png;base64,${data.imageBase64}`
        const composite = await compositeWithLaurel(stippleUrl)
        setCompositeImage(composite)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRegenerate = useCallback(async () => {
    if (!originalFileRef.current) return
    setLoading(true)
    setError(null)
    setCompositeImage(null)
    try {
      const base64 = await compressImageToBase64(originalFileRef.current, 1024, 0.85)
      const res = await fetch('/api/headshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (!data.imageBase64) throw new Error('No image returned from API')
      const stippleUrl = `data:image/png;base64,${data.imageBase64}`
      const composite = await compositeWithLaurel(stippleUrl)
      setCompositeImage(composite)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  const handleDownload = useCallback(() => {
    if (!compositeImage) return
    const a = document.createElement('a')
    a.download = 'airops-champion-portrait.png'
    a.href = compositeImage
    a.click()
  }, [compositeImage])

  return (
    <div className="headshot-page">
      <div className="headshot-inner">
        <div className="headshot-header">
          <h1 className="headshot-title">Headshot Generator</h1>
          <p className="headshot-subtitle">
            Upload your photo to create an AirOps Champion stipple portrait
          </p>
        </div>

        {!originalImage ? (
          <div
            className={`headshot-dropzone${dragOver ? ' over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="headshot-dropzone-icon">↑</div>
            <div className="headshot-dropzone-label">Drop your photo here or click to upload</div>
            <div className="headshot-dropzone-sub">PNG, JPG, WEBP — best results with a clear headshot on plain background</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
            />
          </div>
        ) : (
          <>
            <div className="headshot-comparison">
              <div className="headshot-panel">
                <div className="headshot-panel-label">Original</div>
                <div className="headshot-panel-img-wrap">
                  <img src={originalImage} alt="Original" className="headshot-panel-img" />
                </div>
                <button
                  className="headshot-btn-secondary"
                  onClick={() => { setOriginalImage(null); setCompositeImage(null); setError(null); originalFileRef.current = null }}
                >
                  ↺ Upload different photo
                </button>
              </div>

              <div className="headshot-arrow">→</div>

              <div className="headshot-panel">
                <div className="headshot-panel-label">Champion Portrait</div>
                <div className={`headshot-panel-img-wrap${loading ? ' loading' : ''}`}>
                  {compositeImage ? (
                    <img src={compositeImage} alt="Champion Portrait" className="headshot-panel-img" />
                  ) : loading ? (
                    <div className="headshot-generating">
                      <div className="headshot-spinner" />
                      <span>Generating portrait…</span>
                    </div>
                  ) : (
                    <div className="headshot-placeholder">
                      <span>Generating portrait…</span>
                    </div>
                  )}
                </div>
                {compositeImage && (
                  <button className="headshot-btn-primary" onClick={handleDownload}>
                    ↓ Download PNG
                  </button>
                )}
              </div>
            </div>

            {error && <div className="headshot-error">⚠ {error}</div>}

            {compositeImage && (
              <div className="headshot-actions">
                <button className="headshot-btn-generate" onClick={handleRegenerate} disabled={loading}>
                  ↻ Regenerate
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
