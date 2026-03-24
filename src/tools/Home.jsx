import { NavLink } from 'react-router-dom'
import './Home.css'

const TOOLS = [
  {
    path: '/champion-post',
    emoji: '🏆',
    name: 'Champion Post',
    desc: 'Create your "I\'m a Champion" LinkedIn post image',
  },
  {
    path: '/headshot',
    emoji: '✏️',
    name: 'Headshot',
    desc: 'Transform your photo into a stipple portrait',
  },
  {
    path: '/assets',
    emoji: '🎨',
    name: 'Assets',
    desc: 'Generate quote cards, title cards, and more',
  },
  {
    path: '/dataviz',
    emoji: '📊',
    name: 'Data Viz',
    desc: 'Create branded data visualization charts',
  },
  {
    path: '/swoosh',
    emoji: '🌿',
    name: 'Swoosh',
    desc: 'Download the AirOps Champion laurel wreath badge',
  },
]

export default function Home() {
  return (
    <div className="home">
      <div className="home-inner">
        <div className="home-header">
          <img src="/AirOpsLogo.svg" alt="AirOps" className="home-logo" />
          <h1 className="home-title">Champions Grab Bag</h1>
          <p className="home-subtitle">A toolkit for AirOps Champions. Pick a tool to get started.</p>
        </div>
        <div className="home-grid">
          {TOOLS.map(tool => (
            <NavLink key={tool.path} to={tool.path} className="home-card">
              <div className="home-card-icon">{tool.emoji}</div>
              <div className="home-card-name">{tool.name}</div>
              <div className="home-card-desc">{tool.desc}</div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
