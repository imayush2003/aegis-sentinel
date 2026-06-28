import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Activity, Wifi, Search, Hash, AlertTriangle,
  LayoutDashboard, Radar, Network, Globe, Lock, Siren,
  Terminal, MapPin, LogOut, User, KeyRound, Eye, EyeOff
} from 'lucide-react'
import Dashboard from './components/Dashboard'
import SnifferView from './components/SnifferView'
import ScannerView from './components/ScannerView'
import OsintView from './components/OsintView'
import CrackerView from './components/CrackerView'
import IdsView from './components/IdsView'
import GeneratorView from './components/GeneratorView'
import GeoIpView from './components/GeoIpView'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'overview' },
  { id: 'sniffer', label: 'Packet Sniffer', icon: Wifi, section: 'tools' },
  { id: 'scanner', label: 'Port Scanner', icon: Radar, section: 'tools' },
  { id: 'osint', label: 'OSINT Recon', icon: Globe, section: 'tools' },
  { id: 'geoip', label: 'Intel Map', icon: MapPin, section: 'tools' },
  { id: 'cracker', label: 'Hash Cracker', icon: Lock, section: 'tools' },
  { id: 'generator', label: 'Payload Generator', icon: Terminal, section: 'tools' },
  { id: 'ids', label: 'IDS Alerts', icon: Siren, section: 'security' },
]

// --- Login Screen Component ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const token = btoa(`${username}:${password}`)
      const res = await fetch('/api/auth/verify', {
        headers: { 'Authorization': `Basic ${token}` }
      })
      if (res.ok) {
        onLogin(username, token)
      } else {
        setError('Invalid username or password.')
      }
    } catch {
      setError('Cannot connect to API server.')
    }
    setLoading(false)
  }

  return (
    <div className="login-screen">
      <div className="scanline-overlay" />
      <div className="login-container">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Shield size={28} />
          </div>
          <h1>AEGIS SENTINEL</h1>
          <p>Cybersecurity Command Console</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label><User size={12} /> Username</label>
            <input
              id="login-username"
              className="input-field"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-input-group">
            <label><KeyRound size={12} /> Password</label>
            <div className="login-password-wrap">
              <input
                id="login-password"
                className="input-field"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            id="login-submit"
            className="btn btn-primary login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Access Terminal'}
          </button>
        </form>

        <div className="login-footer">
          <span>Secure access required • HTTP Basic Auth</span>
        </div>
      </div>
    </div>
  )
}

// --- Main App ---
function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [apiOnline, setApiOnline] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  const [authUser, setAuthUser] = useState(null)

  const handleLogin = (username, token) => {
    setAuthToken(token)
    setAuthUser(username)
  }

  const handleLogout = () => {
    setAuthToken(null)
    setAuthUser(null)
    setActivePage('dashboard')
  }

  // Create a fetch wrapper that includes auth headers
  const fetchWithAuth = useCallback((url, options = {}) => {
    if (!authToken) return fetch(url, options)
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Basic ${authToken}`,
      },
    })
  }, [authToken])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          setApiOnline(true)
        } else {
          setApiOnline(false)
        }
      } catch {
        setApiOnline(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  // Show login screen if not authenticated
  if (!authToken) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const currentNav = NAV_ITEMS.find(n => n.id === activePage)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard apiOnline={apiOnline} fetchWithAuth={fetchWithAuth} />
      case 'sniffer': return <SnifferView fetchWithAuth={fetchWithAuth} />
      case 'scanner': return <ScannerView fetchWithAuth={fetchWithAuth} />
      case 'osint': return <OsintView fetchWithAuth={fetchWithAuth} />
      case 'geoip': return <GeoIpView fetchWithAuth={fetchWithAuth} />
      case 'cracker': return <CrackerView fetchWithAuth={fetchWithAuth} />
      case 'generator': return <GeneratorView fetchWithAuth={fetchWithAuth} />
      case 'ids': return <IdsView fetchWithAuth={fetchWithAuth} />
      default: return <Dashboard apiOnline={apiOnline} fetchWithAuth={fetchWithAuth} />
    }
  }

  const sections = {
    overview: NAV_ITEMS.filter(n => n.section === 'overview'),
    tools: NAV_ITEMS.filter(n => n.section === 'tools'),
    security: NAV_ITEMS.filter(n => n.section === 'security'),
  }

  return (
    <div className="app-layout">
      <div className="scanline-overlay" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Shield size={20} />
            </div>
            <div>
              <h1>AEGIS SENTINEL</h1>
              <span className="version">v1.0.0</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Overview</div>
          {sections.overview.map(item => (
            <div
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="nav-icon" size={18} />
              {item.label}
            </div>
          ))}

          <div className="nav-section-label">Recon Tools</div>
          {sections.tools.map(item => (
            <div
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="nav-icon" size={18} />
              {item.label}
            </div>
          ))}

          <div className="nav-section-label">Security</div>
          {sections.security.map(item => (
            <div
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="nav-icon" size={18} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="api-status">
            <span className={`status-dot ${apiOnline ? '' : 'offline'}`} />
            {apiOnline ? 'API Connected' : 'API Offline'}
          </div>
          <div className="sidebar-user-row">
            <span className="sidebar-user"><User size={12} /> {authUser}</span>
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header">
          <h2>
            {currentNav && <currentNav.icon size={20} />}
            {currentNav?.label || 'Dashboard'}
          </h2>
          <span className="header-badge">
            {apiOnline ? '● SYSTEM ONLINE' : '○ OFFLINE MODE'}
          </span>
        </header>

        <div className="content-body">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
