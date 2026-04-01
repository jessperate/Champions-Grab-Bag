import { NavLink } from 'react-router-dom'
import './Home.css'

const TOOLS = [
  {
    path: '/champion-post',
    icon: 'ri-trophy-line',
    name: 'Champion Post',
    desc: 'Create your "I\'m a Champion" LinkedIn post image',
  },
  {
    path: '/headshot',
    icon: 'ri-user-smile-line',
    name: 'Headshot',
    desc: 'Transform your photo into a stipple portrait',
  },
  {
    path: '/assets',
    icon: 'ri-layout-grid-line',
    name: 'Assets',
    desc: 'Generate quote cards, title cards, and more',
  },
  {
    path: '/dataviz',
    icon: 'ri-bar-chart-box-line',
    name: 'Data Viz',
    desc: 'Create branded data visualization charts',
  },
  {
    path: '/swoosh',
    icon: 'ri-leaf-line',
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
              <div className="home-card-icon"><i className={tool.icon} /></div>
              <div className="home-card-name">{tool.name}</div>
              <div className="home-card-desc">{tool.desc}</div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
