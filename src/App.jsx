import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import ChampionPost from './tools/ChampionPost'
import Headshot from './tools/Headshot'
import Assets from './tools/Assets'
import DataViz from './tools/DataViz'
import Swoosh from './tools/Swoosh'
import Home from './tools/Home'
import './App.css'

function Nav() {
  const tools = [
    { path: '/champion-post', label: 'Champion Post' },
    { path: '/headshot', label: 'Headshot' },
    { path: '/assets', label: 'Assets' },
    { path: '/dataviz', label: 'Data Viz' },
    { path: '/swoosh', label: 'Swoosh' },
  ]
  return (
    <nav className="app-nav">
      <NavLink to="/" className="app-nav-logo">
        <img src="/AirOpsLogo.svg" alt="AirOps" height="20" />
        <span className="app-nav-title">Champions Grab Bag</span>
      </NavLink>
      <div className="app-nav-links">
        {tools.map(t => (
          <NavLink
            key={t.path}
            to={t.path}
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Nav />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/champion-post" element={<ChampionPost />} />
            <Route path="/headshot" element={<Headshot />} />
            <Route path="/assets/*" element={<Assets />} />
            <Route path="/dataviz" element={<DataViz />} />
            <Route path="/swoosh" element={<Swoosh />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
