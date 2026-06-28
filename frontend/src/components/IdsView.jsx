import { useState, useEffect } from 'react'
import { Siren, Zap, Trash2, AlertTriangle, ShieldAlert, Skull, Waves, Search } from 'lucide-react'

const ATTACK_TYPES = [
  { id: 'sql_injection', label: 'SQL Injection', icon: Search, color: 'var(--red)', desc: 'Simulate SQL injection payload in HTTP request' },
  { id: 'syn_flood', label: 'SYN Flood', icon: Waves, color: 'var(--purple)', desc: 'Simulate rapid SYN packet storm' },
  { id: 'brute_force', label: 'SSH Brute Force', icon: Skull, color: 'var(--yellow)', desc: 'Simulate multiple failed SSH login attempts' },
  { id: 'port_scan', label: 'Port Scan', icon: ShieldAlert, color: 'var(--cyan)', desc: 'Simulate sequential TCP connect scan' },
]

function IdsView({ fetchWithAuth }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAlerts = async () => {
    try {
      const res = await fetchWithAuth('/api/ids/alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts()
    }, 0)
    const iv = setInterval(fetchAlerts, 3000)
    return () => {
      clearTimeout(timer)
      clearInterval(iv)
    }
  }, [])

  const simulateAttack = async (attackType) => {
    setLoading(true)
    try {
      await fetchWithAuth('/api/ids/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_type: attackType })
      })
      await fetchAlerts()
    } catch (err) {
      console.error('Failed to simulate attack:', err)
    }
    setLoading(false)
  }

  const clearAlerts = async () => {
    try {
      await fetchWithAuth('/api/ids/clear', { method: 'POST' })
      setAlerts([])
    } catch (err) {
      console.error('Failed to clear alerts:', err)
    }
  }

  const getSeverityIcon = (severity) => {
    const styles = {
      critical: { bg: 'var(--red-dim)', color: 'var(--red)' },
      high: { bg: 'rgba(255,140,0,0.15)', color: '#ff8c00' },
      medium: { bg: 'var(--yellow-dim)', color: 'var(--yellow)' },
      low: { bg: 'var(--blue-dim)', color: 'var(--blue)' }
    }
    const s = styles[severity] || styles.low
    return s
  }

  return (
    <div>
      {/* Attack Simulation Panel */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">
            <Zap size={16} className="card-icon" />
            Attack Simulation Panel
          </div>
          <button id="ids-clear-btn" className="btn btn-ghost btn-sm" onClick={clearAlerts}>
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Trigger simulated cyber attacks to test the Intrusion Detection System in real-time. Alerts will appear in the console below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {ATTACK_TYPES.map(atk => (
            <button
              key={atk.id}
              id={`ids-sim-${atk.id}`}
              onClick={() => simulateAttack(atk.id)}
              disabled={loading}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = atk.color
                e.currentTarget.style.boxShadow = `0 0 15px ${atk.color}33`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: `${atk.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: atk.color, flexShrink: 0
              }}>
                <atk.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {atk.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{atk.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Alert Console */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Siren size={16} className="card-icon" />
            IDS Alert Console
          </div>
          <span className="badge critical" style={{ animation: alerts.length > 0 ? 'pulse-glow 1.5s infinite' : 'none' }}>
            {alerts.length} ALERTS
          </span>
        </div>

        <div style={{ maxHeight: 'calc(100vh - 440px)', overflowY: 'auto' }}>
          {alerts.map((alert, idx) => {
            const sevStyle = getSeverityIcon(alert.severity)
            return (
              <div key={alert.id || idx} className="alert-item">
                <div
                  className="alert-severity-icon"
                  style={{ background: sevStyle.bg, color: sevStyle.color }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div className="alert-body">
                  <div className="alert-type" style={{ color: sevStyle.color }}>
                    {alert.type}
                    <span className={`badge ${alert.severity}`} style={{ marginLeft: 8 }}>{alert.severity}</span>
                  </div>
                  <div className="alert-desc">{alert.description}</div>
                  <div className="alert-meta">
                    <span>🌐 {alert.source_ip}</span>
                    <span>🕐 {alert.timestamp}</span>
                  </div>
                  {alert.payload && (
                    <div className="alert-payload">{alert.payload}</div>
                  )}
                </div>
              </div>
            )
          })}

          {alerts.length === 0 && (
            <div className="empty-state">
              <Siren size={48} style={{ opacity: 0.15 }} />
              <p style={{ marginTop: 12 }}>No security alerts. Use the simulation panel to generate test events.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IdsView
