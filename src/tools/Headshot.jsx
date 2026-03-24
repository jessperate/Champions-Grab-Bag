import { useState, useCallback, useRef } from 'react'
import './Headshot.css'

export default function Headshot() {
  const [originalImage, setOriginalImage]     = useState(null)  // data URL
  const [originalFile, setOriginalFile]       = useState(null)  // base64
  const [stippleImage, setStippleImage]       = useState(null)  // data URL result
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState(null)
  const [dragOver, setDragOver]               = useState(false)
  const fileInputRef                          = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setOriginalImage(dataUrl)
      // Extract base64 without prefix
      const base64 = dataUrl.split(',')[1]
      setOriginalFile(base64)
      setStippleImage(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  const handleGenerate = useCallback(async () => {
    if (!originalFile) return
    setLoading(true)
    setError(null)
    setStippleImage(null)
    try {
      const res = await fetch('/api/headshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: originalFile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      if (!data.imageBase64) throw new Error('No image returned from API')
      setStippleImage(`data:image/png;base64,${data.imageBase64}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [originalFile])

  const handleDownload = useCallback(() => {
    if (!stippleImage) return
    const a = document.createElement('a')
    a.download = 'airops-champion-stipple.png'
    a.href = stippleImage
    a.click()
  }, [stippleImage])

  return (
    <div className="headshot-page">
      <div className="headshot-inner">
        <div className="headshot-header">
          <h1 className="headshot-title">Headshot Generator</h1>
          <p className="headshot-subtitle">
            Upload your photo to create an AirOps Champion stipple portrait
          </p>
        </div>

        {/* Upload zone */}
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
            {/* Side-by-side comparison */}
            <div className="headshot-comparison">
              <div className="headshot-panel">
                <div className="headshot-panel-label">Original</div>
                <div className="headshot-panel-img-wrap">
                  <img src={originalImage} alt="Original" className="headshot-panel-img" />
                </div>
                <button
                  className="headshot-btn-secondary"
                  onClick={() => { setOriginalImage(null); setOriginalFile(null); setStippleImage(null); setError(null) }}
                >
                  ↺ Upload different photo
                </button>
              </div>

              <div className="headshot-arrow">→</div>

              <div className="headshot-panel">
                <div className="headshot-panel-label">Stipple Portrait</div>
                <div className={`headshot-panel-img-wrap${loading ? ' loading' : ''}`}>
                  {stippleImage ? (
                    <img src={stippleImage} alt="Stipple" className="headshot-panel-img" />
                  ) : loading ? (
                    <div className="headshot-generating">
                      <div className="headshot-spinner" />
                      <span>Generating stipple portrait…</span>
                    </div>
                  ) : (
                    <div className="headshot-placeholder">
                      <span>Click Generate to create your stipple portrait</span>
                    </div>
                  )}
                </div>
                {stippleImage && (
                  <button className="headshot-btn-primary" onClick={handleDownload}>
                    ↓ Download PNG
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="headshot-error">{error}</div>
            )}

            {!stippleImage && !loading && (
              <div className="headshot-actions">
                <button
                  className="headshot-btn-generate"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  Generate Stipple Portrait
                </button>
              </div>
            )}

            {stippleImage && (
              <div className="headshot-actions">
                <button className="headshot-btn-generate" onClick={handleGenerate} disabled={loading}>
                  ↻ Regenerate
                </button>
              </div>
            )}

            <p className="headshot-tip">
              Tip: Use this stipple image in your Champion Post for the full effect.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
