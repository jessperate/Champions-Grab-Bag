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

export default function Swoosh() {
  return (
    <div className="swoosh-page">
      <div className="swoosh-inner">
        <div className="swoosh-header">
          <h1 className="swoosh-title">Champion Badge</h1>
          <p className="swoosh-subtitle">
            Download the AirOps Champion laurel wreath badge to overlay on your LinkedIn profile photo
          </p>
        </div>

        <div className="swoosh-variants">
          {VARIANTS.map(v => (
            <div key={v.key} className="swoosh-variant">
              <div className="swoosh-variant-label">{v.label}</div>
              <div className="swoosh-img-wrap">
                <img src={v.src} alt={`${v.label} badge`} className="swoosh-img" draggable={false} />
              </div>
              <button
                className="swoosh-download-btn"
                onClick={() => handleDownload(v.src, v.file)}
              >
                ↓ Download {v.label}
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
