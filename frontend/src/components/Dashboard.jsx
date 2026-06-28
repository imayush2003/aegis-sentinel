import { useState, useEffect } from 'react'
import { Activity, Wifi, Shield, AlertTriangle, Eye, Server } from 'lucide-react'

function Dashboard({ apiOnline, fetchWithAuth }) {
  const [snifferStatus, setSnifferStatus] = useState(null)
  const [idsAlerts, setIdsAlerts] = useState([])
  const [packetRates, setPacketRates] = useState([0, 0, 0, 0, 0, 0, 0, 0])
  const [threatScore, setThreatScore] = useState(24)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sniffRes, idsRes] = await Promise.all([
          fetchWithAuth('/api/sniffer/status'),
          fetchWithAuth('/api/ids/alerts')
        ])
        if (sniffRes.ok) {
          const data = await sniffRes.json()
          setSnifferStatus(data)
        }
        if (idsRes.ok) {
          const data = await idsRes.json()
          setIdsAlerts(data.alerts || [])
          // Generate threat score from alert severities
          const criticals = data.alerts.filter(a => a.severity === 'critical').length
          const highs = data.alerts.filter(a => a.severity === 'high').length
          setThreatScore(Math.min(95, 15 + criticals * 20 + highs * 10))
        }
      } catch {
        // Offline mode - use default states
      }
    }
    fetchData()
    const iv = setInterval(fetchData, 5000)
    return () => clearInterval(iv)
  }, [])

  // Animate packet rates
  useEffect(() => {
    const iv = setInterval(() => {
      setPacketRates(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 80) + 20]
        return next
      })
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  const maxRate = Math.max(...packetRates, 1)

  // Radar blip positions
  const blips = [
    { top: '25%', left: '60%' },
    { top: '65%', left: '30%' },
    { top: '40%', left: '75%' },
    { top: '55%', left: '55%' },
    { top: '30%', left: '40%' },
  ]

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon cyan"><Wifi size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{snifferStatus?.total_captured || 0}</div>
            <div className="stat-label">Packets Captured</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Eye size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{snifferStatus?.mode || 'Idle'}</div>
            <div className="stat-label">Sniffer Mode</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{idsAlerts.length}</div>
            <div className="stat-label">IDS Alerts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Shield size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{apiOnline ? 'Active' : 'Offline'}</div>
            <div className="stat-label">System Status</div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Radar */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={16} className="card-icon" />
              Network Monitoring Radar
            </div>
            <span className="badge open" style={{ animation: 'pulse-glow 2s infinite' }}>SCANNING</span>
          </div>
          <div className="radar-container">
            <div className="radar-ring r1" />
            <div className="radar-ring r2" />
            <div className="radar-ring r3" />
            <div className="radar-sweep" />
            <div className="radar-center-dot" />
            {blips.map((b, i) => (
              <div key={i} className="radar-blip" style={{ top: b.top, left: b.left, animationDelay: `${i * 0.4}s` }} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Interface: {snifferStatus?.interface || 'Awaiting connection...'}
          </div>
        </div>

        {/* Packet Rate Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={16} className="card-icon" />
              Packet Rate (live)
            </div>
          </div>
          <div className="chart-container">
            <svg viewBox="0 0 400 160" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 40, 80, 120, 160].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(0,240,255,0.06)" strokeWidth="1" />
              ))}
              {/* Area fill */}
              <polygon
                points={
                  packetRates.map((v, i) => `${i * (400 / (packetRates.length - 1))},${160 - (v / maxRate) * 140}`).join(' ') +
                  ` 400,160 0,160`
                }
                fill="url(#areaGrad)"
              />
              {/* Line */}
              <polyline
                points={packetRates.map((v, i) => `${i * (400 / (packetRates.length - 1))},${160 - (v / maxRate) * 140}`).join(' ')}
                fill="none"
                stroke="var(--cyan)"
                strokeWidth="2"
              />
              {/* Dots */}
              {packetRates.map((v, i) => (
                <circle
                  key={i}
                  cx={i * (400 / (packetRates.length - 1))}
                  cy={160 - (v / maxRate) * 140}
                  r="3"
                  fill="var(--cyan)"
                  style={{ filter: 'drop-shadow(0 0 4px var(--cyan))' }}
                />
              ))}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(0,240,255,0.2)" />
                  <stop offset="100%" stopColor="rgba(0,240,255,0)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>{packetRates[packetRates.length - 1]} pkts/interval</span>
            <span>Peak: {maxRate}</span>
          </div>
        </div>
      </div>

      {/* Threat Score & Recent Alerts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Shield size={16} className="card-icon" />
              Threat Level
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 130,
              height: 130,
              borderRadius: '50%',
              border: `4px solid ${threatScore > 60 ? 'var(--red)' : threatScore > 30 ? 'var(--yellow)' : 'var(--green)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              margin: '0 auto',
              boxShadow: `0 0 30px ${threatScore > 60 ? 'rgba(255,56,96,0.3)' : threatScore > 30 ? 'rgba(255,221,87,0.3)' : 'rgba(0,255,102,0.3)'}`,
              animation: 'glowPulse 3s ease-in-out infinite',
              color: threatScore > 60 ? 'var(--red)' : threatScore > 30 ? 'var(--yellow)' : 'var(--green)'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700 }}>{threatScore}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>/ 100</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600 }}>
              {threatScore > 60 ? '⚠ High Threat Level' : threatScore > 30 ? 'Moderate Threat' : '✓ Low Threat Level'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Based on {idsAlerts.length} IDS alerts analyzed
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={16} className="card-icon" />
              Recent Alerts
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {idsAlerts.slice(0, 5).map((alert, idx) => (
              <div key={idx} style={{
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span className={`badge ${alert.severity}`}>{alert.severity}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {alert.source_ip} · {alert.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {idsAlerts.length === 0 && (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No alerts detected yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
