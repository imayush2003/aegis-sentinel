import { useState } from 'react'
import { Globe, Search, Server, MapPin } from 'lucide-react'

function OsintView({ fetchWithAuth }) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [dnsRecords, setDnsRecords] = useState(null)
  const [subdomains, setSubdomains] = useState(null)

  const runOsint = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setDnsRecords(null)
    setSubdomains(null)

    try {
      const [dnsRes, subRes] = await Promise.all([
        fetchWithAuth(`/api/osint/dns?domain=${encodeURIComponent(domain)}`),
        fetchWithAuth(`/api/osint/subdomains?domain=${encodeURIComponent(domain)}`)
      ])

      if (dnsRes.ok) {
        const data = await dnsRes.json()
        setDnsRecords(data.records)
      }
      if (subRes.ok) {
        const data = await subRes.json()
        setSubdomains(data.subdomains)
      }
    } catch (err) {
      console.error('OSINT error:', err)
    }

    setLoading(false)
  }

  const getRecordColor = (type) => {
    const colors = { A: 'var(--cyan)', AAAA: 'var(--blue)', MX: 'var(--purple)', TXT: 'var(--yellow)', NS: 'var(--green)' }
    return colors[type] || 'var(--text-secondary)'
  }

  return (
    <div>
      {/* Search */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">
            <Globe size={16} className="card-icon" />
            OSINT Domain Reconnaissance
          </div>
        </div>
        <div className="input-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label>Target Domain</label>
            <input
              id="osint-domain-input"
              className="input-field"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. google.com or sentinel.local"
              onKeyDown={e => e.key === 'Enter' && runOsint()}
            />
          </div>
          <button
            id="osint-run-btn"
            className="btn btn-primary"
            onClick={runOsint}
            disabled={loading || !domain.trim()}
          >
            {loading ? 'Scanning...' : <><Search size={14} /> Recon Scan</>}
          </button>
        </div>
      </div>

      {loading && (
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: '70%', animation: 'scanGrow 2s ease-in-out infinite' }} />
        </div>
      )}

      <div className="grid-2">
        {/* DNS Records */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={16} className="card-icon" />
              DNS Records
            </div>
          </div>

          {dnsRecords ? (
            <div>
              {dnsRecords.map((rec, idx) => (
                <div key={idx} style={{
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: getRecordColor(rec.record_type),
                      minWidth: 40
                    }}>
                      {rec.record_type}
                    </span>
                  </div>
                  {rec.values.map((val, vi) => (
                    <div key={vi} style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      paddingLeft: 48,
                      marginBottom: 2
                    }}>
                      → {val}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Server size={40} style={{ opacity: 0.2 }} />
              <p style={{ marginTop: 12 }}>Enter a domain to fetch DNS records</p>
            </div>
          )}
        </div>

        {/* Subdomains */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <MapPin size={16} className="card-icon" />
              Subdomain Map
            </div>
            {subdomains && <span className="badge open">{subdomains.length} found</span>}
          </div>

          {subdomains ? (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subdomain</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {subdomains.map((sub, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--cyan)' }}>{sub.subdomain}</td>
                      <td>{sub.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <MapPin size={40} style={{ opacity: 0.2 }} />
              <p style={{ marginTop: 12 }}>Subdomain enumeration results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OsintView
